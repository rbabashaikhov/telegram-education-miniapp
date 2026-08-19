import type { NextFunction, Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';
import { AppError, errorBody, statusFromError } from '../errors.js';
import { adminReadMiddleware, adminWriteMiddleware } from '../middleware/adminAuth.js';
import type { Providers } from '../providers/types.js';
import { markAttendance } from '../services/attendance.js';
import { adminDashboard } from '../services/dashboard.js';
import { createRecommendation, toRecommendationDetails, updateTrial } from '../services/recommendation.js';
import { scanRetention } from '../services/retention.js';
import { toTrialDetails, updateLeadStatus } from '../services/trial.js';
import type { AttendanceStatus, LeadStatus, TrialStatus } from '../types.js';

function wrap(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Некорректные данные' },
        });
        return;
      }
      if (error instanceof AppError) {
        res.status(statusFromError(error)).json(errorBody(error));
        return;
      }
      next(error);
    }
  };
}

function leadView(providers: Providers, leadId: number) {
  const lead = providers.leads.getById(leadId);
  if (!lead) throw new AppError('Лид не найден.', 404, 'LEAD_NOT_FOUND');
  const customer = providers.customers.getById(lead.customerId);
  const student = lead.studentId ? providers.students.getById(lead.studentId) : null;
  const program = lead.programId ? providers.programs.getById(lead.programId) : null;
  const qualification = providers.leads.getQualification(lead.id);
  const trial = providers.trials.list({ leadId: lead.id })[0];
  return {
    ...lead,
    customer,
    student,
    program,
    qualification,
    trial: trial ? toTrialDetails(providers, trial.id) : null,
  };
}

function studentAdminView(providers: Providers, studentId: number) {
  const student = providers.students.getById(studentId);
  if (!student) throw new AppError('Ученик не найден.', 404, 'STUDENT_NOT_FOUND');
  const family = providers.families.getById(student.familyId);
  const parent = family ? providers.customers.getById(family.primaryCustomerId) : null;
  const enrollment = providers.enrollments.list({ studentId, status: 'ACTIVE' })[0];
  const program = enrollment ? providers.programs.getById(enrollment.programId) : null;
  const group = enrollment?.groupId ? providers.groups.getById(enrollment.groupId) : null;
  const subscription = providers.subscriptions.listByStudent(studentId)[0] ?? null;
  const attendance = providers.attendance.list({ studentId });
  const held = attendance.filter((item) => item.status === 'PRESENT' || item.status === 'ABSENT').length;
  const present = attendance.filter((item) => item.status === 'PRESENT').length;
  return {
    student,
    parent,
    program,
    group,
    subscription,
    remainingLessons: subscription?.remainingLessons ?? null,
    attendancePercent: held ? Math.round((present / held) * 100) : null,
  };
}

export function createAdminRouter(providers: Providers): Router {
  const router = createRouter();
  router.use(adminReadMiddleware);

  router.get(
    '/dashboard',
    wrap((_req, res) => {
      res.json({ data: adminDashboard(providers) });
    }),
  );
  router.get(
    '/leads',
    wrap((req, res) => {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const leads = providers.leads
        .list(status ? { status: status as LeadStatus } : undefined)
        .map((lead) => leadView(providers, lead.id));
      res.json({ data: leads });
    }),
  );
  router.get(
    '/leads/:id',
    wrap((req, res) => {
      res.json({ data: leadView(providers, Number(req.params.id)) });
    }),
  );
  router.get(
    '/trials',
    wrap((_req, res) => {
      res.json({ data: providers.trials.list().map((trial) => toTrialDetails(providers, trial.id)) });
    }),
  );
  router.get(
    '/students',
    wrap((_req, res) => {
      res.json({ data: providers.students.listAll().map((student) => studentAdminView(providers, student.id)) });
    }),
  );
  router.get(
    '/events',
    wrap((_req, res) => {
      res.json({ data: providers.events.list(80) });
    }),
  );
  router.get(
    '/retention',
    wrap((_req, res) => {
      res.json({ data: scanRetention(providers) });
    }),
  );

  router.patch(
    '/leads/:id',
    adminWriteMiddleware,
    wrap((req, res) => {
      const body = z
        .object({
          status: z.enum(['NEW', 'QUALIFIED', 'TRIAL_BOOKED', 'TRIAL_ATTENDED', 'OFFERED', 'CONVERTED', 'LOST']),
        })
        .parse(req.body);
      res.json({ data: leadView(providers, updateLeadStatus(providers, Number(req.params.id), body.status).id) });
    }),
  );
  router.patch(
    '/trials/:id',
    adminWriteMiddleware,
    wrap((req, res) => {
      const body = z
        .object({
          status: z
            .enum(['BOOKED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED', 'COMPLETED'])
            .optional(),
          teacherComment: z.string().optional(),
          recommendedProgramId: z.number().int().nullable().optional(),
          recommendedGroupId: z.number().int().nullable().optional(),
        })
        .parse(req.body);
      res.json({
        data: updateTrial(providers, Number(req.params.id), {
          ...body,
          status: body.status as TrialStatus | undefined,
        }),
      });
    }),
  );
  router.post(
    '/trials/:id/recommendation',
    adminWriteMiddleware,
    wrap((req, res) => {
      const body = z
        .object({
          programId: z.number().int().optional(),
          groupId: z.number().int().optional(),
          teacherId: z.number().int().optional(),
          subscriptionPlanId: z.number().int().optional(),
          text: z.string().optional(),
        })
        .parse(req.body ?? {});
      res.status(201).json({ data: createRecommendation(providers, Number(req.params.id), body) });
    }),
  );
  router.post(
    '/attendance',
    adminWriteMiddleware,
    wrap((req, res) => {
      const body = z
        .object({
          lessonId: z.number().int(),
          studentId: z.number().int(),
          status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'CANCELLED']),
          comment: z.string().optional(),
        })
        .parse(req.body);
      res.json({
        data: markAttendance(providers, { ...body, status: body.status as AttendanceStatus }),
      });
    }),
  );
  router.get(
    '/recommendations/:id',
    wrap((req, res) => {
      res.json({ data: toRecommendationDetails(providers, Number(req.params.id)) });
    }),
  );

  return router;
}

export function createDemoAdminRouter(providers: Providers): Router {
  const router = createRouter();
  router.get(
    '/dashboard',
    wrap((_req, res) => {
      res.json({ data: adminDashboard(providers) });
    }),
  );
  router.get(
    '/leads',
    wrap((_req, res) => {
      res.json({ data: providers.leads.list().map((lead) => leadView(providers, lead.id)) });
    }),
  );
  router.get(
    '/trials',
    wrap((_req, res) => {
      res.json({ data: providers.trials.list().map((trial) => toTrialDetails(providers, trial.id)) });
    }),
  );
  router.get(
    '/students',
    wrap((_req, res) => {
      res.json({ data: providers.students.listAll().map((student) => studentAdminView(providers, student.id)) });
    }),
  );
  return router;
}
