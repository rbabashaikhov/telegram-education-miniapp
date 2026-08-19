import { describe, expect, it } from 'vitest';
import { seedDemoWorld } from '../test/harness.js';

describe('demo seed invariants', () => {
  it('creates BrightWay with the Smirnov family and a full funnel', () => {
    const world = seedDemoWorld();
    const school = world.providers.school.getSchool();
    expect(school.name).toBe('BrightWay Education');
    const maria = world.providers.customers.getByTelegramUserId(999000001);
    expect(maria?.firstName).toBe('Мария');
    const family = world.providers.families.getByCustomerId(maria!.id)!;
    const students = world.providers.students.listByFamily(family.id);
    expect(students.map((item) => item.firstName).sort()).toEqual(['Максим', 'София']);

    const sofia = students.find((item) => item.firstName === 'София')!;
    const sub = world.providers.subscriptions.listByStudent(sofia.id)[0];
    expect(sub.remainingLessons).toBe(3);
    expect(sub.purchasedLessons).toBe(8);

    const statuses = new Set(world.providers.leads.list().map((lead) => lead.status));
    for (const status of ['NEW', 'QUALIFIED', 'TRIAL_BOOKED', 'TRIAL_ATTENDED', 'OFFERED', 'CONVERTED', 'LOST']) {
      expect(statuses.has(status as never)).toBe(true);
    }
  });
});
