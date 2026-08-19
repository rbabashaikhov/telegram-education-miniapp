import type { NotificationRecord } from '../../types.js';
import type { NotificationProvider } from '../types.js';

export function createMockNotificationProvider(): NotificationProvider {
  const records: NotificationRecord[] = [];
  let nextId = 1;
  return {
    enqueue(params) {
      const record: NotificationRecord = {
        id: nextId++,
        customerId: params.customerId,
        type: params.type,
        title: params.title,
        body: params.body,
        status: 'UNREAD',
        createdAt: new Date().toISOString(),
      };
      records.unshift(record);
      return record;
    },
    list(customerId) {
      return customerId ? records.filter((row) => row.customerId === customerId) : records;
    },
    markRead(id) {
      const record = records.find((row) => row.id === id);
      if (!record) {
        throw new Error('Notification not found');
      }
      record.status = 'READ';
      return record;
    },
  };
}
