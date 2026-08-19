import type Database from 'better-sqlite3';
import { ageFromBirth, addDaysIso, datePart, todayDateString, toIsoDateTime, weekdayOf } from '../services/time.js';

function insert(db: Database.Database, sql: string, params: unknown[] = []): number {
  return Number(db.prepare(sql).run(...params).lastInsertRowid);
}

function generateDates(from: string, to: string, weekday: number): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    if (weekdayOf(cursor) === weekday) dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
}

export function seed(database: Database.Database, now = new Date()): void {
  const existing = database.prepare('SELECT COUNT(*) AS c FROM schools').get() as { c: number };
  if (existing.c > 0) return;

  const today = todayDateString(now);
  const pastStart = addDaysIso(today, -49);
  const futureEnd = addDaysIso(today, 28);

  const schoolId = insert(
    database,
    `INSERT INTO schools (name, description, phone, email, timezone, logo_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      'BrightWay Education',
      'Семейный учебный центр на Ходынском поле: английский, робототехника, математика, подготовка к школе и творческие студии.',
      '+7 495 120-44-18',
      'hello@brightway.school',
      'Europe/Moscow',
      '',
    ],
  );

  const branchId = insert(
    database,
    `INSERT INTO branches (school_id, name, address, phone, timezone, active) VALUES (?, ?, ?, ?, ?, 1)`,
    [schoolId, 'Москва, Ходынское поле', 'Ходынский бульвар, 4, Москва', '+7 495 120-44-18', 'Europe/Moscow'],
  );

  const englishId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'English Start A1',
      'Первый год английского: живая речь, чтение и уверенность на уроке. Группы 6–8 человек, два раза в неделю.',
      7,
      11,
      'A1',
      60,
      'group',
      7900,
    ],
  );
  const conversationId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'English Conversation',
      'Разговорный английский для школьников, которые уже читают и хотят свободно говорить.',
      10,
      16,
      'A2–B1',
      60,
      'group',
      8900,
    ],
  );
  const roboticsId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Robotics Junior',
      'Сборка и программирование роботов на LEGO SPIKE: механика, датчики и первые алгоритмы.',
      7,
      10,
      'Junior',
      90,
      'group',
      9200,
    ],
  );
  const programmingId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Programming Start',
      'Первые шаги в коде: Scratch, логика, игровые проекты и аккуратная работа с компьютером.',
      8,
      12,
      'Start',
      90,
      'group',
      9800,
    ],
  );
  const mathId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Math Boost',
      'Уверенная школьная математика: счёт, текстовые задачи и подготовка к контрольным без зубрёжки.',
      8,
      12,
      'School',
      60,
      'group',
      6900,
    ],
  );
  const prepId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Подготовка к школе',
      'Чтение, письмо, внимание и привычка заниматься. Нежная адаптация к уроку для дошкольников.',
      5,
      7,
      'Prep',
      45,
      'group',
      6400,
    ],
  );
  const creativeId = insert(
    database,
    `INSERT INTO programs (title, description, age_from, age_to, level, duration_minutes, format, active, price_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Creative Studio',
      'Рисование, композиция и ручной труд. Дети делают законченные работы, которые можно забрать домой.',
      6,
      12,
      'Studio',
      90,
      'group',
      7200,
    ],
  );

  const annaId = insert(
    database,
    `INSERT INTO teachers (name, bio, avatar_url, specialties, active) VALUES (?, ?, '', ?, 1)`,
    [
      'Анна Орлова',
      'CELTA, 9 лет с детьми 7–12 лет. Спокойный темп, много устной практики и понятная обратная связь родителям.',
      JSON.stringify(['английский', 'A1', 'A2']),
    ],
  );
  const ilyaId = insert(
    database,
    `INSERT INTO teachers (name, bio, avatar_url, specialties, active) VALUES (?, ?, '', ?, 1)`,
    [
      'Илья Соколов',
      'Инженер и педагог робототехники. Учит собирать аккуратно, объяснять «почему так едет» и доводить проект до конца.',
      JSON.stringify(['робототехника', 'LEGO']),
    ],
  );
  const marinaId = insert(
    database,
    `INSERT INTO teachers (name, bio, avatar_url, specialties, active) VALUES (?, ?, '', ?, 1)`,
    [
      'Марина Кузнецова',
      'Начальная школа и подготовка к школе. Держит внимание группы и даёт родителям короткий отчёт после занятия.',
      JSON.stringify(['математика', 'подготовка к школе']),
    ],
  );
  const pavelId = insert(
    database,
    `INSERT INTO teachers (name, bio, avatar_url, specialties, active) VALUES (?, ?, '', ?, 1)`,
    [
      'Павел Егоров',
      'Разработчик и преподаватель Programming Start. Проекты, а не скучные упражнения «ради галочки».',
      JSON.stringify(['программирование', 'Scratch']),
    ],
  );
  const elenaTeacherId = insert(
    database,
    `INSERT INTO teachers (name, bio, avatar_url, specialties, active) VALUES (?, ?, '', ?, 1)`,
    [
      'Елена Васильева',
      'Художник и педагог Creative Studio. Учит видеть цвет, композицию и доводить работу до выставочного вида.',
      JSON.stringify(['творчество', 'рисование']),
    ],
  );

  const englishGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [englishId, annaId, branchId, 'English Start 9–11', 8, 9, 11, 'A1'],
  );
  const conversationGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [conversationId, annaId, branchId, 'Conversation 11–14', 8, 11, 14, 'A2'],
  );
  const roboticsGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [roboticsId, ilyaId, branchId, 'Robotics Junior 7–10', 6, 7, 10, 'Junior'],
  );
  const programmingGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [programmingId, pavelId, branchId, 'Programming Start 8–12', 8, 8, 12, 'Start'],
  );
  const mathGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [mathId, marinaId, branchId, 'Math Boost 8–11', 8, 8, 11, 'School'],
  );
  const prepGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [prepId, marinaId, branchId, 'Подготовка к школе 5–7', 8, 5, 7, 'Prep'],
  );
  const creativeGroup = insert(
    database,
    `INSERT INTO groups (program_id, teacher_id, branch_id, title, capacity, age_from, age_to, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
    [creativeId, elenaTeacherId, branchId, 'Creative Studio 6–12', 8, 6, 12, 'Studio'],
  );

  const schedules: Array<[number, number, string, string, string]> = [
    [englishGroup, 1, '18:00', '19:00', 'Аудитория 2'],
    [englishGroup, 3, '18:00', '19:00', 'Аудитория 2'],
    [conversationGroup, 2, '19:00', '20:00', 'Аудитория 2'],
    [conversationGroup, 4, '19:00', '20:00', 'Аудитория 2'],
    [roboticsGroup, 6, '12:00', '13:30', 'Мастерская'],
    [programmingGroup, 6, '10:00', '11:30', 'IT-класс'],
    [mathGroup, 2, '17:00', '18:00', 'Аудитория 1'],
    [mathGroup, 4, '17:00', '18:00', 'Аудитория 1'],
    [prepGroup, 1, '16:00', '16:45', 'Аудитория 1'],
    [prepGroup, 3, '16:00', '16:45', 'Аудитория 1'],
    [creativeGroup, 6, '14:00', '15:30', 'Студия'],
  ];
  for (const [groupId, weekday, start, end, room] of schedules) {
    insert(
      database,
      `INSERT INTO group_schedules (group_id, weekday, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)`,
      [groupId, weekday, start, end, room],
    );
  }

  const groupMeta = new Map<number, { teacherId: number; start: string; end: string; room: string }>([
    [englishGroup, { teacherId: annaId, start: '18:00', end: '19:00', room: 'Аудитория 2' }],
    [conversationGroup, { teacherId: annaId, start: '19:00', end: '20:00', room: 'Аудитория 2' }],
    [roboticsGroup, { teacherId: ilyaId, start: '12:00', end: '13:30', room: 'Мастерская' }],
    [programmingGroup, { teacherId: pavelId, start: '10:00', end: '11:30', room: 'IT-класс' }],
    [mathGroup, { teacherId: marinaId, start: '17:00', end: '18:00', room: 'Аудитория 1' }],
    [prepGroup, { teacherId: marinaId, start: '16:00', end: '16:45', room: 'Аудитория 1' }],
    [creativeGroup, { teacherId: elenaTeacherId, start: '14:00', end: '15:30', room: 'Студия' }],
  ]);

  const lessonsByGroup = new Map<number, number[]>();
  for (const [groupId, weekday] of schedules) {
    const meta = groupMeta.get(groupId)!;
    const ids = lessonsByGroup.get(groupId) ?? [];
    for (const date of generateDates(pastStart, futureEnd, weekday)) {
      const status = date < today ? 'COMPLETED' : 'SCHEDULED';
      const lessonId = insert(
        database,
        `INSERT INTO lessons (group_id, teacher_id, branch_id, starts_at, ends_at, room, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          meta.teacherId,
          branchId,
          toIsoDateTime(date, meta.start),
          toIsoDateTime(date, meta.end),
          meta.room,
          status,
        ],
      );
      ids.push(lessonId);
    }
    lessonsByGroup.set(groupId, ids);
  }

  const englishPlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 30 дней', englishId, 8, 30, 7900],
  );
  const englishPlan16 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['16 занятий / 60 дней', englishId, 16, 60, 14900],
  );
  insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['4 индивидуальных занятия', englishId, 4, 30, 9600],
  );
  const roboticsPlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 60 дней', roboticsId, 8, 60, 9200],
  );
  const programmingPlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 60 дней', programmingId, 8, 60, 9800],
  );
  const mathPlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 30 дней', mathId, 8, 30, 6900],
  );
  const prepPlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 30 дней', prepId, 8, 30, 6400],
  );
  const creativePlan8 = insert(
    database,
    `INSERT INTO subscription_plans (title, program_id, lesson_count, validity_days, price, currency, active)
     VALUES (?, ?, ?, ?, ?, 'RUB', 1)`,
    ['8 занятий / 60 дней', creativeId, 8, 60, 7200],
  );

  function createCustomer(telegramId: number, first: string, last: string, phone: string, email: string): number {
    return insert(
      database,
      `INSERT INTO customers (telegram_user_id, first_name, last_name, phone, email) VALUES (?, ?, ?, ?, ?)`,
      [telegramId, first, last, phone, email],
    );
  }
  function createFamily(customerId: number, name: string): number {
    return insert(database, `INSERT INTO families (primary_customer_id, name) VALUES (?, ?)`, [customerId, name]);
  }
  function createStudent(familyId: number, first: string, last: string, birth: string, notes = ''): number {
    return insert(
      database,
      `INSERT INTO students (family_id, first_name, last_name, birth_date, notes, active) VALUES (?, ?, ?, ?, ?, 1)`,
      [familyId, first, last, birth, notes],
    );
  }

  const mariaId = createCustomer(999000001, 'Мария', 'Смирнова', '+7 916 220-18-44', 'maria.smirnova@example.com');
  const smirnovFamily = createFamily(mariaId, 'Смирновы');
  const sofiaId = createStudent(smirnovFamily, 'София', 'Смирнова', '2016-03-12', 'Любит устные игры, стесняется читать вслух.');
  const maximId = createStudent(smirnovFamily, 'Максим', 'Смирнов', '2018-06-20', 'Очень увлечён механизмами, нужна динамика.');

  const elenaId = createCustomer(999000002, 'Елена', 'Петрова', '+7 903 441-12-90', 'elena.petrova@example.com');
  const petrovaFamily = createFamily(elenaId, 'Петровы');
  const alisaId = createStudent(petrovaFamily, 'Алиса', 'Петрова', '2020-04-02');

  const dmitryId = createCustomer(999000003, 'Дмитрий', 'Козлов', '+7 925 330-77-11', 'dmitry.kozlov@example.com');
  const kozlovFamily = createFamily(dmitryId, 'Козловы');
  const artemId = createStudent(kozlovFamily, 'Артём', 'Козлов', '2017-09-14');

  const olgaId = createCustomer(999000004, 'Ольга', 'Новикова', '+7 910 188-45-02', 'olga.novikova@example.com');
  const novikovFamily = createFamily(olgaId, 'Новиковы');
  const veraId = createStudent(novikovFamily, 'Вера', 'Новикова', '2020-01-28');

  const sergeyId = createCustomer(999000005, 'Сергей', 'Морозов', '+7 985 662-09-31', 'sergey.morozov@example.com');
  const morozovFamily = createFamily(sergeyId, 'Морозовы');
  const nikitaId = createStudent(morozovFamily, 'Никита', 'Морозов', '2015-11-03');

  const annaBelovaId = createCustomer(999000006, 'Анна', 'Белова', '+7 926 704-55-18', 'anna.belova@example.com');
  const belovaFamily = createFamily(annaBelovaId, 'Беловы');
  const lizaId = createStudent(belovaFamily, 'Лиза', 'Белова', '2018-02-19');

  const igorId = createCustomer(999000007, 'Игорь', 'Волков', '+7 915 200-61-47', 'igor.volkov@example.com');
  const volkovFamily = createFamily(igorId, 'Волковы');
  const glebId = createStudent(volkovFamily, 'Глеб', 'Волков', '2018-08-08');

  const nataliaId = createCustomer(999000008, 'Наталья', 'Ершова', '+7 903 118-22-70', 'natalia.ershova@example.com');
  const ershovFamily = createFamily(nataliaId, 'Ершовы');
  const miaId = createStudent(ershovFamily, 'Мия', 'Ершова', '2016-07-21');

  insert(
    database,
    `INSERT INTO enrollments (student_id, program_id, group_id, status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', ?)`,
    [sofiaId, englishId, englishGroup, addDaysIso(today, -28) + 'T10:00:00+03:00'],
  );
  insert(
    database,
    `INSERT INTO enrollments (student_id, program_id, group_id, status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', ?)`,
    [maximId, roboticsId, roboticsGroup, addDaysIso(today, -14) + 'T10:00:00+03:00'],
  );
  insert(
    database,
    `INSERT INTO enrollments (student_id, program_id, group_id, status, enrolled_at) VALUES (?, ?, ?, 'ACTIVE', ?)`,
    [miaId, englishId, englishGroup, addDaysIso(today, -21) + 'T10:00:00+03:00'],
  );

  const sofiaSub = insert(
    database,
    `INSERT INTO student_subscriptions (student_id, subscription_plan_id, purchased_lessons, remaining_lessons, starts_at, expires_at, status)
     VALUES (?, ?, 8, 3, ?, ?, 'EXPIRING')`,
    [sofiaId, englishPlan8, addDaysIso(today, -18), '2026-09-03'],
  );
  insert(
    database,
    `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id, created_at) VALUES (?, 'PURCHASE', 8, NULL, ?)`,
    [sofiaSub, addDaysIso(today, -18) + 'T11:00:00+03:00'],
  );
  const maximSub = insert(
    database,
    `INSERT INTO student_subscriptions (student_id, subscription_plan_id, purchased_lessons, remaining_lessons, starts_at, expires_at, status)
     VALUES (?, ?, 8, 7, ?, ?, 'ACTIVE')`,
    [maximId, roboticsPlan8, addDaysIso(today, -10), addDaysIso(today, 50)],
  );
  insert(
    database,
    `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id, created_at) VALUES (?, 'PURCHASE', 8, NULL, ?)`,
    [maximSub, addDaysIso(today, -10) + 'T11:00:00+03:00'],
  );
  const miaSub = insert(
    database,
    `INSERT INTO student_subscriptions (student_id, subscription_plan_id, purchased_lessons, remaining_lessons, starts_at, expires_at, status)
     VALUES (?, ?, 8, 2, ?, ?, 'EXPIRING')`,
    [miaId, englishPlan8, addDaysIso(today, -20), addDaysIso(today, 8)],
  );
  insert(
    database,
    `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id, created_at) VALUES (?, 'PURCHASE', 8, NULL, ?)`,
    [miaSub, addDaysIso(today, -20) + 'T11:00:00+03:00'],
  );

  const englishLessons = lessonsByGroup.get(englishGroup) ?? [];
  const roboticsLessons = lessonsByGroup.get(roboticsGroup) ?? [];
  const pastEnglish = englishLessons.filter((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) < today;
  });
  const pastRobotics = roboticsLessons.filter((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) < today;
  });

  pastEnglish.slice(-6).forEach((lessonId, index) => {
    const status = index === 2 ? 'ABSENT' : 'PRESENT';
    insert(
      database,
      `INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)`,
      [lessonId, sofiaId, status, status === 'ABSENT' ? 'Пропустила из-за ОРВИ' : ''],
    );
    if (index < 5) {
      insert(
        database,
        `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id) VALUES (?, 'LESSON_DEBIT', -1, ?)`,
        [sofiaSub, lessonId],
      );
    }
    insert(
      database,
      `INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'PRESENT', '')`,
      [lessonId, miaId],
    );
  });
  pastEnglish.slice(-6, -1).forEach((lessonId) => {
    insert(
      database,
      `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id) VALUES (?, 'LESSON_DEBIT', -1, ?)`,
      [miaSub, lessonId],
    );
  });

  if (pastRobotics.length) {
    const last = pastRobotics[pastRobotics.length - 1];
    insert(
      database,
      `INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'PRESENT', 'Собрал шасси без подсказки')`,
      [last, maximId],
    );
    insert(
      database,
      `INSERT INTO subscription_ledger (subscription_id, type, quantity, lesson_id) VALUES (?, 'LESSON_DEBIT', -1, ?)`,
      [maximSub, last],
    );
  }

  insert(
    database,
    `INSERT INTO progress_records (student_id, program_id, lesson_id, teacher_id, summary, score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sofiaId,
      englishId,
      pastEnglish[pastEnglish.length - 1] ?? null,
      annaId,
      'София увереннее отвечает на вопросы про день. Present Simple держит, Past Simple ещё путает окончания.',
      4,
      addDaysIso(today, -2) + 'T19:10:00+03:00',
    ],
  );
  insert(
    database,
    `INSERT INTO progress_records (student_id, program_id, lesson_id, teacher_id, summary, score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      maximId,
      roboticsId,
      pastRobotics[pastRobotics.length - 1] ?? null,
      ilyaId,
      'Максим быстро собирает базовую конструкцию и уже объясняет, зачем нужен датчик касания.',
      5,
      addDaysIso(today, -7) + 'T13:40:00+03:00',
    ],
  );

  const topics = [
    [sofiaId, englishId, 'Present Simple', 'COMPLETED'],
    [sofiaId, englishId, 'Daily Routine', 'COMPLETED'],
    [sofiaId, englishId, 'Past Simple', 'IN_PROGRESS'],
    [sofiaId, englishId, 'Irregular verbs', 'NOT_STARTED'],
    [maximId, roboticsId, 'Шасси и моторы', 'COMPLETED'],
    [maximId, roboticsId, 'Датчик касания', 'IN_PROGRESS'],
    [maximId, roboticsId, 'Линия и цвет', 'NOT_STARTED'],
  ] as const;
  for (const [studentId, programId, topic, status] of topics) {
    insert(
      database,
      `INSERT INTO topic_progress (student_id, program_id, topic, status) VALUES (?, ?, ?, ?)`,
      [studentId, programId, topic, status],
    );
  }

  const nextEnglish = englishLessons.find((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) >= today;
  });
  const lastEnglish = pastEnglish[pastEnglish.length - 1];
  if (lastEnglish) {
    insert(
      database,
      `INSERT INTO homework (lesson_id, title, description, due_at) VALUES (?, ?, ?, ?)`,
      [
        lastEnglish,
        'Unit 5',
        'Exercises 2–5 в рабочей тетради. Проговорить 6 фраз про вчерашний день в Past Simple.',
        addDaysIso(today, 5) + 'T18:00:00+03:00',
      ],
    );
    insert(
      database,
      `INSERT INTO learning_materials (lesson_id, title, type, url) VALUES (?, ?, 'PDF', ?)`,
      [lastEnglish, 'Unit 5 worksheet', 'https://brightway.school/materials/english-start-unit-5.pdf'],
    );
    insert(
      database,
      `INSERT INTO learning_materials (lesson_id, title, type, url) VALUES (?, ?, 'AUDIO', ?)`,
      [lastEnglish, 'Daily Routine audio', 'https://brightway.school/materials/daily-routine.mp3'],
    );
  }
  if (nextEnglish) {
    insert(
      database,
      `INSERT INTO homework (lesson_id, title, description, due_at) VALUES (?, ?, ?, ?)`,
      [
        nextEnglish,
        'Подготовка к Past Simple',
        'Посмотреть видео на 4 минуты и назвать 5 глаголов в прошедшем времени.',
        addDaysIso(today, 2) + 'T18:00:00+03:00',
      ],
    );
    insert(
      database,
      `INSERT INTO learning_materials (lesson_id, title, type, url) VALUES (?, ?, 'VIDEO', ?)`,
      [nextEnglish, 'Past Simple in 4 minutes', 'https://www.youtube.com/watch?v=brightway-past-simple'],
    );
  }
  if (pastRobotics.length) {
    const lastRobo = pastRobotics[pastRobotics.length - 1];
    insert(
      database,
      `INSERT INTO homework (lesson_id, title, description, due_at) VALUES (?, ?, ?, ?)`,
      [
        lastRobo,
        'Идея для шасси',
        'Нарисовать, как можно улучшить устойчивость робота. Принести рисунок на следующее занятие.',
        addDaysIso(today, 3) + 'T12:00:00+03:00',
      ],
    );
    insert(
      database,
      `INSERT INTO learning_materials (lesson_id, title, type, url) VALUES (?, ?, 'LINK', ?)`,
      [lastRobo, 'SPIKE Prime getting started', 'https://education.lego.com/en-us/product-resources/spike-prime/'],
    );
  }

  function createLead(
    customerId: number,
    studentId: number,
    programId: number,
    status: string,
    createdOffset: number,
    convertedAt: string | null = null,
  ): number {
    return insert(
      database,
      `INSERT INTO leads (customer_id, student_id, program_id, source, status, created_at, converted_at)
       VALUES (?, ?, ?, 'miniapp', ?, ?, ?)`,
      [customerId, studentId, programId, status, addDaysIso(today, createdOffset) + 'T12:00:00+03:00', convertedAt],
    );
  }

  const newLead = createLead(elenaId, alisaId, englishId, 'NEW', -1);
  const qualifiedLead = createLead(dmitryId, artemId, mathId, 'QUALIFIED', -3);
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      qualifiedLead,
      ageFromBirth('2017-09-14', now),
      '7-9',
      'базовый',
      'улучшить школьную успеваемость',
      'group',
      'вт,чт',
      'weekday_after_school',
      'Нужна помощь с текстовыми задачами.',
    ],
  );

  const trialBookedLead = createLead(olgaId, veraId, prepId, 'TRIAL_BOOKED', -2);
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [trialBookedLead, 6, '4-6', 'начинающий', 'подготовка к школе', 'group', 'пн,ср', 'weekday_after_school', ''],
  );
  const prepFuture = (lessonsByGroup.get(prepGroup) ?? []).find((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) > today;
  });
  const prepStarts = prepFuture
    ? (database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(prepFuture) as { starts_at: string }).starts_at
    : toIsoDateTime(addDaysIso(today, 5), '16:00');
  insert(
    database,
    `INSERT INTO trial_lessons (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'BOOKED')`,
    [trialBookedLead, veraId, prepId, marinaId, prepGroup, prepStarts],
  );

  const attendedLead = createLead(sergeyId, nikitaId, programmingId, 'TRIAL_ATTENDED', -6);
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attendedLead, 11, '10-12', 'базовый', 'обучение с нуля', 'group', 'сб', 'weekend', 'Интересуется играми.'],
  );
  const pastProgramming = (lessonsByGroup.get(programmingGroup) ?? []).filter((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) < today;
  });
  const attendedStarts = pastProgramming.length
    ? (database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(pastProgramming[pastProgramming.length - 1]) as {
        starts_at: string;
      }).starts_at
    : toIsoDateTime(addDaysIso(today, -7), '10:00');
  insert(
    database,
    `INSERT INTO trial_lessons (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status, teacher_comment)
     VALUES (?, ?, ?, ?, ?, ?, 'ATTENDED', ?)`,
    [
      attendedLead,
      nikitaId,
      programmingId,
      pavelId,
      programmingGroup,
      attendedStarts,
      'Никита уверенно собрал первый скрипт. Рекомендую Programming Start.',
    ],
  );

  const offeredLead = createLead(annaBelovaId, lizaId, creativeId, 'OFFERED', -8);
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [offeredLead, 8, '7-9', 'базовый', 'творческое развитие', 'group', 'сб', 'weekend', ''],
  );
  const pastCreative = (lessonsByGroup.get(creativeGroup) ?? []).filter((id) => {
    const row = database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(id) as { starts_at: string };
    return datePart(row.starts_at) < today;
  });
  const offeredStarts = pastCreative.length
    ? (database.prepare('SELECT starts_at FROM lessons WHERE id = ?').get(pastCreative[pastCreative.length - 1]) as {
        starts_at: string;
      }).starts_at
    : toIsoDateTime(addDaysIso(today, -7), '14:00');
  const lizaTrial = insert(
    database,
    `INSERT INTO trial_lessons (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status, teacher_comment, recommended_program_id, recommended_group_id)
     VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
    [
      offeredLead,
      lizaId,
      creativeId,
      elenaTeacherId,
      creativeGroup,
      offeredStarts,
      'Лизе комфортно в студии, хорошо чувствует цвет. Рекомендую группу субботы 14:00.',
      creativeId,
      creativeGroup,
    ],
  );
  insert(
    database,
    `INSERT INTO recommendations (student_id, trial_lesson_id, program_id, group_id, teacher_id, subscription_plan_id, text, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`,
    [
      lizaId,
      lizaTrial,
      creativeId,
      creativeGroup,
      elenaTeacherId,
      creativePlan8,
      'Лизе подходит Creative Studio. Группа в субботу в 14:00, преподаватель Елена Васильева. Абонемент 8 занятий — 7 200 ₽.',
      addDaysIso(today, -1) + 'T16:00:00+03:00',
    ],
  );

  const convertedLead = createLead(mariaId, sofiaId, englishId, 'CONVERTED', -30, addDaysIso(today, -18) + 'T11:20:00+03:00');
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [convertedLead, 10, '10-12', 'начинающий', 'разговорный английский', 'group', 'пн,ср', 'weekday_evening', ''],
  );
  insert(
    database,
    `INSERT INTO trial_lessons (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status, teacher_comment, recommended_program_id, recommended_group_id)
     VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
    [
      convertedLead,
      sofiaId,
      englishId,
      annaId,
      englishGroup,
      toIsoDateTime(addDaysIso(today, -32), '18:00'),
      'Софии подходит English Start A1. Спокойно включается в группу 9–11.',
      englishId,
      englishGroup,
    ],
  );
  insert(
    database,
    `INSERT INTO recommendations (student_id, trial_lesson_id, program_id, group_id, teacher_id, subscription_plan_id, text, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ACCEPTED', ?)`,
    [
      sofiaId,
      database.prepare('SELECT id FROM trial_lessons WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(sofiaId) as never
        ? (database.prepare('SELECT id FROM trial_lessons WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(sofiaId) as { id: number }).id
        : null,
      englishId,
      englishGroup,
      annaId,
      englishPlan8,
      'Софии подходит English Start A1. Пн / Ср 18:00, Анна Орлова. 8 занятий — 7 900 ₽.',
      addDaysIso(today, -20) + 'T12:00:00+03:00',
    ],
  );

  insert(
    database,
    `INSERT INTO recommendations (student_id, trial_lesson_id, program_id, group_id, teacher_id, subscription_plan_id, text, status, created_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 'NEW', ?)`,
    [
      sofiaId,
      englishId,
      englishGroup,
      annaId,
      englishPlan8,
      'Софии подходит продолжение English Start A1 в той же группе. Пн / Ср 18:00, Анна Орлова. 8 занятий — 7 900 ₽.',
      addDaysIso(today, -1) + 'T09:00:00+03:00',
    ],
  );

  const lostLead = createLead(igorId, glebId, roboticsId, 'LOST', -12);
  insert(
    database,
    `INSERT INTO lead_qualifications (lead_id, age, age_band, current_level, goal, preferred_format, preferred_days, preferred_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [lostLead, 8, '7-9', 'начинающий', 'робототехника', 'group', 'сб', 'weekend', ''],
  );
  insert(
    database,
    `INSERT INTO trial_lessons (lead_id, student_id, program_id, teacher_id, group_id, starts_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'NO_SHOW')`,
    [lostLead, glebId, roboticsId, ilyaId, roboticsGroup, toIsoDateTime(addDaysIso(today, -9), '12:00')],
  );

  insert(
    database,
    `INSERT INTO notifications (customer_id, type, title, body, status, created_at) VALUES (?, ?, ?, ?, 'UNREAD', ?)`,
    [
      mariaId,
      'lesson_reminder',
      'Занятие завтра',
      'Завтра в 18:00 занятие English Start.',
      addDaysIso(today, 0) + 'T09:00:00+03:00',
    ],
  );
  insert(
    database,
    `INSERT INTO notifications (customer_id, type, title, body, status, created_at) VALUES (?, ?, ?, ?, 'UNREAD', ?)`,
    [
      mariaId,
      'renewal',
      'Осталось мало занятий',
      'У Софии осталось 3 занятия. Продлите абонемент, чтобы сохранить место в группе.',
      addDaysIso(today, -1) + 'T10:00:00+03:00',
    ],
  );
  insert(
    database,
    `INSERT INTO notifications (customer_id, type, title, body, status, created_at) VALUES (?, ?, ?, ?, 'UNREAD', ?)`,
    [
      annaBelovaId,
      'recommendation',
      'Рекомендация после пробного',
      'Елена подготовила рекомендацию для Лизы.',
      addDaysIso(today, -1) + 'T16:05:00+03:00',
    ],
  );

  insert(
    database,
    `INSERT INTO domain_events (name, payload, created_at) VALUES (?, ?, ?)`,
    ['lead_created', JSON.stringify({ leadId: newLead }), addDaysIso(today, -1) + 'T12:00:00+03:00'],
  );
  insert(
    database,
    `INSERT INTO domain_events (name, payload, created_at) VALUES (?, ?, ?)`,
    ['subscription_low_balance', JSON.stringify({ studentId: miaId, remaining: 2 }), addDaysIso(today, 0) + 'T08:00:00+03:00'],
  );

  void englishPlan16;
  void programmingPlan8;
  void mathPlan8;
  void prepPlan8;
  void nataliaId;
}
