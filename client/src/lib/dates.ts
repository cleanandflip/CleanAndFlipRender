// src/lib/dates.ts
export function toDateSafe(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);        // epoch ms
  if (typeof v === "string" && v) {
    const d = new Date(v);                              // ISO or parseable
    return isNaN(+d) ? null : d;
  }
  return null;
}

export function fmtDateTime(d: Date | null): string {
  return d ? d.toLocaleString() : "—";
}

export function fmtDate(d: Date | null): string {
  return d ? d.toLocaleDateString() : "—";
}

export function fmtTime(d: Date | null): string {
  return d ? d.toLocaleTimeString() : "—";
}