import type { NextFunction, Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';
import { publicAppConfig } from '../config.js';
import { AppError, errorBody, statusFromError } from '../errors.js';
import { authMiddleware } from '../middleware/auth.js';
import { bookingRateLimit } from '../middleware/rateLimit.js';
import type { Providers } from '../providers/types.js';
import { listGroupDetails, toGroupDetails, toProgramCard } from '../services/catalog.js';
import { createLead } from '../services/lead.js';
import { qualifyLead } from '../services/matching.js';
import { buildPortal, ensureCustomer, resolveStudent } from '../services/portal.js';
import { getStudentProgress } from '../services/progress.js';
import { toRecommendationDetails } from '../services/recommendation.js';
import { purchaseSubscription } from '../services/subscription.js';
import { bookTrial, listStudentLessons, listTrialSlots, toTrialDetails } from '../services/trial.js';
import type { AgeBand, PreferredTime, ProgramFormat } from '../types.js';

function sendError(res: Response, error: unknown): void {
  res.status(statusFromError(error)).json(errorBody(error));
}

function wrap(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (error) {
      if (error instanceof AppError || error instanceof z.ZodError) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Некорректные данные' },
          });
          return;
        }
        sendError(res, error);
        return;
      }
      next(error);
    }
  };
}

function customerFrom(req: Request, providers: Providers) {
  const auth = req.auth!;
  return ensureCustomer(providers, auth.telegramUser).customer;
}

function studentIdFrom(req: Request): number | undefined {
  const header = req.header('x-student-id');
  const query = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const raw = header || query;
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

const matchSchema = z.object({
  ageBand: z.enum(['4-6', '7-9', '10-12', '13-16', 'adult']),
  age: z.number().int().min(3).max(80).optional(),
  goal: z.string().min(2),
  currentLevel: z.string().min(2),
  preferredFormat: z.enum(['group', 'individual', 'any']),
  preferredDays: z.string().optional(),
  preferredTime: z.enum(['weekday_morning', 'weekday_after_school', 'weekday_evening', 'weekend']),
  notes: z.string().optional(),
  studentId: z.number().int().optional(),
  source: z.string().optional(),
});

const trialSchema = z.object({
  leadId: z.number().int(),
  studentId: z.number().int(),
  groupId: z.number().int(),
  startsAt: z.string().min(10),
});

const purchaseSchema = z.object({
  studentId: z.number().int(),
  planId: z.number().int(),
  leadId: z.number().int().optional(),
  recommendationId: z.number().int().optional(),
});

const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  birthDate: z.string().min(8),
  notes: z.string().optional(),
});

export function createPublicRouter(): Router {
  const router = createRouter();
  router.get('/config', (_req, res) => {
    res.json({ data: publicAppConfig() });
  });
  return router;
}

export function createClientRouter(providers: Providers): Router {
  const router = createRouter();
  router.use(authMiddleware);

  router.get(
    '/school',
    wrap((_req, res) => {
      res.json({ data: providers.school.getSchool() });
    }),
  );
  router.get(
    '/branches',
    wrap((_req, res) => {
      res.json({ data: providers.school.listBranches() });
    }),
  );
  router.get(
    '/programs',
    wrap((_req, res) => {
      res.json({ data: providers.programs.list(true).map((program) => toProgramCard(providers, program)) });
    }),
  );
  router.get(
    '/programs/:id',
    wrap((req, res) => {
      const program = providers.programs.getById(Number(req.params.id));
      if (!program) throw new AppError('Программа не найдена.', 404, 'PROGRAM_NOT_FOUND');
      res.json({ data: toProgramCard(providers, program) });
    }),
  );
  router.get(
    '/programs/:id/groups',
    wrap((req, res) => {
      res.json({ data: listGroupDetails(providers, Number(req.params.id)) });
    }),
  );
  router.get(
    '/subscription-plans',
    wrap((req, res) => {
      const programId = req.query.programId ? Number(req.query.programId) : undefined;
      res.json({ data: providers.subscriptions.listPlans(programId) });
    }),
  );

  router.get(
    '/me',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      res.json({ data: { customer, isDemo: Boolean(req.auth?.isDemo) } });
    }),
  );
  router.get(
    '/me/students',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const { familyStudents } = resolveStudent(providers, customer);
      res.json({ data: familyStudents });
    }),
  );
  router.post(
    '/me/students',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const body = studentSchema.parse(req.body);
      const family =
        providers.families.getByCustomerId(customer.id) ??
        providers.families.create(customer.id, customer.lastName || customer.firstName);
      const student = providers.students.create({
        familyId: family.id,
        firstName: body.firstName,
        lastName: body.lastName ?? customer.lastName,
        birthDate: body.birthDate,
        notes: body.notes ?? '',
        active: true,
      });
      providers.crm.upsertStudent(student);
      res.status(201).json({ data: student });
    }),
  );
  router.get(
    '/me/portal',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const { familyStudents, selected } = resolveStudent(providers, customer, studentIdFrom(req));
      res.json({ data: buildPortal(providers, customer, selected, familyStudents) });
    }),
  );
  router.get(
    '/me/notifications',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      res.json({ data: providers.notifications.list(customer.id) });
    }),
  );
  router.get(
    '/me/trials',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const { familyStudents } = resolveStudent(providers, customer);
      const ids = new Set(familyStudents.map((item) => item.id));
      const trials = providers.trials
        .list()
        .filter((trial) => ids.has(trial.studentId))
        .map((trial) => toTrialDetails(providers, trial.id));
      res.json({ data: trials });
    }),
  );

  router.post(
    '/program-matching',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const body = matchSchema.parse(req.body);
      const result = qualifyLead(providers, customer, {
        ...body,
        ageBand: body.ageBand as AgeBand,
        preferredFormat: body.preferredFormat as ProgramFormat,
        preferredTime: body.preferredTime as PreferredTime,
      });
      res.status(201).json({ data: result });
    }),
  );
  router.post(
    '/leads',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const body = z
        .object({
          studentId: z.number().int().optional(),
          programId: z.number().int().optional(),
          source: z.string().optional(),
        })
        .parse(req.body ?? {});
      res.status(201).json({ data: createLead(providers, customer, body) });
    }),
  );
  router.get(
    '/trial-slots',
    wrap((req, res) => {
      res.json({
        data: listTrialSlots(providers, {
          programId: req.query.programId ? Number(req.query.programId) : undefined,
          groupId: req.query.groupId ? Number(req.query.groupId) : undefined,
        }),
      });
    }),
  );
  router.post(
    '/trials',
    bookingRateLimit,
    wrap((req, res) => {
      const body = trialSchema.parse(req.body);
      res.status(201).json({ data: bookTrial(providers, body) });
    }),
  );

  router.get(
    '/students/:studentId/lessons',
    wrap((req, res) => {
      res.json({ data: listStudentLessons(providers, Number(req.params.studentId)) });
    }),
  );
  router.get(
    '/students/:studentId/subscriptions',
    wrap((req, res) => {
      const studentId = Number(req.params.studentId);
      const subscriptions = providers.subscriptions.listByStudent(studentId).map((item) => {
        const plan = providers.subscriptions.getPlan(item.subscriptionPlanId)!;
        const program = providers.programs.getById(plan.programId)!;
        return { ...item, plan, program, ledger: providers.subscriptions.listLedger(item.id) };
      });
      res.json({ data: subscriptions });
    }),
  );
  router.get(
    '/students/:studentId/progress',
    wrap((req, res) => {
      res.json({ data: getStudentProgress(providers, Number(req.params.studentId)) });
    }),
  );
  router.get(
    '/students/:studentId/homework',
    wrap((req, res) => {
      const studentId = Number(req.params.studentId);
      const lessons = providers.lessons.list({ studentId });
      res.json({ data: providers.homework.listByLessons(lessons.map((item) => item.id)) });
    }),
  );
  router.get(
    '/students/:studentId/materials',
    wrap((req, res) => {
      const studentId = Number(req.params.studentId);
      const lessons = providers.lessons.list({ studentId });
      res.json({ data: providers.homework.listMaterials(lessons.map((item) => item.id)) });
    }),
  );
  router.get(
    '/students/:studentId/recommendations',
    wrap((req, res) => {
      const recs = providers.recommendations
        .listByStudent(Number(req.params.studentId))
        .map((item) => toRecommendationDetails(providers, item.id));
      res.json({ data: recs });
    }),
  );
  router.post(
    '/subscriptions/purchase',
    wrap((req, res) => {
      const customer = customerFrom(req, providers);
      const body = purchaseSchema.parse(req.body);
      res.status(201).json({ data: purchaseSubscription(providers, { ...body, customerId: customer.id }) });
    }),
  );

  router.get(
    '/groups/:id',
    wrap((req, res) => {
      const group = providers.groups.getById(Number(req.params.id));
      if (!group) throw new AppError('Группа не найдена.', 404, 'GROUP_NOT_FOUND');
      res.json({ data: toGroupDetails(providers, group) });
    }),
  );

  return router;
}
