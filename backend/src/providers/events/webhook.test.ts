import { describe, expect, it, vi } from 'vitest';
import { createMockEventPublisher } from './mock.js';
import { createWebhookEventPublisher } from './webhook.js';

describe('webhook events', () => {
  it('forwards published events to the webhook URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const inner = createMockEventPublisher();
    const publisher = createWebhookEventPublisher(inner, 'https://crm.example/events');
    publisher.publish('lead_created', { leadId: 1 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
