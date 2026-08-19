export interface AppConfig {
  businessName: string;
  appTitle: string;
  appDescription: string;
  timezone: string;
  demoMode: boolean;
  adminProtected: boolean;
  branding: { accent: string; logoUrl: string | null };
  features: { demoTour: boolean; demoAdminPreview: boolean };
}

export interface School {
  id: number;
  name: string;
  description: string;
  phone: string;
  email: string;
  timezone: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
}

export interface Customer {
  id: number;
  telegramUserId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
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
  format: string;
  priceFrom: number;
  nextSchedule?: string;
  cta?: string;
}

export interface Teacher {
  id: number;
  name: string;
  bio: string;
  specialties: string[];
}

export interface GroupDetails {
  id: number;
  programId: number;
  title: string;
  capacity: number;
  ageFrom: number;
  ageTo: number;
  level: string;
  program: Program;
  teacher: Teacher;
  branch: Branch;
  schedule: { weekdays: number[]; labels: string[]; startTime: string; room: string };
  enrolledCount: number;
  freeSeats: number;
  nextLessonAt: string | null;
}

export interface LessonDetails {
  id: number;
  startsAt: string;
  endsAt: string;
  room: string;
  status: string;
  group: { id: number; title: string };
  program: Program;
  teacher: Teacher;
  branch: Branch;
  attendance: { status: string; comment: string } | null;
}

export interface SubscriptionDetails {
  id: number;
  purchasedLessons: number;
  remainingLessons: number;
  startsAt: string;
  expiresAt: string;
  status: string;
  plan: { id: number; title: string; lessonCount: number; price: number; validityDays: number; programId: number };
  program: Program;
  nextLessonAt: string | null;
  ledger?: Array<{ id: number; type: string; quantity: number; createdAt: string }>;
}

export interface RecommendationDetails {
  id: number;
  text: string;
  status: string;
  program: Program;
  group: GroupDetails | null;
  teacher: Teacher | null;
  plan: { id: number; title: string; price: number; lessonCount: number } | null;
  studentId: number;
}

export interface NotificationRecord {
  id: number;
  type: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface Portal {
  school: School;
  branch: Branch;
  customer: Customer;
  family: Family;
  students: Student[];
  familyMembers?: Array<{ student: Student; programTitle: string | null }>;
  selectedStudent: Student | null;
  isNewCustomer: boolean;
  nextLesson: LessonDetails | null;
  subscriptions: SubscriptionDetails[];
  recommendations: RecommendationDetails[];
  notifications: NotificationRecord[];
  programs: Program[];
}

export interface TrialSlot {
  groupId: number;
  teacherId: number;
  programId: number;
  startsAt: string;
  endsAt: string;
  room: string;
  teacherName: string;
  groupTitle: string;
  freeSeats: number;
  scheduleLabel: string;
}

export interface TrialDetails {
  id: number;
  startsAt: string;
  status: string;
  teacherComment: string;
  student: Student;
  program: Program;
  teacher: Teacher;
  group: { title: string } | null;
  branch: Branch;
}

export interface MatchResult {
  lead: { id: number; status: string; studentId: number | null; programId: number | null };
  qualification: { age: number; goal: string };
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
  topics: Array<{ id: number; topic: string; status: string }>;
}

export interface HomeworkItem {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  dueAt: string;
}

export interface MaterialItem {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
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

export interface AdminDashboard {
  kpis: { newLeads: number; trials: number; newStudents: number; renewals: number };
  funnel: FunnelMetrics;
  attention: Array<{ kind: string; title: string; detail: string; count: number }>;
}

export interface AdminLead {
  id: number;
  status: string;
  source: string;
  createdAt: string;
  customer: Customer | null;
  student: Student | null;
  program: Program | null;
  trial: TrialDetails | null;
}

export interface AdminStudent {
  student: Student;
  parent: Customer | null;
  program: Program | null;
  group: { title: string } | null;
  subscription: SubscriptionDetails | null;
  remainingLessons: number | null;
  attendancePercent: number | null;
}

export interface SubscriptionPlan {
  id: number;
  title: string;
  programId: number;
  lessonCount: number;
  validityDays: number;
  price: number;
  currency: string;
}
