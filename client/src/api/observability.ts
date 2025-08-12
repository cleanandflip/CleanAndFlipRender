export const obsApi = {
  issues: async (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined) as any);
    const r = await fetch(`/api/observability/issues?${qs}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  issue: async (fp: string) => {
    const r = await fetch(`/api/observability/issues/${fp}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  events: async (fp: string, limit = 50) => {
    const r = await fetch(`/api/observability/issues/${fp}/events?limit=${limit}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  resolve: async (fp: string) => {
    const r = await fetch(`/api/observability/issues/${fp}/resolve`, { method: "PUT", credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  reopen: async (fp: string) => {
    const r = await fetch(`/api/observability/issues/${fp}/reopen`, { method: "PUT", credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  ignore: async (fp: string) => {
    const r = await fetch(`/api/observability/issues/${fp}/ignore`, { method: "PUT", credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  unignore: async (fp: string) => {
    const r = await fetch(`/api/observability/issues/${fp}/unignore`, { method: "PUT", credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  
  series: async (days = 1) => {
    const r = await fetch(`/api/observability/series?days=${days}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};