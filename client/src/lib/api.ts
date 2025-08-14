// Unified API client with mandatory cookie authentication
// CRITICAL: This fixes the 403 cart errors by ensuring credentials are sent

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    credentials: 'include',              // <-- CRITICAL: Always send cookies
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const e = new Error(errBody.message || `HTTP ${res.status}`);
    (e as any).status = res.status;
    (e as any).body = errBody;
    throw e;
  }
  
  return res;
}

export async function apiJson<T>(path: string, init: RequestInit = {}) {
  const res = await apiFetch(path, init);
  return res.json() as Promise<T>;
}