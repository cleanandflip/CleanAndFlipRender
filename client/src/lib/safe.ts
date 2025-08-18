// Null-safe helpers for lists & counts
export function asArray<T>(v: T[] | ReadonlyArray<T> | null | undefined): T[] {
  return Array.isArray(v) ? [...v] : [];
}

export function count(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

export const isNonEmptyArray = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.length > 0;