import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { TrialDetails } from '../types.js';
import { scheduleLabel, toGroupDetails, toLessonDetails } from './catalog.js';
import { requireLead } from './lead.js';
import { notify } from './notification.js';
import { addDaysIso, datePart, timePart, todayDateString, weekdayNameRu } from './time.js';

export { requireLead, updateLeadStatus } from './lead.js';

export function toTrialDetails(providers: Providers, trialId: number): TrialDetails {
  const trial = providers.trials.getById(trialId);
  if (!trial) throw new AppError('Пробное занятие не найдено.', 404, 'TRIAL_NOT_FOUND');
  const student = providers.students.getById(trial.studentId);
  const program = providers.programs.getById(trial.programId);
  const teacher = providers.teachers.getById(trial.teacherId);
  const lead = providers.leads.getById(trial.leadId);
  const group = trial.groupId ? providers.groups.getById(trial.groupId) : undefined;
  const branch = group
    ? providers.school.getBranch(group.branchId)
    : providers.school.listBranches()[0];
  if (!student || !program || !teacher || !lead || !branch) {
    throw new AppError('Неполные данные пробного занятия.', 500, 'TRIAL_INCOMPLETE');
  }
  return {
    ...trial,
    student,
    program,
    teacher,
    group: group ?? null,
    branch,
    lead,
  };
}

export function listTrialSlots(
  providers: Providers,
  params: { programId?: number; groupId?: number; from?: string; days?: number },
) {
  const from = params.from ?? todayDateString();
  const to = addDaysIso(from, params.days ?? 14);
  const groups = providers.groups.list({
    programId: params.programId,
    activeOnly: true,
  }).filter((group) => (params.groupId ? group.id === params.groupId : true));

  return groups.flatMap((group) => {
    const details = toGroupDetails(providers, group);
    if (!details || details.freeSeats <= 0) return [];
    return providers.lessons
      .list({ groupId: group.id, from: `${from}T00:00:00+03:00`, to: `${to}T23:59:59+03:00` })
      .filter((lesson) => lesson.status === 'SCHEDULED')
      .map((lesson) => ({
        groupId: group.id,
        teacherId: group.teacherId,
        programId: group.programId,
        branchId: group.branchId,
        startsAt: lesson.startsAt,
        endsAt: lesson.endsAt,
        room: lesson.room,
        teacherName: details.teacher.name,
        groupTitle: group.title,
        freeSeats: details.freeSeats,
        scheduleLabel: `${weekdayNameRu(new Date(lesson.startsAt).getUTCDay())} ${timePart(lesson.startsAt)}`,
      }));
  });
}

export function bookTrial(
  providers: Providers,
  params: {
    leadId: number;
    studentId: number;
    groupId: number;
    startsAt: string;
  },
) {
  return providers.transaction(() => {
    const lead = requireLead(providers, params.leadId);
    const student = providers.students.getById(params.studentId);
    if (!student) throw new AppError('Ученик не найден.', 404, 'STUDENT_NOT_FOUND');
    const group = providers.groups.getById(params.groupId);
    if (!group) throw new AppError('Группа не найдена.', 404, 'GROUP_NOT_FOUND');
    const details = toGroupDetails(providers, group);
    if (!details || details.freeSeats <= 0) {
      throw new AppError('Этот слот уже занят.', 409, 'TRIAL_SLOT_NOT_AVAILABLE');
    }

    const lesson = providers.lessons.list({ groupId: group.id }).find((item) => item.startsAt === params.startsAt);
    if (!lesson || lesson.status !== 'SCHEDULED') {
      throw new AppError('Этот слот уже занят.', 409, 'TRIAL_SLOT_NOT_AVAILABLE');
    }

    const already = providers.trials
      .list({ studentId: student.id })
      .find((trial) => trial.startsAt === params.startsAt && trial.status !== 'CANCELLED');
    if (already) {
      throw new AppError('Этот слот уже занят.', 409, 'TRIAL_SLOT_NOT_AVAILABLE');
    }

    const activeOnSlot = providers.trials.countActiveForSlot(group.id, params.startsAt);
    if (activeOnSlot >= details.freeSeats) {
      throw new AppError('Этот слот уже занят.', 409, 'TRIAL_SLOT_NOT_AVAILABLE');
    }

    const trial = providers.trials.create({
      leadId: lead.id,
      studentId: student.id,
      programId: group.programId,
      teacherId: group.teacherId,
      groupId: group.id,
      startsAt: params.startsAt,
      status: 'BOOKED',
      teacherComment: '',
      recommendedProgramId: null,
      recommendedGroupId: null,
    });
    const updatedLead = providers.leads.update(lead.id, { status: 'TRIAL_BOOKED', programId: group.programId, studentId: student.id });
    providers.crm.updateLead(updatedLead);
    providers.crm.createTrial(trial);
    providers.events.publish('trial_booked', { trialId: trial.id, leadId: lead.id, startsAt: trial.startsAt });
    providers.events.publish('lesson_booked', { trialId: trial.id, studentId: student.id, startsAt: trial.startsAt });
    notify(providers, {
      customerId: lead.customerId,
      type: 'trial_booked',
      title: 'Пробное занятие записано',
      body: `${student.firstName}: ${details.program.title}, ${scheduleLabel(providers, group.id)}.`,
    });
    return toTrialDetails(providers, trial.id);
  });
}

export function listStudentLessons(providers: Providers, studentId: number): ReturnType<typeof toLessonDetails>[] {
  return providers.lessons
    .list({ studentId })
    .map((lesson) => toLessonDetails(providers, lesson.id, studentId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export { datePart };
