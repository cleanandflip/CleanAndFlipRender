// server/services/localityService.ts - SSOT for locality evaluation
// Merges logic from server/lib/localityChecker.ts and server/locality/getLocalityForRequest.ts

import { Request } from 'express';
import { LocalityResult, LocalityStatus, UserMode, SSOT_VERSION, normalizeZip, isLocalZip } from '../../shared/locality';
import { calculateDistanceMiles, DEFAULT_HQ, DEFAULT_RADIUS_MILES } from '../../shared/geo';
import { db } from '../db';

/**
 * Get default ZIP from user's primary address
 */
async function getDefaultZip(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  
  try {
    const { addresses } = await import('../../shared/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const result = await db
      .select({ postalCode: addresses.postalCode })
      .from(addresses)
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.isDefault, true)
      ))
      .limit(1);
    
    return result[0]?.postalCode ?? null;
  } catch (error) {
    console.warn('[LOCALITY] Error fetching default ZIP:', error);
    return null;
  }
}

/**
 * Get coordinates from address canonicalizer if available
 */
async function getCoordinatesFromZip(zip: string): Promise<{ lat?: number; lon?: number; distanceMiles?: number }> {
  try {
    // Check if address canonicalizer exists and can geocode
    const canonicalizer = await import('../lib/addressCanonicalizer').catch(() => null);
    if (!canonicalizer) return {};
    
    // This would need to be implemented based on your address canonicalizer
    // For now, return empty to avoid breaking the build
    return {};
  } catch (error) {
    console.warn('[LOCALITY] Error geocoding ZIP:', error);
    return {};
  }
}

/**
 * Determine user mode based on locality status
 */
function determineUserMode(status: LocalityStatus, eligible: boolean): UserMode {
  if (!eligible) return 'NONE';
  
  switch (status) {
    case 'LOCAL':
      return 'LOCAL_AND_SHIPPING'; // Local users can do both
    case 'OUT_OF_AREA':
      return 'SHIPPING_ONLY';      // Remote users can only receive shipping
    case 'UNKNOWN':
    default:
      return 'NONE';               // Unknown status = blocked
  }
}

/**
 * Generate human-readable reasons for locality status
 */
function generateReasons(status: LocalityStatus, source: string, zip?: string): string[] {
  const reasons: string[] = [];
  
  switch (status) {
    case 'LOCAL':
      reasons.push(`ZIP ${zip} is in our local delivery area`);
      if (source === 'address') reasons.push('Based on your default address');
      if (source === 'zip') reasons.push('Based on ZIP code check');
      break;
      
    case 'OUT_OF_AREA':
      reasons.push(`ZIP ${zip || 'unknown'} is outside our local delivery area`);
      reasons.push('Shipping-only items available');
      break;
      
    case 'UNKNOWN':
    default:
      reasons.push('Unable to determine delivery area');
      if (source === 'default') reasons.push('No address or ZIP code provided');
      break;
  }
  
  return reasons;
}

/**
 * SSOT function for evaluating locality from any request
 * Returns comprehensive LocalityResult with all required fields
 */
export async function getLocalityForRequest(req: Request, zipOverride?: string): Promise<LocalityResult> {
  // Use standard authentication patterns from the codebase
  const userId = req.user?.id || req.session?.passport?.user || req.session?.userId || null;
  const asOfISO = new Date().toISOString();
  
  try {
    // 1. Gather all available ZIP sources
    const defaultZip = await getDefaultZip(userId);
    const overrideZip = zipOverride || req.query.zip as string;
    
    // 2. Determine primary ZIP to evaluate (priority order)
    let primaryZip: string | null = null;
    let source: LocalityResult['source'] = 'default';
    
    if (overrideZip) {
      primaryZip = normalizeZip(overrideZip);
      source = 'zip';
    } else if (defaultZip) {
      primaryZip = normalizeZip(defaultZip);
      source = 'address';
    } else {
      // Could add IP-based fallback here if needed
      source = 'default';
    }
    
    // 3. Evaluate locality status
    let status: LocalityStatus;
    let eligible: boolean;
    
    if (primaryZip && isLocalZip(primaryZip)) {
      status = 'LOCAL';
      eligible = true;
    } else if (primaryZip) {
      status = 'OUT_OF_AREA';
      eligible = false;
    } else {
      status = 'UNKNOWN';
      eligible = false;
    }
    
    // 4. Get coordinates and distance if available
    const geoData = primaryZip ? await getCoordinatesFromZip(primaryZip) : {};
    
    // 5. Determine effective user mode
    const effectiveModeForUser = determineUserMode(status, eligible);
    
    // 6. Generate human-readable reasons
    const reasons = generateReasons(status, source, primaryZip || undefined);
    
    // 7. Build comprehensive result
    const result: LocalityResult = {
      status,
      source,
      eligible,
      zip: primaryZip || undefined,
      lat: geoData.lat,
      lon: geoData.lon,
      distanceMiles: geoData.distanceMiles,
      effectiveModeForUser,
      reasons,
      ssotVersion: SSOT_VERSION,
      asOfISO
    };
    
    // 8. Log for observability
    console.log(`[LOCALITY] SSOT evaluation: ${JSON.stringify({
      userId: userId || 'guest',
      status,
      source,
      eligible,
      zip: primaryZip,
      effectiveModeForUser
    })}`);
    
    return result;
    
  } catch (error) {
    console.error('[LOCALITY] Error in getLocalityForRequest:', error);
    
    // Fail-safe fallback
    return {
      status: 'UNKNOWN',
      source: 'default',
      eligible: false,
      effectiveModeForUser: 'NONE',
      reasons: ['System error determining locality'],
      ssotVersion: SSOT_VERSION,
      asOfISO
    };
  }
}

/**
 * Helper to get cart owner ID consistently
 */
export function getCartOwnerId(req: Request): string {
  // Prefer userId; else stable anonymous sessionId
  return req.session?.user?.id || req.session?.id || 'anonymous';
}