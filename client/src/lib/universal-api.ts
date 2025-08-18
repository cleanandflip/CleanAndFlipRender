export function apiUrl(path: string) {
  const base = (import.meta as any).env?.VITE_API_BASE_URL?.trim() || "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base.replace(/\/$/, "")}${p}` : p;
}

// Usage example:
// const res = await fetch(apiUrl("/api/user"), { credentials: "include" });