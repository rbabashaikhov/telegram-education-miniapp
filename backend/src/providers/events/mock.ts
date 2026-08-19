import type { DomainEvent, OutboundEventName } from '../../types.js';
import type { EventProvider } from '../types.js';

export function createMockEventPublisher(): EventProvider {
  const events: DomainEvent[] = [];
  let nextId = 1;
  return {
    publish(name: OutboundEventName, payload: Record<string, unknown>): DomainEvent {
      const event: DomainEvent = {
        id: nextId++,
        name,
        payload,
        createdAt: new Date().toISOString(),
      };
      events.unshift(event);
      return event;
    },
    list(limit = 50) {
      return events.slice(0, limit);
    },
  };
}
