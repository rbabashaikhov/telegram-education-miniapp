import { config } from '../config.js';
import type { Providers } from '../providers/types.js';
import { refreshSubscriptionStatus } from './subscription.js';
import { daysBetween, todayDateString } from './time.js';

export function scanRetention(providers: Providers, now = new Date()) {
  const today = todayDateString(now);
  const events: Array<{ name: string; studentId: number }> = [];

  for (const student of providers.students.listAll().filter((item) => item.active)) {
    for (const subscription of providers.subscriptions.listByStudent(student.id)) {
      const refreshed = refreshSubscriptionStatus(providers, subscription.id, now);
      if (refreshed.status === 'EXPIRING' || refreshed.status === 'ACTIVE') {
        const daysLeft = daysBetween(today, refreshed.expiresAt);
        if (daysLeft >= 0 && daysLeft <= config.retention.expiringDays) {
          providers.events.publish('subscription_expiring', {
            subscriptionId: refreshed.id,
            studentId: student.id,
            daysLeft,
          });
          events.push({ name: 'subscription_expiring', studentId: student.id });
        }
        if (refreshed.remainingLessons <= config.retention.lowBalance) {
          providers.events.publish('subscription_low_balance', {
            subscriptionId: refreshed.id,
            studentId: student.id,
            remaining: refreshed.remainingLessons,
          });
          providers.events.publish('renewal_due', {
            subscriptionId: refreshed.id,
            studentId: student.id,
          });
          events.push({ name: 'subscription_low_balance', studentId: student.id });
        }
      }
    }
  }
  return events;
}
