import type { Providers } from '../providers/types.js';
import type { AdminDashboard, AttentionItem, FunnelMetrics } from '../types.js';
import { refreshSubscriptionStatus } from './subscription.js';
import { daysBetween, todayDateString } from './time.js';

export function funnelMetrics(providers: Providers): FunnelMetrics {
  const leads = providers.leads.list();
  const count = (status: string) => leads.filter((lead) => lead.status === status).length;
  const newLeads = count('NEW');
  const qualified = count('QUALIFIED') + count('TRIAL_BOOKED') + count('TRIAL_ATTENDED') + count('OFFERED') + count('CONVERTED');
  const trialBooked = count('TRIAL_BOOKED') + count('TRIAL_ATTENDED') + count('OFFERED') + count('CONVERTED');
  const attended = count('TRIAL_ATTENDED') + count('OFFERED') + count('CONVERTED');
  const offered = count('OFFERED') + count('CONVERTED');
  const converted = count('CONVERTED');
  const lost = count('LOST');
  const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0;
  return { newLeads, qualified, trialBooked, attended, offered, converted, lost, conversionRate };
}

export function adminDashboard(providers: Providers, now = new Date()): AdminDashboard {
  const today = todayDateString(now);
  const leads = providers.leads.list();
  const trials = providers.trials.list();
  const students = providers.students.listAll();
  const funnel = funnelMetrics(providers);

  let expiring = 0;
  let lowBalance = 0;
  for (const student of students) {
    for (const subscription of providers.subscriptions.listByStudent(student.id)) {
      const refreshed = refreshSubscriptionStatus(providers, subscription.id, now);
      if (refreshed.status === 'EXPIRING' || daysBetween(today, refreshed.expiresAt) <= 14) expiring += 1;
      if (refreshed.remainingLessons <= 2 && refreshed.status !== 'CANCELLED') lowBalance += 1;
    }
  }

  const absences = students.filter((student) => providers.attendance.countByStatus(student.id, 'ABSENT') >= 1).length;
  const noOffer = leads.filter((lead) => lead.status === 'TRIAL_ATTENDED').length;

  const attention: AttentionItem[] = [];
  if (expiring) {
    attention.push({
      kind: 'expiring',
      title: `${expiring} абонементов заканчиваются`,
      detail: 'Нужно предложить продление, чтобы сохранить место в группе.',
      count: expiring,
    });
  }
  if (absences) {
    attention.push({
      kind: 'absent',
      title: `${absences} ученика пропустили занятия`,
      detail: 'Свяжитесь с родителями, пока пропуск не стал привычкой.',
      count: absences,
    });
  }
  if (noOffer) {
    attention.push({
      kind: 'no_offer',
      title: `${noOffer} клиента после пробного ещё не получили предложение`,
      detail: 'Зафиксируйте рекомендацию преподавателя и отправьте оффер.',
      count: noOffer,
    });
  }
  if (lowBalance) {
    attention.push({
      kind: 'low_balance',
      title: `${lowBalance} абонементов с низким остатком`,
      detail: 'Клиенты близки к окончанию пакета занятий.',
      count: lowBalance,
    });
  }

  return {
    kpis: {
      newLeads: funnel.newLeads,
      trials: trials.filter((trial) => trial.status === 'BOOKED' || trial.status === 'CONFIRMED').length,
      newStudents: students.length,
      renewals: expiring,
    },
    funnel,
    attention,
  };
}
