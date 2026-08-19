import type { Providers } from '../providers/types.js';
import type { NotificationRecord } from '../types.js';

export function notify(
  providers: Providers,
  params: { customerId: number; type: string; title: string; body: string },
): NotificationRecord {
  return providers.notifications.enqueue(params);
}
