import type {
  Attendance,
  AttendanceStatus,
  Branch,
  CrmSyncRecord,
  Customer,
  DomainEvent,
  Enrollment,
  EnrollmentStatus,
  Family,
  Group,
  GroupSchedule,
  Homework,
  Lead,
  LeadQualification,
  LeadStatus,
  LearningMaterial,
  Lesson,
  LessonStatus,
  NotificationRecord,
  OutboundEventName,
  Payment,
  Program,
  ProgressRecord,
  Recommendation,
  RecommendationStatus,
  School,
  Student,
  StudentSubscription,
  SubscriptionLedger,
  SubscriptionPlan,
  Teacher,
  TelegramUser,
  TopicProgress,
  TrialLesson,
  TrialStatus,
} from '../types.js';

export interface SchoolRepository {
  getSchool(): School;
  listBranches(activeOnly?: boolean): Branch[];
  getBranch(id: number): Branch | undefined;
}

export interface CustomerRepository {
  upsert(user: TelegramUser, extras?: Partial<Pick<Customer, 'phone' | 'email'>>): {
    customer: Customer;
    created: boolean;
  };
  getByTelegramUserId(telegramUserId: number): Customer | undefined;
  getById(id: number): Customer | undefined;
  listAll(): Customer[];
}

export interface FamilyRepository {
  getByCustomerId(customerId: number): Family | undefined;
  getById(id: number): Family | undefined;
  create(primaryCustomerId: number, name: string): Family;
}

export interface StudentRepository {
  listByFamily(familyId: number): Student[];
  getById(id: number): Student | undefined;
  create(params: Omit<Student, 'id' | 'age'> & { age?: number }): Student;
  listAll(): Student[];
}

export interface ProgramRepository {
  list(activeOnly?: boolean): Program[];
  getById(id: number): Program | undefined;
}

export interface TeacherRepository {
  list(activeOnly?: boolean): Teacher[];
  getById(id: number): Teacher | undefined;
}

export interface GroupRepository {
  list(filters?: { programId?: number; teacherId?: number; activeOnly?: boolean }): Group[];
  getById(id: number): Group | undefined;
  listSchedules(groupId: number): GroupSchedule[];
  countEnrolled(groupId: number): number;
}

export interface LessonRepository {
  list(filters?: {
    groupId?: number;
    studentId?: number;
    from?: string;
    to?: string;
    status?: LessonStatus;
  }): Lesson[];
  getById(id: number): Lesson | undefined;
  create(params: Omit<Lesson, 'id'>): Lesson;
  updateStatus(id: number, status: LessonStatus): Lesson;
}

export interface LeadRepository {
  list(filters?: { status?: LeadStatus; customerId?: number }): Lead[];
  getById(id: number): Lead | undefined;
  create(params: Omit<Lead, 'id' | 'createdAt' | 'convertedAt'> & { convertedAt?: string | null }): Lead;
  update(
    id: number,
    patch: Partial<Pick<Lead, 'status' | 'programId' | 'studentId' | 'convertedAt'>>,
  ): Lead;
  getQualification(leadId: number): LeadQualification | undefined;
  saveQualification(params: Omit<LeadQualification, 'id'>): LeadQualification;
}

export interface TrialLessonRepository {
  list(filters?: { studentId?: number; leadId?: number; status?: TrialStatus }): TrialLesson[];
  getById(id: number): TrialLesson | undefined;
  create(params: Omit<TrialLesson, 'id'>): TrialLesson;
  update(
    id: number,
    patch: Partial<
      Pick<TrialLesson, 'status' | 'teacherComment' | 'recommendedProgramId' | 'recommendedGroupId'>
    >,
  ): TrialLesson;
  countActiveForSlot(groupId: number, startsAt: string): number;
}

export interface RecommendationRepository {
  listByStudent(studentId: number): Recommendation[];
  getById(id: number): Recommendation | undefined;
  create(params: Omit<Recommendation, 'id' | 'createdAt'>): Recommendation;
  updateStatus(id: number, status: RecommendationStatus): Recommendation;
}

export interface EnrollmentRepository {
  list(filters?: { studentId?: number; programId?: number; status?: EnrollmentStatus }): Enrollment[];
  getById(id: number): Enrollment | undefined;
  create(params: Omit<Enrollment, 'id' | 'enrolledAt'>): Enrollment;
  updateStatus(id: number, status: EnrollmentStatus): Enrollment;
}

export interface SubscriptionRepository {
  listPlans(programId?: number, activeOnly?: boolean): SubscriptionPlan[];
  getPlan(id: number): SubscriptionPlan | undefined;
  listByStudent(studentId: number): StudentSubscription[];
  getById(id: number): StudentSubscription | undefined;
  create(params: Omit<StudentSubscription, 'id'>): StudentSubscription;
  update(
    id: number,
    patch: Partial<Pick<StudentSubscription, 'remainingLessons' | 'status' | 'expiresAt'>>,
  ): StudentSubscription;
  listLedger(subscriptionId: number): SubscriptionLedger[];
  insertLedger(params: Omit<SubscriptionLedger, 'id' | 'createdAt'>): SubscriptionLedger;
}

export interface AttendanceRepository {
  list(filters?: { lessonId?: number; studentId?: number }): Attendance[];
  upsert(params: Omit<Attendance, 'id'>): Attendance;
  countByStatus(studentId: number, status: AttendanceStatus): number;
}

export interface ProgressRepository {
  listRecords(studentId: number, programId?: number): ProgressRecord[];
  createRecord(params: Omit<ProgressRecord, 'id' | 'createdAt'>): ProgressRecord;
  listTopics(studentId: number, programId?: number): TopicProgress[];
  upsertTopic(params: Omit<TopicProgress, 'id'>): TopicProgress;
}

export interface HomeworkRepository {
  listByLessons(lessonIds: number[]): Homework[];
  listMaterials(lessonIds: number[]): LearningMaterial[];
}

export interface PaymentProvider {
  charge(params: {
    customerId: number;
    studentId: number;
    amount: number;
    currency: string;
    description: string;
  }): Payment;
  list(customerId?: number): Payment[];
}

export interface CRMProvider {
  upsertCustomer(customer: Customer): CrmSyncRecord;
  upsertStudent(student: Student): CrmSyncRecord;
  createLead(lead: Lead): CrmSyncRecord;
  updateLead(lead: Lead): CrmSyncRecord;
  createTrial(trial: TrialLesson): CrmSyncRecord;
  createEnrollment(enrollment: Enrollment): CrmSyncRecord;
  syncSubscription(subscription: StudentSubscription): CrmSyncRecord;
  listSync(limit?: number): CrmSyncRecord[];
}

export interface EventProvider {
  publish(name: OutboundEventName, payload: Record<string, unknown>): DomainEvent;
  list(limit?: number): DomainEvent[];
}

export interface NotificationProvider {
  enqueue(params: {
    customerId: number;
    type: string;
    title: string;
    body: string;
  }): NotificationRecord;
  list(customerId?: number): NotificationRecord[];
  markRead(id: number): NotificationRecord;
}

export interface Providers {
  school: SchoolRepository;
  customers: CustomerRepository;
  families: FamilyRepository;
  students: StudentRepository;
  programs: ProgramRepository;
  teachers: TeacherRepository;
  groups: GroupRepository;
  lessons: LessonRepository;
  leads: LeadRepository;
  trials: TrialLessonRepository;
  recommendations: RecommendationRepository;
  enrollments: EnrollmentRepository;
  subscriptions: SubscriptionRepository;
  attendance: AttendanceRepository;
  progress: ProgressRepository;
  homework: HomeworkRepository;
  payments: PaymentProvider;
  crm: CRMProvider;
  events: EventProvider;
  notifications: NotificationProvider;
  transaction<T>(fn: () => T): T;
}
