import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { StudentProgress } from '../types.js';

export function getStudentProgress(providers: Providers, studentId: number, programId?: number): StudentProgress {
  const student = providers.students.getById(studentId);
  if (!student) throw new AppError('Ученик не найден.', 404, 'STUDENT_NOT_FOUND');
  const enrollment = providers.enrollments.list({ studentId, status: 'ACTIVE' })[0];
  const resolvedProgramId = programId ?? enrollment?.programId;
  if (!resolvedProgramId) {
    throw new AppError('Нет активной программы для прогресса.', 404, 'PROGRESS_NOT_FOUND');
  }
  const program = providers.programs.getById(resolvedProgramId);
  if (!program) throw new AppError('Программа не найдена.', 404, 'PROGRAM_NOT_FOUND');

  const attendance = providers.attendance.list({ studentId });
  const held = attendance.filter((item) => item.status === 'PRESENT' || item.status === 'ABSENT').length;
  const present = attendance.filter((item) => item.status === 'PRESENT').length;
  const records = providers.progress.listRecords(studentId, resolvedProgramId);
  const topics = providers.progress.listTopics(studentId, resolvedProgramId);

  return {
    studentId,
    programId: resolvedProgramId,
    programTitle: program.title,
    lessonsHeld: held,
    attendancePercent: held ? Math.round((present / held) * 100) : 0,
    currentLevel: program.level,
    latestComment: records[0]?.summary ?? 'Преподаватель ещё не оставил комментарий.',
    topics,
  };
}
