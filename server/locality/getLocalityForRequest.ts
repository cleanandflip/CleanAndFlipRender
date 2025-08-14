// Single source of truth for request-based locality evaluation
// Used by both /api/locality/status and cart enforcement

import { evaluateLocality } from '../../shared/locality';
import { db } from '../db';
import { getUserIdFromReq } from '../utils/auth';

async function getDefaultZip(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  
  try {
    // Use Drizzle ORM for consistent queries
    const { addresses } = await import('@shared/schema');
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
    console.warn('Error fetching default ZIP:', error);
    return null;
  }
}

export async function getLocalityForRequest(req: any, zipOverride?: string | null) {
  const userId = getUserIdFromReq(req);
  const defaultZip = await getDefaultZip(userId);
  
  return evaluateLocality({
    defaultAddressZip: defaultZip,
    zipOverride: zipOverride ?? null,
    ipZipFallback: null
  });
}