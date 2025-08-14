// shared/locality.ts - Single Source of Truth for Locality
export type LocalitySource = 'DEFAULT_ADDRESS' | 'ZIP_OVERRIDE' | 'IP' | 'NONE';
export type LocalityReason =
  | 'IN_LOCAL_AREA'
  | 'NO_DEFAULT_ADDRESS'
  | 'ZIP_NOT_LOCAL'
  | 'FALLBACK_NON_LOCAL';

export type LocalityStatus = {
  eligible: boolean;
  source: LocalitySource;
  reason: LocalityReason;
  zipUsed?: string | null;
  city?: string | null;
  state?: string | null;
};

const LOCAL_ZIPS = new Set(['28801','28803','28804','28805','28806','28808']);

export function normalizeZip(input?: string | null) {
  if (!input) return null;
  const match = String(input).match(/\d{5}/);
  return match ? match[0] : null;
}

export function isLocalZip(zip?: string | null) {
  const z = normalizeZip(zip);
  return !!(z && LOCAL_ZIPS.has(z));
}

type EvaluateArgs = {
  defaultAddressZip?: string | null; // from user default address
  zipOverride?: string | null;       // from ?zip= or UI checker
  ipZipFallback?: string | null;     // optional geolocate
};

export function evaluateLocality({
  defaultAddressZip,
  zipOverride,
  ipZipFallback
}: EvaluateArgs): LocalityStatus {
  // 1) Default address
  if (defaultAddressZip) {
    const ok = isLocalZip(defaultAddressZip);
    return {
      eligible: ok,
      source: 'DEFAULT_ADDRESS',
      reason: ok ? 'IN_LOCAL_AREA' : 'ZIP_NOT_LOCAL',
      zipUsed: normalizeZip(defaultAddressZip)
    };
  }

  // 2) Explicit override
  if (zipOverride) {
    const ok = isLocalZip(zipOverride);
    return {
      eligible: ok,
      source: 'ZIP_OVERRIDE',
      reason: ok ? 'IN_LOCAL_AREA' : 'ZIP_NOT_LOCAL',
      zipUsed: normalizeZip(zipOverride)
    };
  }

  // 3) IP fallback (safe non-local if absent)
  const ok = isLocalZip(ipZipFallback);
  return {
    eligible: ok,
    source: ipZipFallback ? 'IP' : 'NONE',
    reason: ok ? 'IN_LOCAL_AREA' : 'FALLBACK_NON_LOCAL',
    zipUsed: normalizeZip(ipZipFallback)
  };
}