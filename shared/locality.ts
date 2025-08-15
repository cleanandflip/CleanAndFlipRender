// shared/locality.ts - Single Source of Truth for Locality
export const SSOT_VERSION = "v2024.1";

export type LocalitySource = 'address' | 'zip' | 'ip' | 'default';
export type LocalityStatus = 'LOCAL' | 'OUT_OF_AREA' | 'UNKNOWN';
export type UserMode = 'LOCAL_AND_SHIPPING' | 'LOCAL_ONLY' | 'SHIPPING_ONLY' | 'NONE';

// New comprehensive LocalityResult type for SSOT
export interface LocalityResult {
  status: LocalityStatus;
  source: LocalitySource;
  eligible: boolean;
  zip?: string;
  lat?: number;
  lon?: number;
  distanceMiles?: number;
  effectiveModeForUser: UserMode;
  reasons: string[];
  ssotVersion: string;
  asOfISO: string;
}

// Legacy types for backward compatibility during transition
export type LocalitySourceLegacy = 'DEFAULT_ADDRESS' | 'ZIP_OVERRIDE' | 'IP' | 'NONE';
export type LocalityReason =
  | 'IN_LOCAL_AREA'
  | 'NO_DEFAULT_ADDRESS'
  | 'ZIP_NOT_LOCAL'
  | 'FALLBACK_NON_LOCAL';

// Legacy LocalityStatus for backward compatibility
export type LocalityStatusLegacy = {
  eligible: boolean;
  source: LocalitySourceLegacy;
  reason: LocalityReason;
  zipUsed?: string | null;
  city?: string | null;
  state?: string | null;
  zip: string;                 // Normalized ZIP for UI consistency
  user?: string | null;        // User ID if authenticated
};

// Default locality state to prevent null/undefined crashes
export const DEFAULT_LOCALITY: LocalityStatusLegacy = {
  eligible: false,
  source: 'NONE',
  reason: 'FALLBACK_NON_LOCAL',
  zipUsed: null,
  city: null,
  state: null,
  zip: 'none',
  user: null,
};

// SSOT constants for ZIP validation (Asheville, NC area)
export const LOCAL_ZIPS = new Set(['28801','28803','28804','28805','28806','28808']);

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
}: EvaluateArgs): LocalityStatusLegacy {
  // 1) Default address
  if (defaultAddressZip) {
    const ok = isLocalZip(defaultAddressZip);
    const zip = normalizeZip(defaultAddressZip) || 'none';
    return {
      eligible: ok,
      source: 'DEFAULT_ADDRESS',
      reason: ok ? 'IN_LOCAL_AREA' : 'ZIP_NOT_LOCAL',
      zipUsed: normalizeZip(defaultAddressZip),
      zip,
      city: null,
      state: null,
      user: null
    };
  }

  // 2) Explicit override
  if (zipOverride) {
    const ok = isLocalZip(zipOverride);
    const zip = normalizeZip(zipOverride) || 'none';
    return {
      eligible: ok,
      source: 'ZIP_OVERRIDE',
      reason: ok ? 'IN_LOCAL_AREA' : 'ZIP_NOT_LOCAL',
      zipUsed: normalizeZip(zipOverride),
      zip,
      city: null,
      state: null,
      user: null
    };
  }

  // 3) IP fallback (safe non-local if absent)
  const ok = isLocalZip(ipZipFallback);
  const zip = normalizeZip(ipZipFallback) || 'none';
  return {
    eligible: ok,
    source: ipZipFallback ? 'IP' : 'NONE',
    reason: ok ? 'IN_LOCAL_AREA' : 'FALLBACK_NON_LOCAL',
    zipUsed: normalizeZip(ipZipFallback),
    zip,
    city: null,
    state: null,
    user: null
  };
}