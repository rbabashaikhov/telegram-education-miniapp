import type { Providers } from '../providers/types.js';
import type { Enrollment } from '../types.js';

export function ensureEnrollment(
  providers: Providers,
  params: { studentId: number; programId: number; groupId?: number | null },
): { enrollment: Enrollment; created: boolean } {
  const existing = providers.enrollments.list({
    studentId: params.studentId,
    programId: params.programId,
    status: 'ACTIVE',
  })[0];
  if (existing) return { enrollment: existing, created: false };

  const enrollment = providers.enrollments.create({
    studentId: params.studentId,
    programId: params.programId,
    groupId: params.groupId ?? null,
    status: 'ACTIVE',
  });
  providers.crm.createEnrollment(enrollment);
  providers.events.publish('enrollment_created', {
    enrollmentId: enrollment.id,
    studentId: params.studentId,
  });
  return { enrollment, created: true };
}
