import { Platform } from 'react-native';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type AccessTokenProvider = (() => Promise<string | null> | string | null) | null;

let accessTokenProvider: AccessTokenProvider = null;

export class UnauthorizedError extends Error {
  status = 401;
}

export function setApiAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;
}

export type ApiTask = {
  id: string;
  title: string;
  position?: number;
  completed?: boolean;
  status?: 'todo' | 'in_progress' | 'done' | 'archived' | string;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  dueDateOnly?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  goal?: {
    id: string;
    title: string;
  } | null;
  goal_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  start_at?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

export type ApiGoal = {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'archived' | string;
  created_at?: string;
  position?: number;
  metric_text?: string | null;
  metric_frequency?: string | null;
};

export type ApiChatMessage = {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system' | string;
  created_at?: string;
  timestamp?: string;
};

export type ApiGoalHistoryDay = {
  date: string;
  status: string;
  completedTasks: number;
  tasksDue: number;
  tasksDone: number;
};

export type ApiGoalHistory = {
  timezone: string;
  today: string;
  windowStart: string;
  windowEnd: string;
  days: ApiGoalHistoryDay[];
  createdAt?: string;
  createdDay?: string;
  completedTasksLast30Days?: number;
};

export type TaskListView = 'all' | 'active' | 'completed';

function getApiBaseUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return `http://localhost:${process.env.EXPO_PUBLIC_ZENDO_API_PROXY_PORT ?? '8787'}`;
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname.endsWith('zendo.cc')) {
    return '';
  }

  return 'https://zendo.cc';
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  const accessToken = accessTokenProvider ? await accessTokenProvider() : null;

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const hasJson = contentType.includes('application/json');
  const payload = hasJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `Request failed with status ${response.status}`;

    if (response.status === 401) {
      throw new UnauthorizedError(message);
    }

    throw new Error(message);
  }

  return payload as T;
}

async function fetchTaskList(path: string) {
  const response = await apiRequest<{ tasks: ApiTask[] }>(path);
  return response.tasks ?? [];
}

export async function fetchTasks(view: TaskListView = 'all') {
  return fetchTaskList(`/api/app/tasks?format=mobile&view=${view}&includeGoal=1`);
}

export async function fetchActiveTasks() {
  return fetchTaskList('/api/app/tasks?format=mobile&view=active&includeGoal=1');
}

export async function fetchCompletedTasks() {
  return fetchTaskList('/api/app/tasks?format=mobile&view=completed&includeGoal=1');
}

export async function fetchArchivedTasks() {
  return fetchTaskList('/api/app/tasks?archived=1');
}

export async function reorderTasks(activeTaskIds: string[]) {
  return apiRequest<{ ok: true; reordered?: number }>('/api/app/tasks', {
    method: 'PATCH',
    body: {
      reorder: {
        activeTaskIds,
      },
    },
  });
}

export async function createTask(input: {
  title: string;
  goalId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  position?: number;
}) {
  const response = await apiRequest<{ task: ApiTask }>('/api/app/tasks', {
    method: 'POST',
    body: input,
  });

  return response.task;
}

export async function updateTask(taskId: string, input: Record<string, unknown>) {
  const response = await apiRequest<{ task: ApiTask }>('/api/app/tasks', {
    method: 'PATCH',
    body: {
      taskId,
      ...input,
    },
  });

  return response.task;
}

export async function deleteTask(taskId: string) {
  await apiRequest<{ ok: true }>('/api/app/tasks', {
    method: 'DELETE',
    body: { taskId },
  });
}

export async function fetchGoals() {
  const response = await apiRequest<{ goals: ApiGoal[] }>('/api/app/goals');
  return response.goals ?? [];
}

export async function createGoal(title: string) {
  const response = await apiRequest<{ goal: ApiGoal }>('/api/app/goals', {
    method: 'POST',
    body: { title },
  });

  return response.goal;
}

export async function updateGoal(goalId: string, input: Record<string, unknown>) {
  const response = await apiRequest<{ goal: ApiGoal }>('/api/app/goals', {
    method: 'PATCH',
    body: {
      goalId,
      ...input,
    },
  });

  return response.goal;
}

export async function fetchChatMessages() {
  const response = await apiRequest<{ messages: ApiChatMessage[] }>('/api/app/chat/messages');
  return response.messages ?? [];
}

export async function sendChatMessage(content: string) {
  const response = await apiRequest<{ message?: ApiChatMessage; messages?: ApiChatMessage[] }>('/api/app/chat/messages', {
    method: 'POST',
    body: {
      content,
      sender: 'user',
      generateAi: true,
    },
  });

  if (response.messages) {
    return response.messages;
  }

  return response.message ? [response.message] : [];
}

export async function fetchGoalHistory(goalId: string) {
  return apiRequest<ApiGoalHistory>(`/api/app/goals/history?goalId=${encodeURIComponent(goalId)}`);
}

export async function registerAuthSource() {
  return apiRequest<{ ok: true; source?: string }>('/api/app/auth/source', {
    method: 'POST',
  });
}