// src/api/observability.ts
export interface Issue {
  fingerprint: string;
  title: string;
  level: "error" | "warn" | "info";
  firstSeen: string;
  lastSeen: string;
  count: number;
  resolved: boolean;
  ignored: boolean;
  envs?: Record<string, number>;
  service?: string;
}

export interface ErrorEvent {
  eventId: string;
  createdAt: string;
  message: string;
  level: "error" | "warn" | "info";
  env: "production" | "development";
  service: "client" | "server";
  url?: string;
  stack?: string[];
  extra?: any;
}

function ok(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const obsApi = {
  issues: async (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)]) as any
    );
    return fetch(`/api/observability/issues?${qs}`, { credentials: "include" }).then(ok);
  },

  issue: async (fp: string) =>
    fetch(`/api/observability/issues/${fp}`, { credentials: "include" }).then(ok),

  events: async (fp: string, limit = 50) =>
    fetch(`/api/observability/issues/${fp}/events?limit=${limit}`, {
      credentials: "include",
    }).then(ok),

  resolve: async (fp: string) =>
    fetch(`/api/observability/issues/${fp}/resolve`, { method: "PUT", credentials: "include" }).then(ok),

  reopen: async (fp: string) =>
    fetch(`/api/observability/issues/${fp}/reopen`, { method: "PUT", credentials: "include" }).then(ok),

  ignore: async (fp: string) =>
    fetch(`/api/observability/issues/${fp}/ignore`, { method: "PUT", credentials: "include" }).then(ok),

  unignore: async (fp: string) =>
    fetch(`/api/observability/issues/${fp}/unignore`, { method: "PUT", credentials: "include" }).then(ok),

  series: async (days = 1) =>
    fetch(`/api/observability/series?days=${days}`, { credentials: "include" }).then(ok),

  ingest: async (payload: {
    service?: "client" | "server";
    level?: "error" | "warn" | "info";
    env?: "production" | "development";
    message: string;
    stack?: string;
    extra?: any;
  }) =>
    fetch(`/api/observability/errors`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(ok),
};