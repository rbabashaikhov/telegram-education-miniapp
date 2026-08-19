import type { Providers } from '../providers/types.js';
import type { Customer, Portal, Student, TelegramUser } from '../types.js';
import { toLessonDetails, toProgramCard } from './catalog.js';
import { toRecommendationDetails } from './recommendation.js';
import { refreshSubscriptionStatus } from './subscription.js';

export function ensureCustomer(providers: Providers, user: TelegramUser): { customer: Customer; created: boolean } {
  const result = providers.customers.upsert(user);
  if (result.created) {
    providers.families.create(result.customer.id, result.customer.lastName || result.customer.firstName);
    providers.crm.upsertCustomer(result.customer);
  }
  return result;
}

export function resolveStudent(
  providers: Providers,
  customer: Customer,
  requestedId?: number | null,
): { familyStudents: Student[]; selected: Student | null } {
  const family = providers.families.getByCustomerId(customer.id);
  const familyStudents = family ? providers.students.listByFamily(family.id) : [];
  const selected =
    (requestedId ? familyStudents.find((item) => item.id === requestedId) : undefined) ?? familyStudents[0] ?? null;
  return { familyStudents, selected };
}

export function buildPortal(
  providers: Providers,
  customer: Customer,
  selectedStudent: Student | null,
  familyStudents: Student[],
): Portal {
  const school = providers.school.getSchool();
  const branch = providers.school.listBranches()[0];
  const family = providers.families.getByCustomerId(customer.id)!;
  const enrollments = selectedStudent
    ? providers.enrollments.list({ studentId: selectedStudent.id, status: 'ACTIVE' })
    : [];
  const isNewCustomer = familyStudents.every(
    (student) => providers.enrollments.list({ studentId: student.id, status: 'ACTIVE' }).length === 0,
  );

  const nextLesson = selectedStudent
    ? providers.lessons
        .list({ studentId: selectedStudent.id, from: new Date().toISOString() })
        .map((lesson) => toLessonDetails(providers, lesson.id, selectedStudent.id))
        .find((item) => item && item.status === 'SCHEDULED') ?? null
    : null;

  const familyMembers = familyStudents.map((student) => {
    const enrollment = providers.enrollments.list({ studentId: student.id, status: 'ACTIVE' })[0];
    const program = enrollment ? providers.programs.getById(enrollment.programId) : undefined;
    return { student, programTitle: program?.title ?? null };
  });

  const subscriptions = selectedStudent
    ? providers.subscriptions.listByStudent(selectedStudent.id).map((item) => {
        const refreshed = refreshSubscriptionStatus(providers, item.id);
        const plan = providers.subscriptions.getPlan(refreshed.subscriptionPlanId)!;
        const program = providers.programs.getById(plan.programId)!;
        return {
          ...refreshed,
          plan,
          program,
          nextLessonAt: nextLesson?.startsAt ?? null,
          ledger: providers.subscriptions.listLedger(refreshed.id),
        };
      })
    : [];

  const recommendations = selectedStudent
    ? providers.recommendations.listByStudent(selectedStudent.id).map((item) => toRecommendationDetails(providers, item.id))
    : [];

  return {
    school,
    branch,
    customer,
    family,
    students: familyStudents,
    familyMembers,
    selectedStudent,
    isNewCustomer: isNewCustomer && enrollments.length === 0,
    nextLesson,
    subscriptions,
    recommendations,
    notifications: providers.notifications.list(customer.id).slice(0, 8),
    programs: providers.programs.list(true).map((program) => toProgramCard(providers, program)),
  };
}
