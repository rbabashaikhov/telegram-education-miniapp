import Database from 'better-sqlite3';
import { migrate } from '../db/schema.js';
import { seed } from '../db/seed.js';
import { createLocalProviders } from '../providers/local/sqlite.js';
import type { Providers } from '../providers/types.js';
import type { TelegramUser } from '../types.js';
import { addDaysIso, todayDateString } from '../services/time.js';

export const MARIA: TelegramUser = {
  id: 999000001,
  first_name: 'Мария',
  last_name: 'Смирнова',
  username: 'demo_parent',
};

export const NEW_PARENT: TelegramUser = {
  id: 888000001,
  first_name: 'Кирилл',
  last_name: 'Лебедев',
  username: 'new_parent',
};

export interface TestWorld {
  db: Database.Database;
  providers: Providers;
  now: Date;
  today: string;
  futureDate: string;
}

export function createEmptyWorld(now = new Date('2026-08-19T12:00:00+03:00')): TestWorld {
  const db = new Database(':memory:');
  migrate(db);
  return {
    db,
    providers: createLocalProviders(db),
    now,
    today: todayDateString(now),
    futureDate: addDaysIso(todayDateString(now), 2),
  };
}

export function seedDemoWorld(now = new Date('2026-08-19T12:00:00+03:00')): TestWorld {
  const db = new Database(':memory:');
  migrate(db);
  seed(db, now);
  return {
    db,
    providers: createLocalProviders(db),
    now,
    today: todayDateString(now),
    futureDate: addDaysIso(todayDateString(now), 2),
  };
}
