// API client for local Sentry-style error tracking (LETS)

export interface IssueFilters {
  q?: string;
  level?: string;
  env?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
}

export interface Issue {
  id: number;
  fingerprint: string;
  title: string;
  firstSeen: string;
  lastSeen: string;
  level: string;
  count: number;
  affectedUsers: number;
  resolved: boolean;
  ignored: boolean;
  sampleEventId?: string;
  envs: Record<string, number>;
}

export interface ErrorEvent {
  id: number;
  eventId: string;
  createdAt: string;
  level: string;
  env: string;
  service: string;
  url?: string;
  method?: string;
  statusCode?: number;
  message: string;
  type?: string;
  stack?: string[];
  userId?: string;
  tags?: Record<string, any>;
  extra?: Record<string, any>;
}

export const obsApi = {
  issues: async (params: IssueFilters = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as any
    );
    const response = await fetch(`/api/observability/issues?${qs}`, { 
      credentials: "include" 
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<{
      items: Issue[];
      total: number;
      page: number;
      limit: number;
    }>;
  },

  issue: async (fingerprint: string) => {
    const response = await fetch(`/api/observability/issues/${fingerprint}`, { 
      credentials: "include" 
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<Issue>;
  },

  events: async (fingerprint: string, limit = 50) => {
    const response = await fetch(
      `/api/observability/issues/${fingerprint}/events?limit=${limit}`, 
      { credentials: "include" }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<ErrorEvent[]>;
  },

  resolve: async (fingerprint: string) => {
    const response = await fetch(
      `/api/observability/issues/${fingerprint}/resolve`, 
      { method: "PUT", credentials: "include" }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  reopen: async (fingerprint: string) => {
    const response = await fetch(
      `/api/observability/issues/${fingerprint}/reopen`, 
      { method: "PUT", credentials: "include" }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  ignore: async (fingerprint: string) => {
    const response = await fetch(
      `/api/observability/issues/${fingerprint}/ignore`, 
      { method: "PUT", credentials: "include" }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  series: async (days = 1) => {
    const response = await fetch(
      `/api/observability/series?days=${days}`, 
      { credentials: "include" }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<Array<{ hour: string; count: number }>>;
  },
};