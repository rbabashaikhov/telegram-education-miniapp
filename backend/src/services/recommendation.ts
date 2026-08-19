import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { RecommendationDetails, TrialStatus } from '../types.js';
import { scheduleLabel, toGroupDetails } from './catalog.js';
import { toTrialDetails, updateLeadStatus } from './trial.js';

export function toRecommendationDetails(providers: Providers, id: number): RecommendationDetails {
  const rec = providers.recommendations.getById(id);
  if (!rec) throw new AppError('Рекомендация не найдена.', 404, 'RECOMMENDATION_NOT_FOUND');
  const program = providers.programs.getById(rec.programId);
  if (!program) throw new AppError('Программа не найдена.', 404, 'PROGRAM_NOT_FOUND');
  const group = rec.groupId ? providers.groups.getById(rec.groupId) : undefined;
  const teacher = rec.teacherId ? providers.teachers.getById(rec.teacherId) : null;
  const plan = rec.subscriptionPlanId ? providers.subscriptions.getPlan(rec.subscriptionPlanId) : null;
  return {
    ...rec,
    program,
    group: group ? toGroupDetails(providers, group) : null,
    teacher: teacher ?? null,
    plan: plan ?? null,
  };
}

export function updateTrial(
  providers: Providers,
  trialId: number,
  patch: {
    status?: TrialStatus;
    teacherComment?: string;
    recommendedProgramId?: number | null;
    recommendedGroupId?: number | null;
  },
) {
  return providers.transaction(() => {
    const current = providers.trials.getById(trialId);
    if (!current) throw new AppError('Пробное занятие не найдено.', 404, 'TRIAL_NOT_FOUND');
    const trial = providers.trials.update(trialId, patch);
    if (patch.status === 'ATTENDED' || patch.status === 'COMPLETED') {
      updateLeadStatus(providers, trial.leadId, 'TRIAL_ATTENDED');
      providers.events.publish('trial_attended', { trialId: trial.id, leadId: trial.leadId });
    }
    if (patch.status === 'NO_SHOW') {
      updateLeadStatus(providers, trial.leadId, 'LOST');
      providers.events.publish('trial_no_show', { trialId: trial.id, leadId: trial.leadId });
    }
    return toTrialDetails(providers, trial.id);
  });
}

export function createRecommendation(
  providers: Providers,
  trialId: number,
  params: {
    programId?: number;
    groupId?: number;
    teacherId?: number;
    subscriptionPlanId?: number;
    text?: string;
  },
) {
  return providers.transaction(() => {
    const trial = providers.trials.getById(trialId);
    if (!trial) throw new AppError('Пробное занятие не найдено.', 404, 'TRIAL_NOT_FOUND');
    const programId = params.programId ?? trial.recommendedProgramId ?? trial.programId;
    const groupId = params.groupId ?? trial.recommendedGroupId ?? trial.groupId;
    const teacherId = params.teacherId ?? trial.teacherId;
    const program = providers.programs.getById(programId);
    if (!program) throw new AppError('Программа не найдена.', 404, 'PROGRAM_NOT_FOUND');
    const plans = providers.subscriptions.listPlans(programId);
    const plan = params.subscriptionPlanId
      ? providers.subscriptions.getPlan(params.subscriptionPlanId)
      : plans[0];
    const teacher = providers.teachers.getById(teacherId);
    const group = groupId ? providers.groups.getById(groupId) : undefined;
    const text =
      params.text ||
      `${providers.students.getById(trial.studentId)?.firstName ?? 'Ученику'} подходит: ${program.title}` +
        (group ? `. ${scheduleLabel(providers, group.id)}` : '') +
        (teacher ? `. Преподаватель: ${teacher.name}` : '') +
        (plan ? `. ${plan.title} — ${plan.price.toLocaleString('ru-RU')} ₽` : '');

    providers.trials.update(trialId, {
      status: trial.status === 'BOOKED' || trial.status === 'CONFIRMED' ? 'COMPLETED' : trial.status,
      teacherComment: trial.teacherComment,
      recommendedProgramId: programId,
      recommendedGroupId: groupId,
    });
    const rec = providers.recommendations.create({
      studentId: trial.studentId,
      trialLessonId: trial.id,
      programId,
      groupId: groupId ?? null,
      teacherId: teacherId ?? null,
      subscriptionPlanId: plan?.id ?? null,
      text,
      status: 'NEW',
    });
    updateLeadStatus(providers, trial.leadId, 'OFFERED');
    providers.events.publish('recommendation_created', {
      recommendationId: rec.id,
      trialId: trial.id,
      studentId: trial.studentId,
    });
    const lead = providers.leads.getById(trial.leadId);
    if (lead) {
      providers.notifications.enqueue({
        customerId: lead.customerId,
        type: 'recommendation',
        title: 'Рекомендация после пробного',
        body: `${teacher?.name ?? 'Преподаватель'} подготовил рекомендацию для ${providers.students.getById(trial.studentId)?.firstName ?? 'ученика'}.`,
      });
    }
    return toRecommendationDetails(providers, rec.id);
  });
}
