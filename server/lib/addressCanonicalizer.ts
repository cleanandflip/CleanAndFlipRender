/**
 * Address Canonicalizer - Single source of truth for address normalization
 * Creates deterministic canonical representation for deduplication
 */

export function canonicalizeAddress(a: {
  street?: string; 
  city?: string; 
  state?: string; 
  postal_code?: string; 
  country?: string;
}) {
  const clean = (s?: string) =>
    (s ?? '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N} ]/gu, ' ')  // remove punctuation
      .replace(/\s+/g, ' ')              // collapse whitespace
      .trim();

  const line = [
    clean(a.street),
    clean(a.city),
    clean(a.state),
    clean(a.postal_code),
    clean(a.country || 'us'),
  ].filter(Boolean).join('|');

  return line;
}