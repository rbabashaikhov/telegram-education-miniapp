import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { Customer, Lead, LeadStatus } from '../types.js';

export function requireLead(providers: Providers, leadId: number): Lead {
  const lead = providers.leads.getById(leadId);
  if (!lead) throw new AppError('Лид не найден.', 404, 'LEAD_NOT_FOUND');
  return lead;
}

export function createLead(
  providers: Providers,
  customer: Customer,
  params: { studentId?: number; programId?: number; source?: string },
): Lead {
  const lead = providers.leads.create({
    customerId: customer.id,
    studentId: params.studentId ?? null,
    programId: params.programId ?? null,
    source: params.source ?? 'miniapp',
    status: 'NEW',
  });
  providers.crm.createLead(lead);
  providers.events.publish('lead_created', { leadId: lead.id, customerId: customer.id });
  return lead;
}

export function updateLeadStatus(providers: Providers, leadId: number, status: LeadStatus): Lead {
  const lead = requireLead(providers, leadId);
  const updated = providers.leads.update(leadId, {
    status,
    convertedAt: status === 'CONVERTED' ? new Date().toISOString() : lead.convertedAt,
  });
  providers.crm.updateLead(updated);
  return updated;
}
