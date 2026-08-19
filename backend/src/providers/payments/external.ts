import { AppError } from '../../errors.js';
import type { PaymentProvider } from '../types.js';

export function createExternalPaymentProvider(): PaymentProvider {
  const fail = (method: string): never => {
    throw new AppError(
      `External payment adapter is not configured. Implement acquiring for ${method}.`,
      501,
      'PAYMENT_NOT_CONFIGURED',
      { method },
    );
  };
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        return () => fail(String(prop));
      },
    },
  ) as PaymentProvider;
}
