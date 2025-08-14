// Safe JSON parsing for API responses
export async function parseJsonSafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  return { ok: false, message: text || res.statusText };
}