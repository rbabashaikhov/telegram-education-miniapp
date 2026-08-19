import { describe, expect, it } from 'vitest';
import { createExternalCrmProvider, createExternalProviders } from './stub.js';
import { createExternalPaymentProvider } from '../payments/external.js';

describe('external stubs', () => {
  it('returns 501 NOT_CONFIGURED for data operations', () => {
    const providers = createExternalProviders();
    try {
      providers.students.listAll();
      throw new Error('expected failure');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, code: 'NOT_CONFIGURED' });
    }
  });

  it('returns CRM_NOT_CONFIGURED for the CRM adapter', () => {
    const crm = createExternalCrmProvider();
    try {
      crm.createLead({} as never);
      throw new Error('expected failure');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, code: 'CRM_NOT_CONFIGURED' });
    }
  });

  it('returns PAYMENT_NOT_CONFIGURED for the payment adapter', () => {
    const payments = createExternalPaymentProvider();
    try {
      payments.charge({ customerId: 1, studentId: 1, amount: 100, currency: 'RUB', description: 'x' });
      throw new Error('expected failure');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, code: 'PAYMENT_NOT_CONFIGURED' });
    }
  });
});
