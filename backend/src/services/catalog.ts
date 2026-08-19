import type { Providers } from '../providers/types.js';
import type { Group, GroupDetails, LessonDetails, Program, ProgramCard } from '../types.js';
import { weekdayNameRu } from './time.js';

export function scheduleLabel(providers: Providers, groupId: number): string {
  const schedules = providers.groups.listSchedules(groupId);
  if (!schedules.length) return '';
  const days = [...new Set(schedules.map((item) => weekdayNameRu(item.weekday)))].join(' / ');
  return `${days} ${schedules[0].startTime}`;
}

export function toGroupDetails(providers: Providers, group: Group): GroupDetails | null {
  const program = providers.programs.getById(group.programId);
  const teacher = providers.teachers.getById(group.teacherId);
  const branch = providers.school.getBranch(group.branchId);
  if (!program || !teacher || !branch) return null;
  const schedules = providers.groups.listSchedules(group.id);
  const enrolledCount = providers.groups.countEnrolled(group.id);
  const upcoming = providers.lessons
    .list({ groupId: group.id, from: new Date().toISOString() })
    .find((lesson) => lesson.status === 'SCHEDULED');
  return {
    ...group,
    program,
    teacher,
    branch,
    schedule: {
      weekdays: schedules.map((item) => item.weekday),
      labels: schedules.map((item) => weekdayNameRu(item.weekday)),
      startTime: schedules[0]?.startTime ?? '',
      room: schedules[0]?.room ?? '',
    },
    enrolledCount,
    freeSeats: Math.max(0, group.capacity - enrolledCount),
    nextLessonAt: upcoming?.startsAt ?? null,
  };
}

export function listGroupDetails(providers: Providers, programId?: number): GroupDetails[] {
  return providers.groups
    .list({ programId, activeOnly: true })
    .map((group) => toGroupDetails(providers, group))
    .filter((item): item is GroupDetails => Boolean(item));
}

export function toProgramCard(providers: Providers, program: Program): ProgramCard {
  const groups = listGroupDetails(providers, program.id);
  const next = groups.find((group) => group.nextLessonAt)?.schedule;
  const label = groups[0] ? scheduleLabel(providers, groups[0].id) : next ? `${next.labels.join(' / ')} ${next.startTime}` : '';
  return {
    ...program,
    nextSchedule: label,
    cta: 'Записаться на пробное',
  };
}

export function toLessonDetails(providers: Providers, lessonId: number, studentId?: number): LessonDetails | null {
  const lesson = providers.lessons.getById(lessonId);
  if (!lesson) return null;
  const group = providers.groups.getById(lesson.groupId);
  const program = group ? providers.programs.getById(group.programId) : undefined;
  const teacher = providers.teachers.getById(lesson.teacherId);
  const branch = providers.school.getBranch(lesson.branchId);
  if (!group || !program || !teacher || !branch) return null;
  const attendance = studentId
    ? providers.attendance.list({ lessonId: lesson.id, studentId })[0] ?? null
    : null;
  return { ...lesson, group, program, teacher, branch, attendance };
}
