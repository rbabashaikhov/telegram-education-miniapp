import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import { ensureEnrollment } from './enrollment.js';
import { updateLeadStatus } from './lead.js';
import { notify } from './notification.js';
import { addDaysIso, todayDateString } from './time.js';

export function refreshSubscriptionStatus(providers: Providers, subscriptionId: number, now = new Date()) {
  const subscription = providers.subscriptions.getById(subscriptionId);
  if (!subscription) throw new AppError('Абонемент не найден.', 404, 'SUBSCRIPTION_NOT_FOUND');
  if (subscription.status === 'CANCELLED' || subscription.status === 'FROZEN') return subscription;
  const today = todayDateString(now);
  let status = subscription.status;
  if (subscription.expiresAt < today || subscription.remainingLessons <= 0) {
    status = 'EXPIRED';
  } else if (subscription.remainingLessons <= 3 || daysUntil(today, subscription.expiresAt) <= 14) {
    status = 'EXPIRING';
  } else {
    status = 'ACTIVE';
  }
  return providers.subscriptions.update(subscriptionId, { status });
}

function daysUntil(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function purchaseSubscription(
  providers: Providers,
  params: {
    customerId: number;
    studentId: number;
    planId: number;
    leadId?: number;
    recommendationId?: number;
  },
) {
  return providers.transaction(() => {
    const plan = providers.subscriptions.getPlan(params.planId);
    if (!plan || !plan.active) throw new AppError('Тариф не найден.', 404, 'PLAN_NOT_FOUND');
    const student = providers.students.getById(params.studentId);
    if (!student) throw new AppError('Ученик не найден.', 404, 'STUDENT_NOT_FOUND');

    const payment = providers.payments.charge({
      customerId: params.customerId,
      studentId: student.id,
      amount: plan.price,
      currency: plan.currency,
      description: plan.title,
    });

    const today = todayDateString();
    const subscription = providers.subscriptions.create({
      studentId: student.id,
      subscriptionPlanId: plan.id,
      purchasedLessons: plan.lessonCount,
      remainingLessons: plan.lessonCount,
      startsAt: today,
      expiresAt: addDaysIso(today, plan.validityDays),
      status: 'ACTIVE',
    });
    providers.subscriptions.insertLedger({
      subscriptionId: subscription.id,
      type: 'PURCHASE',
      quantity: plan.lessonCount,
      lessonId: null,
    });

    const group = providers.groups.list({ programId: plan.programId })[0];
    const { enrollment } = ensureEnrollment(providers, {
      studentId: student.id,
      programId: plan.programId,
      groupId: group?.id ?? null,
    });

    if (params.leadId) {
      updateLeadStatus(providers, params.leadId, 'CONVERTED');
    } else {
      const offered = providers.leads
        .list({ customerId: params.customerId })
        .find((lead) => lead.studentId === student.id && (lead.status === 'OFFERED' || lead.status === 'TRIAL_ATTENDED'));
      if (offered) updateLeadStatus(providers, offered.id, 'CONVERTED');
    }
    if (params.recommendationId) {
      providers.recommendations.updateStatus(params.recommendationId, 'ACCEPTED');
    }

    providers.crm.syncSubscription(subscription);
    providers.events.publish('subscription_purchased', {
      subscriptionId: subscription.id,
      studentId: student.id,
      paymentId: payment.id,
    });
    notify(providers, {
      customerId: params.customerId,
      type: 'subscription_purchased',
      title: 'Абонемент оформлен',
      body: `${student.firstName}: ${plan.title}. Занятий: ${plan.lessonCount}.`,
    });

    return { subscription, enrollment, payment };
  });
}

export function debitLesson(
  providers: Providers,
  params: { studentId: number; lessonId: number },
) {
  const subscriptions = providers.subscriptions
    .listByStudent(params.studentId)
    .map((item) => refreshSubscriptionStatus(providers, item.id))
    .filter((item) => item.status === 'ACTIVE' || item.status === 'EXPIRING');
  const subscription = subscriptions[0];
  if (!subscription) return null;
  const already = providers.subscriptions
    .listLedger(subscription.id)
    .some((entry) => entry.type === 'LESSON_DEBIT' && entry.lessonId === params.lessonId);
  if (already) return subscription;

  providers.subscriptions.insertLedger({
    subscriptionId: subscription.id,
    type: 'LESSON_DEBIT',
    quantity: -1,
    lessonId: params.lessonId,
  });
  const remaining = Math.max(0, subscription.remainingLessons - 1);
  const updated = providers.subscriptions.update(subscription.id, { remainingLessons: remaining });
  const refreshed = refreshSubscriptionStatus(providers, updated.id);
  if (remaining <= 2) {
    const student = providers.students.getById(params.studentId);
    const family = student ? providers.families.getById(student.familyId) : undefined;
    providers.events.publish('subscription_low_balance', {
      subscriptionId: refreshed.id,
      studentId: params.studentId,
      remaining,
    });
    if (family) {
      providers.notifications.enqueue({
        customerId: family.primaryCustomerId,
        type: 'renewal',
        title: 'Осталось мало занятий',
        body: `У ${student?.firstName ?? 'ученика'} осталось ${remaining} занятия. Продлите абонемент, чтобы сохранить место в группе.`,
      });
    }
  }
  return refreshed;
}
