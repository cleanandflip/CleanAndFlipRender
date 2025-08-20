// Unified API client with mandatory cookie authentication
// CRITICAL: This fixes the 403 cart errors by ensuring credentials are sent
import { apiUrl } from "./universal-api";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const fullUrl = apiUrl(path);
  console.log('🔧 API Request:', { method: init.method || 'GET', url: fullUrl, hasBody: !!init.body });
  
  const res = await fetch(fullUrl, {
    credentials: 'include',              // <-- CRITICAL: Always send cookies
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  
  console.log('🔧 API Response:', { status: res.status, contentType: res.headers.get('content-type') });
  
  if (!res.ok) {
    const text = await res.text();
    console.error('🔧 API Error Response:', text);
    let errBody: { message?: string } = {};
    try {
      errBody = JSON.parse(text) as { message?: string };
    } catch {
      errBody = { message: text };
    }
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