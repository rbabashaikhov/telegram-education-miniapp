export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
}

export interface AuthContext {
  telegramUser: TelegramUser;
  isDemo: boolean;
}

export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'TRIAL_BOOKED'
  | 'TRIAL_ATTENDED'
  | 'OFFERED'
  | 'CONVERTED'
  | 'LOST';

export type TrialStatus = 'BOOKED' | 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED';
export type RecommendationStatus = 'NEW' | 'VIEWED' | 'ACCEPTED' | 'DECLINED';
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'FROZEN' | 'CANCELLED';
export type LedgerType = 'PURCHASE' | 'LESSON_DEBIT' | 'REFUND' | 'MANUAL_ADJUSTMENT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'CANCELLED';
export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type MaterialType = 'LINK' | 'PDF' | 'AUDIO' | 'VIDEO' | 'TEXT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type NotificationStatus = 'UNREAD' | 'READ';
export type GroupStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type LessonStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AgeBand = '4-6' | '7-9' | '10-12' | '13-16' | 'adult';
export type ProgramFormat = 'group' | 'individual' | 'any';
export type PreferredTime = 'weekday_morning' | 'weekday_after_school' | 'weekday_evening' | 'weekend';

export type OutboundEventName =
  | 'lead_created'
  | 'lead_qualified'
  | 'trial_booked'
  | 'trial_attended'
  | 'trial_no_show'
  | 'recommendation_created'
  | 'enrollment_created'
  | 'subscription_purchased'
  | 'subscription_low_balance'
  | 'subscription_expiring'
  | 'lesson_booked'
  | 'student_absent'
  | 'student_inactive'
  | 'renewal_due';

export interface School {
  id: number;
  name: string;
  description: string;
  phone: string;
  email: string;
  timezone: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: number;
  schoolId: number;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  active: boolean;
}

export interface Customer {
  id: number;
  telegramUserId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Family {
  id: number;
  primaryCustomerId: number;
  name: string;
}

export interface Student {
  id: number;
  familyId: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  notes: string;
  active: boolean;
}

export interface Program {
  id: number;
  title: string;
  description: string;
  ageFrom: number;
  ageTo: number;
  level: string;
  durationMinutes: number;
  format: ProgramFormat;
  active: boolean;
  priceFrom: number;
}

export interface Teacher {
  id: number;
  name: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  active: boolean;
}

export interface Group {
  id: number;
  programId: number;
  teacherId: number;
  branchId: number;
  title: string;
  capacity: number;
  ageFrom: number;
  ageTo: number;
  level: string;
  status: GroupStatus;
}

export interface GroupSchedule {
  id: number;
  groupId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Lesson {
  id: number;
  groupId: number;
  teacherId: number;
  branchId: number;
  startsAt: string;
  endsAt: string;
  room: string;
  status: LessonStatus;
}

export interface Lead {
  id: number;
  customerId: number;
  studentId: number | null;
  programId: number | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
  convertedAt: string | null;
}

export interface LeadQualification {
  id: number;
  leadId: number;
  age: number;
  ageBand: AgeBand;
  currentLevel: string;
  goal: string;
  preferredFormat: ProgramFormat;
  preferredDays: string;
  preferredTime: PreferredTime;
  notes: string;
}

export interface TrialLesson {
  id: number;
  leadId: number;
  studentId: number;
  programId: number;
  teacherId: number;
  groupId: number | null;
  startsAt: string;
  status: TrialStatus;
  teacherComment: string;
  recommendedProgramId: number | null;
  recommendedGroupId: number | null;
}

export interface Recommendation {
  id: number;
  studentId: number;
  trialLessonId: number | null;
  programId: number;
  groupId: number | null;
  teacherId: number | null;
  subscriptionPlanId: number | null;
  text: string;
  status: RecommendationStatus;
  createdAt: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  programId: number;
  groupId: number | null;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface SubscriptionPlan {
  id: number;
  title: string;
  programId: number;
  lessonCount: number;
  validityDays: number;
  price: number;
  currency: string;
  active: boolean;
}

export interface StudentSubscription {
  id: number;
  studentId: number;
  subscriptionPlanId: number;
  purchasedLessons: number;
  remainingLessons: number;
  startsAt: string;
  expiresAt: string;
  status: SubscriptionStatus;
}

export interface SubscriptionLedger {
  id: number;
  subscriptionId: number;
  type: LedgerType;
  quantity: number;
  lessonId: number | null;
  createdAt: string;
}

export interface Attendance {
  id: number;
  lessonId: number;
  studentId: number;
  status: AttendanceStatus;
  comment: string;
}

export interface ProgressRecord {
  id: number;
  studentId: number;
  programId: number;
  lessonId: number | null;
  teacherId: number | null;
  summary: string;
  score: number | null;
  createdAt: string;
}

export interface TopicProgress {
  id: number;
  studentId: number;
  programId: number;
  topic: string;
  status: TopicStatus;
}

export interface Homework {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  dueAt: string;
}

export interface LearningMaterial {
  id: number;
  lessonId: number;
  title: string;
  type: MaterialType;
  url: string;
}

export interface Payment {
  id: number;
  customerId: number;
  studentId: number;
  subscriptionId: number | null;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  customerId: number;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface DomainEvent {
  id: number;
  name: OutboundEventName;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface CrmSyncRecord {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface GroupScheduleSummary {
  weekdays: number[];
  labels: string[];
  startTime: string;
  room: string;
}

export interface GroupDetails extends Group {
  program: Program;
  teacher: Teacher;
  branch: Branch;
  schedule: GroupScheduleSummary;
  enrolledCount: number;
  freeSeats: number;
  nextLessonAt: string | null;
}

export interface ProgramCard extends Program {
  nextSchedule: string;
  cta: string;
}

export interface LessonDetails extends Lesson {
  group: Group;
  program: Program;
  teacher: Teacher;
  branch: Branch;
  attendance: Attendance | null;
}

export interface TrialDetails extends TrialLesson {
  student: Student;
  program: Program;
  teacher: Teacher;
  group: Group | null;
  branch: Branch;
  lead: Lead;
}

export interface SubscriptionDetails extends StudentSubscription {
  plan: SubscriptionPlan;
  program: Program;
  nextLessonAt: string | null;
  ledger: SubscriptionLedger[];
}

export interface FamilyMember {
  student: Student;
  programTitle: string | null;
}

export interface RecommendationDetails extends Recommendation {
  program: Program;
  group: GroupDetails | null;
  teacher: Teacher | null;
  plan: SubscriptionPlan | null;
}

export interface TrialSlot {
  groupId: number;
  teacherId: number;
  programId: number;
  branchId: number;
  startsAt: string;
  endsAt: string;
  room: string;
  teacherName: string;
  groupTitle: string;
  freeSeats: number;
  scheduleLabel: string;
}

export interface MatchInput {
  ageBand: AgeBand;
  age?: number;
  goal: string;
  currentLevel: string;
  preferredFormat: ProgramFormat;
  preferredDays?: string;
  preferredTime: PreferredTime;
  notes?: string;
  studentId?: number;
  source?: string;
}

export interface MatchResult {
  lead: Lead;
  qualification: LeadQualification;
  recommendations: GroupDetails[];
}

export interface StudentProgress {
  studentId: number;
  programId: number;
  programTitle: string;
  lessonsHeld: number;
  attendancePercent: number;
  currentLevel: string;
  latestComment: string;
  topics: TopicProgress[];
}

export interface FunnelMetrics {
  newLeads: number;
  qualified: number;
  trialBooked: number;
  attended: number;
  offered: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export interface AttentionItem {
  kind: 'expiring' | 'absent' | 'no_offer' | 'low_balance';
  title: string;
  detail: string;
  count: number;
}

export interface AdminDashboard {
  kpis: {
    newLeads: number;
    trials: number;
    newStudents: number;
    renewals: number;
  };
  funnel: FunnelMetrics;
  attention: AttentionItem[];
}

export interface Portal {
  school: School;
  branch: Branch;
  customer: Customer;
  family: Family;
  students: Student[];
  familyMembers: FamilyMember[];
  selectedStudent: Student | null;
  isNewCustomer: boolean;
  nextLesson: LessonDetails | null;
  subscriptions: SubscriptionDetails[];
  recommendations: RecommendationDetails[];
  notifications: NotificationRecord[];
  programs: ProgramCard[];
}
