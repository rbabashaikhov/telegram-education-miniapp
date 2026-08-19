import { describe, expect, it } from 'vitest';
import { funnelMetrics } from './dashboard.js';
import { qualifyLead } from './matching.js';
import { createRecommendation, updateTrial } from './recommendation.js';
import { markAttendance } from './attendance.js';
import { debitLesson, purchaseSubscription } from './subscription.js';
import { bookTrial, listTrialSlots } from './trial.js';
import { MARIA, NEW_PARENT, seedDemoWorld } from '../test/harness.js';
import { AppError } from '../errors.js';
import { scanRetention } from './retention.js';

describe('education funnel', () => {
  it('qualifies a lead and recommends a group', () => {
    const world = seedDemoWorld();
    const customer = world.providers.customers.upsert(NEW_PARENT).customer;
    const result = qualifyLead(world.providers, customer, {
      ageBand: '7-9',
      age: 8,
      goal: 'робототехника',
      currentLevel: 'начинающий',
      preferredFormat: 'group',
      preferredTime: 'weekend',
    });
    expect(result.lead.status).toBe('QUALIFIED');
    expect(result.qualification.goal).toBe('робототехника');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0].program.title).toContain('Robotics');
    expect(world.providers.events.list().some((event) => event.name === 'lead_qualified')).toBe(true);
  });

  it('books a trial and rejects a colliding slot', () => {
    const world = seedDemoWorld();
    const parent = world.providers.customers.upsert(NEW_PARENT).customer;
    const family = world.providers.families.create(parent.id, parent.lastName);
    const match = qualifyLead(world.providers, parent, {
      ageBand: '10-12',
      age: 10,
      goal: 'разговорный английский',
      currentLevel: 'начинающий',
      preferredFormat: 'group',
      preferredTime: 'weekday_evening',
    });
    const group = match.recommendations[0];
    const student = world.providers.students.create({
      familyId: family.id,
      firstName: 'Даша',
      lastName: 'Лебедева',
      birthDate: '2016-05-01',
      notes: '',
      active: true,
    });
    const slot = listTrialSlots(world.providers, { groupId: group.id })[0];
    expect(slot).toBeTruthy();
    const trial = bookTrial(world.providers, {
      leadId: match.lead.id,
      studentId: student.id,
      groupId: group.id,
      startsAt: slot.startsAt,
    });
    expect(trial.status).toBe('BOOKED');
    expect(world.providers.leads.getById(match.lead.id)?.status).toBe('TRIAL_BOOKED');

    expect(() =>
      bookTrial(world.providers, {
        leadId: match.lead.id,
        studentId: student.id,
        groupId: group.id,
        startsAt: slot.startsAt,
      }),
    ).toThrow(AppError);
  });

  it('marks trial attendance, creates a recommendation and converts via purchase', () => {
    const world = seedDemoWorld();
    const maria = world.providers.customers.getByTelegramUserId(MARIA.id)!;
    const offered = world.providers.leads.list().find((lead) => lead.status === 'TRIAL_ATTENDED')!;
    const trial = world.providers.trials.list({ leadId: offered.id })[0];
    const rec = createRecommendation(world.providers, trial.id, {});
    expect(rec.program.title).toBeTruthy();
    expect(world.providers.leads.getById(offered.id)?.status).toBe('OFFERED');

    const result = purchaseSubscription(world.providers, {
      customerId: maria.id,
      studentId: rec.studentId,
      planId: rec.plan!.id,
      leadId: offered.id,
      recommendationId: rec.id,
    });
    expect(result.enrollment.status).toBe('ACTIVE');
    expect(result.subscription.remainingLessons).toBe(result.subscription.purchasedLessons);
    expect(world.providers.leads.getById(offered.id)?.status).toBe('CONVERTED');
    expect(world.providers.events.list().some((event) => event.name === 'subscription_purchased')).toBe(true);
  });

  it('updates trial status to attended and no-show', () => {
    const world = seedDemoWorld();
    const booked = world.providers.trials.list().find((trial) => trial.status === 'BOOKED')!;
    const attended = updateTrial(world.providers, booked.id, { status: 'ATTENDED', teacherComment: 'Была на уроке' });
    expect(attended.status).toBe('ATTENDED');
    expect(world.providers.leads.getById(attended.leadId)?.status).toBe('TRIAL_ATTENDED');

    const noshow = world.providers.trials.list().find((trial) => trial.status === 'NO_SHOW');
    expect(noshow).toBeTruthy();
  });

  it('debits a lesson and emits low balance', () => {
    const world = seedDemoWorld();
    const mia = world.providers.students.listAll().find((item) => item.firstName === 'Мия')!;
    const lesson = world.providers.lessons.list({ studentId: mia.id }).find((item) => item.status === 'SCHEDULED')!;
    const before = world.providers.subscriptions.listByStudent(mia.id)[0];
    const updated = debitLesson(world.providers, { studentId: mia.id, lessonId: lesson.id })!;
    expect(updated.remainingLessons).toBe(before.remainingLessons - 1);
    expect(world.providers.events.list().some((event) => event.name === 'subscription_low_balance')).toBe(true);
  });

  it('records attendance and publishes student_absent', () => {
    const world = seedDemoWorld();
    const sofia = world.providers.students.listAll().find((item) => item.firstName === 'София')!;
    const lesson = world.providers.lessons.list({ studentId: sofia.id }).find((item) => item.status === 'SCHEDULED')!;
    markAttendance(world.providers, { lessonId: lesson.id, studentId: sofia.id, status: 'ABSENT', comment: 'Болеет' });
    expect(world.providers.events.list().some((event) => event.name === 'student_absent')).toBe(true);
  });

  it('computes admin funnel metrics from demo data', () => {
    const world = seedDemoWorld();
    const funnel = funnelMetrics(world.providers);
    expect(funnel.newLeads).toBeGreaterThan(0);
    expect(funnel.converted).toBeGreaterThan(0);
    expect(funnel.lost).toBeGreaterThan(0);
    expect(funnel.conversionRate).toBeGreaterThan(0);
  });

  it('flags expiring subscriptions during retention scan', () => {
    const world = seedDemoWorld();
    const events = scanRetention(world.providers, world.now);
    expect(events.some((event) => event.name === 'subscription_expiring' || event.name === 'subscription_low_balance')).toBe(
      true,
    );
  });
});
