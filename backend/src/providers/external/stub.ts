import { AppError } from '../../errors.js';
import type { CRMProvider, Providers } from '../types.js';

function notConfigured(code: string, message: string, method: string): never {
  throw new AppError(message, 501, code, { method });
}

export function createExternalCrmProvider(): CRMProvider {
  const fail = (method: string): never =>
    notConfigured('CRM_NOT_CONFIGURED', `External CRM adapter is not configured. Implement a partner CRM for ${method}.`, method);
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        return () => fail(String(prop));
      },
    },
  ) as CRMProvider;
}

export function createExternalProviders(): Providers {
  const fail = (method: string): never =>
    notConfigured(
      'NOT_CONFIGURED',
      `External data mode is not configured. Implement a school CRM/ERP adapter for ${method}.`,
      method,
    );

  const stub = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        return () => fail(String(prop));
      },
    },
  );

  return {
    school: stub as Providers['school'],
    customers: stub as Providers['customers'],
    families: stub as Providers['families'],
    students: stub as Providers['students'],
    programs: stub as Providers['programs'],
    teachers: stub as Providers['teachers'],
    groups: stub as Providers['groups'],
    lessons: stub as Providers['lessons'],
    leads: stub as Providers['leads'],
    trials: stub as Providers['trials'],
    recommendations: stub as Providers['recommendations'],
    enrollments: stub as Providers['enrollments'],
    subscriptions: stub as Providers['subscriptions'],
    attendance: stub as Providers['attendance'],
    progress: stub as Providers['progress'],
    homework: stub as Providers['homework'],
    payments: stub as Providers['payments'],
    crm: stub as Providers['crm'],
    events: stub as Providers['events'],
    notifications: stub as Providers['notifications'],
    transaction<T>(fn: () => T): T {
      return fn();
    },
  };
}
