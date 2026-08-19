import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const databasePath =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'data', 'education.db');

const dir = path.dirname(databasePath);
if (!fs.existsSync(dir) && process.env.NODE_ENV !== 'test') {
  fs.mkdirSync(dir, { recursive: true });
}

export const db: Database.Database =
  process.env.NODE_ENV === 'test' ? new Database(':memory:') : new Database(databasePath);

if (process.env.NODE_ENV !== 'test') {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

export function applySchema(database: Database.Database): void {
  database.pragma('foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
      logo_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id INTEGER NOT NULL UNIQUE,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primary_customer_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (primary_customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      birth_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      age_from INTEGER NOT NULL,
      age_to INTEGER NOT NULL,
      level TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      format TEXT NOT NULL DEFAULT 'group',
      active INTEGER NOT NULL DEFAULT 1,
      price_from INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      specialties TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 8,
      age_from INTEGER NOT NULL,
      age_to INTEGER NOT NULL,
      level TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'FULL', 'CLOSED')),
      FOREIGN KEY (program_id) REFERENCES programs(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS group_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      weekday INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      room TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      student_id INTEGER,
      program_id INTEGER,
      source TEXT NOT NULL DEFAULT 'miniapp',
      status TEXT NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUALIFIED', 'TRIAL_BOOKED', 'TRIAL_ATTENDED', 'OFFERED', 'CONVERTED', 'LOST')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      converted_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS lead_qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL UNIQUE,
      age INTEGER NOT NULL,
      age_band TEXT NOT NULL,
      current_level TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      preferred_format TEXT NOT NULL DEFAULT 'any',
      preferred_days TEXT NOT NULL DEFAULT '',
      preferred_time TEXT NOT NULL DEFAULT 'weekday_evening',
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS trial_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      group_id INTEGER,
      starts_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'BOOKED'
        CHECK (status IN ('BOOKED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED', 'COMPLETED')),
      teacher_comment TEXT NOT NULL DEFAULT '',
      recommended_program_id INTEGER,
      recommended_group_id INTEGER,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (program_id) REFERENCES programs(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      trial_lesson_id INTEGER,
      program_id INTEGER NOT NULL,
      group_id INTEGER,
      teacher_id INTEGER,
      subscription_plan_id INTEGER,
      text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'VIEWED', 'ACCEPTED', 'DECLINED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (trial_lesson_id) REFERENCES trial_lessons(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      group_id INTEGER,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
      enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (program_id) REFERENCES programs(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      program_id INTEGER NOT NULL,
      lesson_count INTEGER NOT NULL,
      validity_days INTEGER NOT NULL,
      price INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS student_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subscription_plan_id INTEGER NOT NULL,
      purchased_lessons INTEGER NOT NULL,
      remaining_lessons INTEGER NOT NULL,
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'EXPIRING', 'EXPIRED', 'FROZEN', 'CANCELLED')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
    );

    CREATE TABLE IF NOT EXISTS subscription_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      type TEXT NOT NULL
        CHECK (type IN ('PURCHASE', 'LESSON_DEBIT', 'REFUND', 'MANUAL_ADJUSTMENT')),
      quantity INTEGER NOT NULL,
      lesson_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES student_subscriptions(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRESENT'
        CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'CANCELLED')),
      comment TEXT NOT NULL DEFAULT '',
      UNIQUE (lesson_id, student_id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS progress_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      lesson_id INTEGER,
      teacher_id INTEGER,
      summary TEXT NOT NULL DEFAULT '',
      score INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS topic_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS learning_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'LINK'
        CHECK (type IN ('LINK', 'PDF', 'AUDIO', 'VIDEO', 'TEXT')),
      url TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subscription_id INTEGER,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      provider TEXT NOT NULL DEFAULT 'mock',
      status TEXT NOT NULL DEFAULT 'PAID'
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'UNREAD'
        CHECK (status IN ('UNREAD', 'READ')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS domain_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crm_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_starts ON lessons(starts_at);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_trials_starts ON trial_lessons(starts_at);
    CREATE INDEX IF NOT EXISTS idx_students_family ON students(family_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
  `);
}

export function migrate(database: Database.Database = db): void {
  applySchema(database);
}
