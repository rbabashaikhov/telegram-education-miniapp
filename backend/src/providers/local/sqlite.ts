import type Database from 'better-sqlite3';
import { ageFromBirth } from '../../services/time.js';
import type {
  Attendance,
  Branch,
  CrmSyncRecord,
  Customer,
  DomainEvent,
  Enrollment,
  Family,
  Group,
  GroupSchedule,
  Homework,
  Lead,
  LeadQualification,
  LearningMaterial,
  Lesson,
  NotificationRecord,
  OutboundEventName,
  Payment,
  Program,
  ProgressRecord,
  Recommendation,
  School,
  Student,
  StudentSubscription,
  SubscriptionLedger,
  SubscriptionPlan,
  Teacher,
  TelegramUser,
  TopicProgress,
  TrialLesson,
} from '../../types.js';
import type { Providers } from '../types.js';

function bool(value: number | boolean): boolean {
  return Boolean(value);
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapSchool(row: Record<string, unknown>): School {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description),
    phone: String(row.phone),
    email: String(row.email),
    timezone: String(row.timezone),
    logoUrl: String(row.logo_url),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapBranch(row: Record<string, unknown>): Branch {
  return {
    id: Number(row.id),
    schoolId: Number(row.school_id),
    name: String(row.name),
    address: String(row.address),
    phone: String(row.phone),
    timezone: String(row.timezone),
    active: bool(row.active as number),
  };
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: Number(row.id),
    telegramUserId: Number(row.telegram_user_id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    phone: String(row.phone),
    email: String(row.email),
    createdAt: String(row.created_at),
  };
}

function mapFamily(row: Record<string, unknown>): Family {
  return {
    id: Number(row.id),
    primaryCustomerId: Number(row.primary_customer_id),
    name: String(row.name),
  };
}

function mapStudent(row: Record<string, unknown>): Student {
  const birthDate = String(row.birth_date);
  return {
    id: Number(row.id),
    familyId: Number(row.family_id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    birthDate,
    age: ageFromBirth(birthDate),
    notes: String(row.notes ?? ''),
    active: bool(row.active as number),
  };
}

function mapProgram(row: Record<string, unknown>): Program {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    ageFrom: Number(row.age_from),
    ageTo: Number(row.age_to),
    level: String(row.level),
    durationMinutes: Number(row.duration_minutes),
    format: row.format as Program['format'],
    active: bool(row.active as number),
    priceFrom: Number(row.price_from),
  };
}

function mapTeacher(row: Record<string, unknown>): Teacher {
  return {
    id: Number(row.id),
    name: String(row.name),
    bio: String(row.bio),
    avatarUrl: String(row.avatar_url),
    specialties: parseJson<string[]>(String(row.specialties || '[]'), []),
    active: bool(row.active as number),
  };
}

function mapGroup(row: Record<string, unknown>): Group {
  return {
    id: Number(row.id),
    programId: Number(row.program_id),
    teacherId: Number(row.teacher_id),
    branchId: Number(row.branch_id),
    title: String(row.title),
    capacity: Number(row.capacity),
    ageFrom: Number(row.age_from),
    ageTo: Number(row.age_to),
    level: String(row.level),
    status: row.status as Group['status'],
  };
}

function mapLesson(row: Record<string, unknown>): Lesson {
  return {
    id: Number(row.id),
    groupId: Number(row.group_id),
    teacherId: Number(row.teacher_id),
    branchId: Number(row.branch_id),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    room: String(row.room),
    status: row.status as Lesson['status'],
  };
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: Number(row.id),
    customerId: Number(row.customer_id),
    studentId: row.student_id == null ? null : Number(row.student_id),
    programId: row.program_id == null ? null : Number(row.program_id),
    source: String(row.source),
    status: row.status as Lead['status'],
    createdAt: String(row.created_at),
    convertedAt: row.converted_at == null ? null : String(row.converted_at),
  };
}

function mapQualification(row: Record<string, unknown>): LeadQualification {
  return {
    id: Number(row.id),
    leadId: Number(row.lead_id),
    age: Number(row.age),
    ageBand: row.age_band as LeadQualification['ageBand'],
    currentLevel: String(row.current_level),
    goal: String(row.goal),
    preferredFormat: row.preferred_format as LeadQualification['preferredFormat'],
    preferredDays: String(row.preferred_days),
    preferredTime: row.preferred_time as LeadQualification['preferredTime'],
    notes: String(row.notes),
  };
}

function mapTrial(row: Record<string, unknown>): TrialLesson {
  return {
    id: Number(row.id),
    leadId: Number(row.lead_id),
    studentId: Number(row.student_id),
    programId: Number(row.program_id),
    teacherId: Number(row.teacher_id),
    groupId: row.group_id == null ? null : Number(row.group_id),
    startsAt: String(row.starts_at),
    status: row.status as TrialLesson['status'],
    teacherComment: String(row.teacher_comment),
    recommendedProgramId: row.recommended_program_id == null ? null : Number(row.recommended_program_id),
    recommendedGroupId: row.recommended_group_id == null ? null : Number(row.recommended_group_id),
  };
}

function mapRecommendation(row: Record<string, unknown>): Recommendation {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    trialLessonId: row.trial_lesson_id == null ? null : Number(row.trial_lesson_id),
    programId: Number(row.program_id),
    groupId: row.group_id == null ? null : Number(row.group_id),
    teacherId: row.teacher_id == null ? null : Number(row.teacher_id),
    subscriptionPlanId: row.subscription_plan_id == null ? null : Number(row.subscription_plan_id),
    text: String(row.text),
    status: row.status as Recommendation['status'],
    createdAt: String(row.created_at),
  };
}

function mapEnrollment(row: Record<string, unknown>): Enrollment {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    programId: Number(row.program_id),
    groupId: row.group_id == null ? null : Number(row.group_id),
    status: row.status as Enrollment['status'],
    enrolledAt: String(row.enrolled_at),
  };
}

function mapPlan(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: Number(row.id),
    title: String(row.title),
    programId: Number(row.program_id),
    lessonCount: Number(row.lesson_count),
    validityDays: Number(row.validity_days),
    price: Number(row.price),
    currency: String(row.currency),
    active: bool(row.active as number),
  };
}

function mapSubscription(row: Record<string, unknown>): StudentSubscription {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    subscriptionPlanId: Number(row.subscription_plan_id),
    purchasedLessons: Number(row.purchased_lessons),
    remainingLessons: Number(row.remaining_lessons),
    startsAt: String(row.starts_at),
    expiresAt: String(row.expires_at),
    status: row.status as StudentSubscription['status'],
  };
}

function mapLedger(row: Record<string, unknown>): SubscriptionLedger {
  return {
    id: Number(row.id),
    subscriptionId: Number(row.subscription_id),
    type: row.type as SubscriptionLedger['type'],
    quantity: Number(row.quantity),
    lessonId: row.lesson_id == null ? null : Number(row.lesson_id),
    createdAt: String(row.created_at),
  };
}

function mapAttendance(row: Record<string, unknown>): Attendance {
  return {
    id: Number(row.id),
    lessonId: Number(row.lesson_id),
    studentId: Number(row.student_id),
    status: row.status as Attendance['status'],
    comment: String(row.comment),
  };
}

function mapProgress(row: Record<string, unknown>): ProgressRecord {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    programId: Number(row.program_id),
    lessonId: row.lesson_id == null ? null : Number(row.lesson_id),
    teacherId: row.teacher_id == null ? null : Number(row.teacher_id),
    summary: String(row.summary),
    score: row.score == null ? null : Number(row.score),
    createdAt: String(row.created_at),
  };
}

function mapTopic(row: Record<string, unknown>): TopicProgress {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    programId: Number(row.program_id),
    topic: String(row.topic),
    status: row.status as TopicProgress['status'],
  };
}

function mapHomework(row: Record<string, unknown>): Homework {
  return {
    id: Number(row.id),
    lessonId: Number(row.lesson_id),
    title: String(row.title),
    description: String(row.description),
    dueAt: String(row.due_at),
  };
}

function mapMaterial(row: Record<string, unknown>): LearningMaterial {
  return {
    id: Number(row.id),
    lessonId: Number(row.lesson_id),
    title: String(row.title),
    type: row.type as LearningMaterial['type'],
    url: String(row.url),
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: Number(row.id),
    customerId: Number(row.customer_id),
    studentId: Number(row.student_id),
    subscriptionId: row.subscription_id == null ? null : Number(row.subscription_id),
    amount: Number(row.amount),
    currency: String(row.currency),
    provider: String(row.provider),
    status: row.status as Payment['status'],
    createdAt: String(row.created_at),
  };
}

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    id: Number(row.id),
    customerId: Number(row.customer_id),
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    status: row.status as NotificationRecord['status'],
    createdAt: String(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): DomainEvent {
  return {
    id: Number(row.id),
    name: row.name as OutboundEventName,
    payload: parseJson<Record<string, unknown>>(String(row.payload || '{}'), {}),
    createdAt: String(row.created_at),
  };
}

function mapCrm(row: Record<string, unknown>): CrmSyncRecord {
  return {
    id: Number(row.id),
    entityType: String(row.entity_type),
    entityId: Number(row.entity_id),
    action: String(row.action),
    payload: parseJson<Record<string, unknown>>(String(row.payload || '{}'), {}),
    createdAt: String(row.created_at),
  };
}

export function createLocalProviders(database: Database.Database): Providers {
  const get = <T>(sql: string, params: unknown[] = []): T | undefined =>
    database.prepare(sql).get(...params) as T | undefined;
  const all = <T>(sql: string, params: unknown[] = []): T[] => database.prepare(sql).all(...params) as T[];

  function crmLog(entityType: string, entityId: number, action: string, payload: unknown): CrmSyncRecord {
    const result = database
      .prepare(
        `INSERT INTO crm_sync_log (entity_type, entity_id, action, payload) VALUES (?, ?, ?, ?)`,
      )
      .run(entityType, entityId, action, JSON.stringify(payload));
    return mapCrm(
      get<Record<string, unknown>>('SELECT * FROM crm_sync_log WHERE id = ?', [Number(result.lastInsertRowid)])!,
    );
  }

  return {
    school: {
      getSchool() {
        return mapSchool(get<Record<string, unknown>>('SELECT * FROM schools ORDER BY id LIMIT 1')!);
      },
      listBranches(activeOnly = true) {
        const sql = activeOnly
          ? 'SELECT * FROM branches WHERE active = 1 ORDER BY id'
          : 'SELECT * FROM branches ORDER BY id';
        return all<Record<string, unknown>>(sql).map(mapBranch);
      },
      getBranch(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM branches WHERE id = ?', [id]);
        return row ? mapBranch(row) : undefined;
      },
    },
    customers: {
      upsert(user: TelegramUser, extras) {
        const existing = get<Record<string, unknown>>(
          'SELECT * FROM customers WHERE telegram_user_id = ?',
          [user.id],
        );
        if (existing) {
          if (extras?.phone || extras?.email) {
            database
              .prepare(
                `UPDATE customers SET phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?`,
              )
              .run(extras.phone ?? null, extras.email ?? null, existing.id);
          }
          return {
            customer: mapCustomer(
              get<Record<string, unknown>>('SELECT * FROM customers WHERE id = ?', [existing.id])!,
            ),
            created: false,
          };
        }
        const result = database
          .prepare(
            `INSERT INTO customers (telegram_user_id, first_name, last_name, phone, email)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(user.id, user.first_name, user.last_name ?? '', extras?.phone ?? '', extras?.email ?? '');
        return {
          customer: mapCustomer(
            get<Record<string, unknown>>('SELECT * FROM customers WHERE id = ?', [
              Number(result.lastInsertRowid),
            ])!,
          ),
          created: true,
        };
      },
      getByTelegramUserId(telegramUserId) {
        const row = get<Record<string, unknown>>('SELECT * FROM customers WHERE telegram_user_id = ?', [
          telegramUserId,
        ]);
        return row ? mapCustomer(row) : undefined;
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM customers WHERE id = ?', [id]);
        return row ? mapCustomer(row) : undefined;
      },
      listAll() {
        return all<Record<string, unknown>>('SELECT * FROM customers ORDER BY id').map(mapCustomer);
      },
    },
    families: {
      getByCustomerId(customerId) {
        const row = get<Record<string, unknown>>(
          'SELECT * FROM families WHERE primary_customer_id = ? ORDER BY id LIMIT 1',
          [customerId],
        );
        return row ? mapFamily(row) : undefined;
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM families WHERE id = ?', [id]);
        return row ? mapFamily(row) : undefined;
      },
      create(primaryCustomerId, name) {
        const result = database
          .prepare('INSERT INTO families (primary_customer_id, name) VALUES (?, ?)')
          .run(primaryCustomerId, name);
        return mapFamily(
          get<Record<string, unknown>>('SELECT * FROM families WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
    },
    students: {
      listByFamily(familyId) {
        return all<Record<string, unknown>>(
          'SELECT * FROM students WHERE family_id = ? AND active = 1 ORDER BY id',
          [familyId],
        ).map(mapStudent);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM students WHERE id = ?', [id]);
        return row ? mapStudent(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO students (family_id, first_name, last_name, birth_date, notes, active)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(params.familyId, params.firstName, params.lastName, params.birthDate, params.notes, params.active ? 1 : 0);
        return mapStudent(
          get<Record<string, unknown>>('SELECT * FROM students WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      listAll() {
        return all<Record<string, unknown>>('SELECT * FROM students ORDER BY id').map(mapStudent);
      },
    },
    programs: {
      list(activeOnly = true) {
        const sql = activeOnly
          ? 'SELECT * FROM programs WHERE active = 1 ORDER BY id'
          : 'SELECT * FROM programs ORDER BY id';
        return all<Record<string, unknown>>(sql).map(mapProgram);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM programs WHERE id = ?', [id]);
        return row ? mapProgram(row) : undefined;
      },
    },
    teachers: {
      list(activeOnly = true) {
        const sql = activeOnly
          ? 'SELECT * FROM teachers WHERE active = 1 ORDER BY id'
          : 'SELECT * FROM teachers ORDER BY id';
        return all<Record<string, unknown>>(sql).map(mapTeacher);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM teachers WHERE id = ?', [id]);
        return row ? mapTeacher(row) : undefined;
      },
    },
    groups: {
      list(filters) {
        let sql = 'SELECT * FROM groups WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.programId) {
          sql += ' AND program_id = ?';
          params.push(filters.programId);
        }
        if (filters?.teacherId) {
          sql += ' AND teacher_id = ?';
          params.push(filters.teacherId);
        }
        if (filters?.activeOnly !== false) {
          sql += " AND status != 'CLOSED'";
        }
        sql += ' ORDER BY id';
        return all<Record<string, unknown>>(sql, params).map(mapGroup);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM groups WHERE id = ?', [id]);
        return row ? mapGroup(row) : undefined;
      },
      listSchedules(groupId) {
        return all<Record<string, unknown>>(
          'SELECT * FROM group_schedules WHERE group_id = ? ORDER BY weekday, start_time',
          [groupId],
        ).map((row) => ({
          id: Number(row.id),
          groupId: Number(row.group_id),
          weekday: Number(row.weekday),
          startTime: String(row.start_time),
          endTime: String(row.end_time),
          room: String(row.room),
        } satisfies GroupSchedule));
      },
      countEnrolled(groupId) {
        const row = get<{ c: number }>(
          `SELECT COUNT(*) AS c FROM enrollments WHERE group_id = ? AND status = 'ACTIVE'`,
          [groupId],
        );
        return row?.c ?? 0;
      },
    },
    lessons: {
      list(filters) {
        let sql = 'SELECT lessons.* FROM lessons';
        const params: unknown[] = [];
        if (filters?.studentId) {
          sql += ` INNER JOIN enrollments ON enrollments.group_id = lessons.group_id
                   AND enrollments.student_id = ? AND enrollments.status = 'ACTIVE'`;
          params.push(filters.studentId);
        }
        sql += ' WHERE 1=1';
        if (filters?.groupId) {
          sql += ' AND lessons.group_id = ?';
          params.push(filters.groupId);
        }
        if (filters?.from) {
          sql += ' AND lessons.starts_at >= ?';
          params.push(filters.from);
        }
        if (filters?.to) {
          sql += ' AND lessons.starts_at <= ?';
          params.push(filters.to);
        }
        if (filters?.status) {
          sql += ' AND lessons.status = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY lessons.starts_at';
        return all<Record<string, unknown>>(sql, params).map(mapLesson);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM lessons WHERE id = ?', [id]);
        return row ? mapLesson(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO lessons (group_id, teacher_id, branch_id, starts_at, ends_at, room, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.groupId,
            params.teacherId,
            params.branchId,
            params.startsAt,
            params.endsAt,
            params.room,
            params.status,
          );
        return mapLesson(
          get<Record<string, unknown>>('SELECT * FROM lessons WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      updateStatus(id, status) {
        database.prepare('UPDATE lessons SET status = ? WHERE id = ?').run(status, id);
        return mapLesson(get<Record<string, unknown>>('SELECT * FROM lessons WHERE id = ?', [id])!);
      },
    },
    leads: {
      list(filters) {
        let sql = 'SELECT * FROM leads WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.status) {
          sql += ' AND status = ?';
          params.push(filters.status);
        }
        if (filters?.customerId) {
          sql += ' AND customer_id = ?';
          params.push(filters.customerId);
        }
        sql += ' ORDER BY created_at DESC, id DESC';
        return all<Record<string, unknown>>(sql, params).map(mapLead);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM leads WHERE id = ?', [id]);
        return row ? mapLead(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO leads (customer_id, student_id, program_id, source, status, converted_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.customerId,
            params.studentId,
            params.programId,
            params.source,
            params.status,
            params.convertedAt ?? null,
          );
        return mapLead(
          get<Record<string, unknown>>('SELECT * FROM leads WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      update(id, patch) {
        const current = mapLead(get<Record<string, unknown>>('SELECT * FROM leads WHERE id = ?', [id])!);
        database
          .prepare(
            `UPDATE leads SET status = ?, program_id = ?, student_id = ?, converted_at = ? WHERE id = ?`,
          )
          .run(
            patch.status ?? current.status,
            patch.programId === undefined ? current.programId : patch.programId,
            patch.studentId === undefined ? current.studentId : patch.studentId,
            patch.convertedAt === undefined ? current.convertedAt : patch.convertedAt,
            id,
          );
        return mapLead(get<Record<string, unknown>>('SELECT * FROM leads WHERE id = ?', [id])!);
      },
      getQualification(leadId) {
        const row = get<Record<string, unknown>>('SELECT * FROM lead_qualifications WHERE lead_id = ?', [leadId]);
        return row ? mapQualification(row) : undefined;
      },
      saveQualification(params) {
        const existing = get<Record<string, unknown>>('SELECT id FROM lead_qualifications WHERE lead_id = ?', [
          params.leadId,
        ]);
        if (existing) {
          database
            .prepare(
              `UPDATE lead_qualifications
               SET age = ?, age_band = ?, current_level = ?, goal = ?, preferred_format = ?,
                   preferred_days = ?, preferred_time = ?, notes = ?
               WHERE lead_id = ?`,
            )
            .run(
              params.age,
              params.ageBand,
              params.currentLevel,
              params.goal,
              params.preferredFormat,
              params.preferredDays,
              params.preferredTime,
              params.notes,
              params.leadId,
            );
        } else {
          database
            .prepare(
              `INSERT INTO lead_qualifications
               (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              params.leadId,
              params.age,
              params.ageBand,
              params.currentLevel,
              params.goal,
              params.preferredFormat,
              params.preferredDays,
              params.preferredTime,
              params.notes,
            );
        }
        return mapQualification(
          get<Record<string, unknown>>('SELECT * FROM lead_qualifications WHERE lead_id = ?', [params.leadId])!,
        );
      },
    },
    trials: {
      list(filters) {
        let sql = 'SELECT * FROM trial_lessons WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.studentId) {
          sql += ' AND student_id = ?';
          params.push(filters.studentId);
        }
        if (filters?.leadId) {
          sql += ' AND lead_id = ?';
          params.push(filters.leadId);
        }
        if (filters?.status) {
          sql += ' AND status = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY starts_at DESC';
        return all<Record<string, unknown>>(sql, params).map(mapTrial);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM trial_lessons WHERE id = ?', [id]);
        return row ? mapTrial(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO trial_lessons
             (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status, teacher_comment,
              recommended_program_id, recommended_group_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.leadId,
            params.studentId,
            params.programId,
            params.teacherId,
            params.groupId,
            params.startsAt,
            params.status,
            params.teacherComment,
            params.recommendedProgramId,
            params.recommendedGroupId,
          );
        return mapTrial(
          get<Record<string, unknown>>('SELECT * FROM trial_lessons WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      update(id, patch) {
        const current = mapTrial(get<Record<string, unknown>>('SELECT * FROM trial_lessons WHERE id = ?', [id])!);
        database
          .prepare(
            `UPDATE trial_lessons
             SET status = ?, teacher_comment = ?, recommended_program_id = ?, recommended_group_id = ?
             WHERE id = ?`,
          )
          .run(
            patch.status ?? current.status,
            patch.teacherComment ?? current.teacherComment,
            patch.recommendedProgramId === undefined ? current.recommendedProgramId : patch.recommendedProgramId,
            patch.recommendedGroupId === undefined ? current.recommendedGroupId : patch.recommendedGroupId,
            id,
          );
        return mapTrial(get<Record<string, unknown>>('SELECT * FROM trial_lessons WHERE id = ?', [id])!);
      },
      countActiveForSlot(groupId, startsAt) {
        const row = get<{ c: number }>(
          `SELECT COUNT(*) AS c FROM trial_lessons
           WHERE group_id = ? AND starts_at = ? AND status IN ('BOOKED', 'CONFIRMED')`,
          [groupId, startsAt],
        );
        return row?.c ?? 0;
      },
    },
    recommendations: {
      listByStudent(studentId) {
        return all<Record<string, unknown>>(
          'SELECT * FROM recommendations WHERE student_id = ? ORDER BY created_at DESC',
          [studentId],
        ).map(mapRecommendation);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM recommendations WHERE id = ?', [id]);
        return row ? mapRecommendation(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO recommendations
             (student_id, trial_lesson_id, program_id, group_id, teacher_id, subscription_plan_id, text, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.studentId,
            params.trialLessonId,
            params.programId,
            params.groupId,
            params.teacherId,
            params.subscriptionPlanId,
            params.text,
            params.status,
          );
        return mapRecommendation(
          get<Record<string, unknown>>('SELECT * FROM recommendations WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
      updateStatus(id, status) {
        database.prepare('UPDATE recommendations SET status = ? WHERE id = ?').run(status, id);
        return mapRecommendation(get<Record<string, unknown>>('SELECT * FROM recommendations WHERE id = ?', [id])!);
      },
    },
    enrollments: {
      list(filters) {
        let sql = 'SELECT * FROM enrollments WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.studentId) {
          sql += ' AND student_id = ?';
          params.push(filters.studentId);
        }
        if (filters?.programId) {
          sql += ' AND program_id = ?';
          params.push(filters.programId);
        }
        if (filters?.status) {
          sql += ' AND status = ?';
          params.push(filters.status);
        }
        sql += ' ORDER BY enrolled_at DESC';
        return all<Record<string, unknown>>(sql, params).map(mapEnrollment);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM enrollments WHERE id = ?', [id]);
        return row ? mapEnrollment(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO enrollments (student_id, program_id, group_id, status) VALUES (?, ?, ?, ?)`,
          )
          .run(params.studentId, params.programId, params.groupId, params.status);
        return mapEnrollment(
          get<Record<string, unknown>>('SELECT * FROM enrollments WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      updateStatus(id, status) {
        database.prepare('UPDATE enrollments SET status = ? WHERE id = ?').run(status, id);
        return mapEnrollment(get<Record<string, unknown>>('SELECT * FROM enrollments WHERE id = ?', [id])!);
      },
    },
    subscriptions: {
      listPlans(programId, activeOnly = true) {
        let sql = 'SELECT * FROM subscription_plans WHERE 1=1';
        const params: unknown[] = [];
        if (programId) {
          sql += ' AND program_id = ?';
          params.push(programId);
        }
        if (activeOnly) {
          sql += ' AND active = 1';
        }
        sql += ' ORDER BY lesson_count';
        return all<Record<string, unknown>>(sql, params).map(mapPlan);
      },
      getPlan(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM subscription_plans WHERE id = ?', [id]);
        return row ? mapPlan(row) : undefined;
      },
      listByStudent(studentId) {
        return all<Record<string, unknown>>(
          'SELECT * FROM student_subscriptions WHERE student_id = ? ORDER BY id DESC',
          [studentId],
        ).map(mapSubscription);
      },
      getById(id) {
        const row = get<Record<string, unknown>>('SELECT * FROM student_subscriptions WHERE id = ?', [id]);
        return row ? mapSubscription(row) : undefined;
      },
      create(params) {
        const result = database
          .prepare(
            `INSERT INTO student_subscriptions
             (student_id, subscription_plan_id, purchased_lessons, remaining_lessons, starts_at, expires_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.studentId,
            params.subscriptionPlanId,
            params.purchasedLessons,
            params.remainingLessons,
            params.startsAt,
            params.expiresAt,
            params.status,
          );
        return mapSubscription(
          get<Record<string, unknown>>('SELECT * FROM student_subscriptions WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
      update(id, patch) {
        const current = mapSubscription(
          get<Record<string, unknown>>('SELECT * FROM student_subscriptions WHERE id = ?', [id])!,
        );
        database
          .prepare(
            `UPDATE student_subscriptions SET remaining_lessons = ?, status = ?, expires_at = ? WHERE id = ?`,
          )
          .run(
            patch.remainingLessons ?? current.remainingLessons,
            patch.status ?? current.status,
            patch.expiresAt ?? current.expiresAt,
            id,
          );
        return mapSubscription(
          get<Record<string, unknown>>('SELECT * FROM student_subscriptions WHERE id = ?', [id])!,
        );
      },
      listLedger(subscriptionId) {
        return all<Record<string, unknown>>(
          'SELECT * FROM subscription_ledger WHERE subscription_id = ? ORDER BY created_at DESC',
          [subscriptionId],
        ).map(mapLedger);
      },
      insertLedger(params) {
        const result = database
          .prepare(
            `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id) VALUES (?, ?, ?, ?)`,
          )
          .run(params.subscriptionId, params.type, params.quantity, params.lessonId);
        return mapLedger(
          get<Record<string, unknown>>('SELECT * FROM subscription_ledger WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
    },
    attendance: {
      list(filters) {
        let sql = 'SELECT * FROM attendance WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.lessonId) {
          sql += ' AND lesson_id = ?';
          params.push(filters.lessonId);
        }
        if (filters?.studentId) {
          sql += ' AND student_id = ?';
          params.push(filters.studentId);
        }
        return all<Record<string, unknown>>(sql, params).map(mapAttendance);
      },
      upsert(params) {
        const existing = get<Record<string, unknown>>(
          'SELECT * FROM attendance WHERE lesson_id = ? AND student_id = ?',
          [params.lessonId, params.studentId],
        );
        if (existing) {
          database
            .prepare('UPDATE attendance SET status = ?, comment = ? WHERE id = ?')
            .run(params.status, params.comment, existing.id);
          return mapAttendance(
            get<Record<string, unknown>>('SELECT * FROM attendance WHERE id = ?', [existing.id])!,
          );
        }
        const result = database
          .prepare('INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)')
          .run(params.lessonId, params.studentId, params.status, params.comment);
        return mapAttendance(
          get<Record<string, unknown>>('SELECT * FROM attendance WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      countByStatus(studentId, status) {
        const row = get<{ c: number }>(
          'SELECT COUNT(*) AS c FROM attendance WHERE student_id = ? AND status = ?',
          [studentId, status],
        );
        return row?.c ?? 0;
      },
    },
    progress: {
      listRecords(studentId, programId) {
        let sql = 'SELECT * FROM progress_records WHERE student_id = ?';
        const params: unknown[] = [studentId];
        if (programId) {
          sql += ' AND program_id = ?';
          params.push(programId);
        }
        sql += ' ORDER BY created_at DESC';
        return all<Record<string, unknown>>(sql, params).map(mapProgress);
      },
      createRecord(params) {
        const result = database
          .prepare(
            `INSERT INTO progress_records (student_id, program_id, lesson_id, teacher_id, summary, score)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            params.studentId,
            params.programId,
            params.lessonId,
            params.teacherId,
            params.summary,
            params.score,
          );
        return mapProgress(
          get<Record<string, unknown>>('SELECT * FROM progress_records WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
      listTopics(studentId, programId) {
        let sql = 'SELECT * FROM topic_progress WHERE student_id = ?';
        const params: unknown[] = [studentId];
        if (programId) {
          sql += ' AND program_id = ?';
          params.push(programId);
        }
        return all<Record<string, unknown>>(sql, params).map(mapTopic);
      },
      upsertTopic(params) {
        const existing = get<Record<string, unknown>>(
          'SELECT * FROM topic_progress WHERE student_id = ? AND program_id = ? AND topic = ?',
          [params.studentId, params.programId, params.topic],
        );
        if (existing) {
          database.prepare('UPDATE topic_progress SET status = ? WHERE id = ?').run(params.status, existing.id);
          return mapTopic(get<Record<string, unknown>>('SELECT * FROM topic_progress WHERE id = ?', [existing.id])!);
        }
        const result = database
          .prepare(
            'INSERT INTO topic_progress (student_id, program_id, topic, status) VALUES (?, ?, ?, ?)',
          )
          .run(params.studentId, params.programId, params.topic, params.status);
        return mapTopic(
          get<Record<string, unknown>>('SELECT * FROM topic_progress WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
    },
    homework: {
      listByLessons(lessonIds) {
        if (!lessonIds.length) return [];
        const placeholders = lessonIds.map(() => '?').join(',');
        return all<Record<string, unknown>>(
          `SELECT * FROM homework WHERE lesson_id IN (${placeholders}) ORDER BY due_at`,
          lessonIds,
        ).map(mapHomework);
      },
      listMaterials(lessonIds) {
        if (!lessonIds.length) return [];
        const placeholders = lessonIds.map(() => '?').join(',');
        return all<Record<string, unknown>>(
          `SELECT * FROM learning_materials WHERE lesson_id IN (${placeholders}) ORDER BY id`,
          lessonIds,
        ).map(mapMaterial);
      },
    },
    payments: {
      charge(params) {
        const result = database
          .prepare(
            `INSERT INTO payments (customer_id, student_id, amount, currency, provider, status)
             VALUES (?, ?, ?, ?, 'mock', 'PAID')`,
          )
          .run(params.customerId, params.studentId, params.amount, params.currency);
        return mapPayment(
          get<Record<string, unknown>>('SELECT * FROM payments WHERE id = ?', [Number(result.lastInsertRowid)])!,
        );
      },
      list(customerId) {
        const sql = customerId
          ? 'SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC'
          : 'SELECT * FROM payments ORDER BY created_at DESC';
        return all<Record<string, unknown>>(sql, customerId ? [customerId] : []).map(mapPayment);
      },
    },
    crm: {
      upsertCustomer(customer) {
        return crmLog('customer', customer.id, 'upsertCustomer', customer);
      },
      upsertStudent(student) {
        return crmLog('student', student.id, 'upsertStudent', student);
      },
      createLead(lead) {
        return crmLog('lead', lead.id, 'createLead', lead);
      },
      updateLead(lead) {
        return crmLog('lead', lead.id, 'updateLead', lead);
      },
      createTrial(trial) {
        return crmLog('trial', trial.id, 'createTrial', trial);
      },
      createEnrollment(enrollment) {
        return crmLog('enrollment', enrollment.id, 'createEnrollment', enrollment);
      },
      syncSubscription(subscription) {
        return crmLog('subscription', subscription.id, 'syncSubscription', subscription);
      },
      listSync(limit = 50) {
        return all<Record<string, unknown>>('SELECT * FROM crm_sync_log ORDER BY id DESC LIMIT ?', [limit]).map(
          mapCrm,
        );
      },
    },
    events: {
      publish(name, payload) {
        const result = database
          .prepare('INSERT INTO domain_events (name, payload) VALUES (?, ?)')
          .run(name, JSON.stringify(payload));
        return mapEvent(
          get<Record<string, unknown>>('SELECT * FROM domain_events WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
      list(limit = 50) {
        return all<Record<string, unknown>>('SELECT * FROM domain_events ORDER BY id DESC LIMIT ?', [limit]).map(
          mapEvent,
        );
      },
    },
    notifications: {
      enqueue(params) {
        const result = database
          .prepare(
            `INSERT INTO notifications (customer_id, type, title, body, status) VALUES (?, ?, ?, ?, 'UNREAD')`,
          )
          .run(params.customerId, params.type, params.title, params.body);
        return mapNotification(
          get<Record<string, unknown>>('SELECT * FROM notifications WHERE id = ?', [
            Number(result.lastInsertRowid),
          ])!,
        );
      },
      list(customerId) {
        const sql = customerId
          ? 'SELECT * FROM notifications WHERE customer_id = ? ORDER BY created_at DESC'
          : 'SELECT * FROM notifications ORDER BY created_at DESC';
        return all<Record<string, unknown>>(sql, customerId ? [customerId] : []).map(mapNotification);
      },
      markRead(id) {
        database.prepare(`UPDATE notifications SET status = 'READ' WHERE id = ?`).run(id);
        return mapNotification(get<Record<string, unknown>>('SELECT * FROM notifications WHERE id = ?', [id])!);
      },
    },
    transaction<T>(fn: () => T): T {
      return database.transaction(fn)();
    },
  };
}
