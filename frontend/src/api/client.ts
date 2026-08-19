import type {
  AdminDashboard,
  AdminLead,
  AdminStudent,
  AppConfig,
  HomeworkItem,
  MatchResult,
  MaterialItem,
  NotificationRecord,
  Portal,
  Program,
  RecommendationDetails,
  Student,
  StudentProgress,
  SubscriptionDetails,
  SubscriptionPlan,
  TrialDetails,
  TrialSlot,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

let initData = '';
let adminToken = '';
let studentId: number | null = null;

if (typeof sessionStorage !== 'undefined') {
  adminToken = sessionStorage.getItem('admin_token') || '';
  const stored = sessionStorage.getItem('active_student_id');
  studentId = stored ? Number(stored) : null;
}

export function setTelegramInitData(value: string): void {
  initData = value;
}

export function setAdminToken(value: string): void {
  adminToken = value;
  if (typeof sessionStorage !== 'undefined') {
    if (value) sessionStorage.setItem('admin_token', value);
    else sessionStorage.removeItem('admin_token');
  }
}

export function getAdminToken(): string {
  return adminToken;
}

export function setActiveStudentId(id: number | null): void {
  studentId = id;
  if (typeof sessionStorage !== 'undefined') {
    if (id) sessionStorage.setItem('active_student_id', String(id));
    else sessionStorage.removeItem('active_student_id');
  }
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (initData) headers.set('x-telegram-init-data', initData);
  if (studentId) headers.set('x-student-id', String(studentId));
  if (adminToken && path.startsWith('/api/admin')) headers.set('x-admin-token', adminToken);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string } | string;
    data?: unknown;
  };
  if (!response.ok) {
    const message =
      typeof payload.error === 'object' && payload.error?.message
        ? payload.error.message
        : typeof payload.error === 'string'
          ? payload.error
          : `Не получилось выполнить запрос (${response.status})`;
    const code = typeof payload.error === 'object' ? payload.error.code : undefined;
    throw new ApiError(message, response.status, code);
  }
  return payload as T;
}

export const api = {
  getConfig: () => request<{ data: AppConfig }>('/api/config'),
  getPortal: () => request<{ data: Portal }>('/api/me/portal'),
  getPrograms: () => request<{ data: Program[] }>('/api/programs'),
  getProgram: (id: number) => request<{ data: Program }>(`/api/programs/${id}`),
  getGroups: (programId: number) => request<{ data: import('../types').GroupDetails[] }>(`/api/programs/${programId}/groups`),
  match: (body: Record<string, unknown>) =>
    request<{ data: MatchResult }>('/api/program-matching', { method: 'POST', body: JSON.stringify(body) }),
  createStudent: (body: { firstName: string; lastName?: string; birthDate: string; notes?: string }) =>
    request<{ data: Student }>('/api/me/students', { method: 'POST', body: JSON.stringify(body) }),
  createLead: (body: { studentId?: number; programId?: number; source?: string }) =>
    request<{ data: { id: number } }>('/api/leads', { method: 'POST', body: JSON.stringify(body) }),
  trialSlots: (query: { programId?: number; groupId?: number }) => {
    const params = new URLSearchParams();
    if (query.programId) params.set('programId', String(query.programId));
    if (query.groupId) params.set('groupId', String(query.groupId));
    return request<{ data: TrialSlot[] }>(`/api/trial-slots?${params}`);
  },
  bookTrial: (body: { leadId: number; studentId: number; groupId: number; startsAt: string }) =>
    request<{ data: TrialDetails }>('/api/trials', { method: 'POST', body: JSON.stringify(body) }),
  getLessons: (id: number) => request<{ data: import('../types').LessonDetails[] }>(`/api/students/${id}/lessons`),
  getSubscriptions: (id: number) => request<{ data: SubscriptionDetails[] }>(`/api/students/${id}/subscriptions`),
  getProgress: (id: number) => request<{ data: StudentProgress }>(`/api/students/${id}/progress`),
  getHomework: (id: number) => request<{ data: HomeworkItem[] }>(`/api/students/${id}/homework`),
  getMaterials: (id: number) => request<{ data: MaterialItem[] }>(`/api/students/${id}/materials`),
  getRecommendations: (id: number) => request<{ data: RecommendationDetails[] }>(`/api/students/${id}/recommendations`),
  getPlans: (programId?: number) =>
    request<{ data: SubscriptionPlan[] }>(
      programId ? `/api/subscription-plans?programId=${programId}` : '/api/subscription-plans',
    ),
  purchase: (body: { studentId: number; planId: number; leadId?: number; recommendationId?: number }) =>
    request<{ data: { subscription: SubscriptionDetails } }>('/api/subscriptions/purchase', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getNotifications: () => request<{ data: NotificationRecord[] }>('/api/me/notifications'),
  adminDashboard: (preview: boolean) =>
    request<{ data: AdminDashboard }>(preview ? '/api/demo-admin/dashboard' : '/api/admin/dashboard'),
  adminLeads: (preview: boolean) =>
    request<{ data: AdminLead[] }>(preview ? '/api/demo-admin/leads' : '/api/admin/leads'),
  adminTrials: (preview: boolean) =>
    request<{ data: TrialDetails[] }>(preview ? '/api/demo-admin/trials' : '/api/admin/trials'),
  adminStudents: (preview: boolean) =>
    request<{ data: AdminStudent[] }>(preview ? '/api/demo-admin/students' : '/api/admin/students'),
  patchLead: (id: number, status: string) =>
    request<{ data: AdminLead }>(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  patchTrial: (id: number, body: Record<string, unknown>) =>
    request<{ data: TrialDetails }>(`/api/admin/trials/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createRecommendation: (id: number, body: Record<string, unknown> = {}) =>
    request<{ data: RecommendationDetails }>(`/api/admin/trials/${id}/recommendation`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
