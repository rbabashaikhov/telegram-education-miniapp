import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { AttendanceStatus } from '../types.js';
import { debitLesson } from './subscription.js';

export function markAttendance(
  providers: Providers,
  params: { lessonId: number; studentId: number; status: AttendanceStatus; comment?: string },
) {
  return providers.transaction(() => {
    const lesson = providers.lessons.getById(params.lessonId);
    if (!lesson) throw new AppError('Занятие не найдено.', 404, 'LESSON_NOT_FOUND');
    const student = providers.students.getById(params.studentId);
    if (!student) throw new AppError('Ученик не найден.', 404, 'STUDENT_NOT_FOUND');

    const attendance = providers.attendance.upsert({
      lessonId: lesson.id,
      studentId: student.id,
      status: params.status,
      comment: params.comment ?? '',
    });

    if (params.status === 'PRESENT' || params.status === 'ABSENT') {
      debitLesson(providers, { studentId: student.id, lessonId: lesson.id });
    }
    if (params.status === 'ABSENT') {
      providers.events.publish('student_absent', { studentId: student.id, lessonId: lesson.id });
      const absences = providers.attendance.countByStatus(student.id, 'ABSENT');
      if (absences >= 3) {
        providers.events.publish('student_inactive', { studentId: student.id, absences });
      }
    }
    return attendance;
  });
}
