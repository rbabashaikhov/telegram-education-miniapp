export function money(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

export function humanDate(value: string): string {
  const date = value.slice(0, 10);
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
}

export function shortDate(value: string): string {
  const date = value.slice(0, 10);
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}

export function timeOf(value: string): string {
  return value.slice(11, 16);
}

export function personName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function lessonWhen(iso: string, now = new Date()): string {
  const date = iso.slice(0, 10);
  const time = timeOf(iso);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (date === today) return `Сегодня, ${time}`;
  return `${humanDate(iso)}, ${time}`;
}

export const LEDGER_TYPE: Record<string, string> = {
  PURCHASE: 'Покупка',
  LESSON_DEBIT: 'Списание занятия',
  REFUND: 'Возврат',
  MANUAL_ADJUSTMENT: 'Корректировка',
};

export function weekdayLabel(iso: string): string {
  const date = iso.slice(0, 10);
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(y, m - 1, d));
}

export const LEAD_STATUS: Record<string, string> = {
  NEW: 'Новый',
  QUALIFIED: 'Квалифицирован',
  TRIAL_BOOKED: 'Пробное записано',
  TRIAL_ATTENDED: 'Был на пробном',
  OFFERED: 'Есть предложение',
  CONVERTED: 'Купил',
  LOST: 'Потерян',
};

export const TRIAL_STATUS: Record<string, string> = {
  BOOKED: 'Записан',
  CONFIRMED: 'Подтверждён',
  ATTENDED: 'Посетил',
  NO_SHOW: 'Не пришёл',
  CANCELLED: 'Отменён',
  COMPLETED: 'Завершён',
};

export const TOPIC_STATUS: Record<string, string> = {
  NOT_STARTED: 'Не начато',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
};

export const ATTEND_STATUS: Record<string, string> = {
  PRESENT: 'Был',
  ABSENT: 'Пропуск',
  EXCUSED: 'По уважительной',
  CANCELLED: 'Отменено',
};
