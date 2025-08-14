// server/locality/locality.controller.ts
import type { Request, Response } from 'express';
import { evaluateLocality } from '../../shared/locality';
import { db } from '../db';

async function getDefaultAddressZip(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  try {
    // Use Drizzle ORM instead of raw query
    const { addresses } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const result = await db
      .select({ postalCode: addresses.postalCode })
      .from(addresses)
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.isDefault, true)
      ))
      .orderBy(addresses.updatedAt)
      .limit(1);
    
    return result[0]?.postalCode ?? null;
  } catch (error) {
    console.warn('Error fetching default address ZIP:', error);
    return null;
  }
}

export async function getLocalityStatus(req: Request, res: Response) {
  try {
    const zipOverride = (req.query.zip as string | undefined) ?? null;
    const userId = (req as any).user?.id ?? null;

    const defaultAddressZip = await getDefaultAddressZip(userId);

    // Optional IP-derived zip if you have it (otherwise null):
    const ipZipFallback = null;

    const status = evaluateLocality({ defaultAddressZip, zipOverride, ipZipFallback });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LOCALITY] Server: eligible=${status.eligible} source=${status.source} zip=${status.zipUsed || 'none'}`);
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error getting locality status:', error);
    res.status(500).json({
      eligible: false,
      source: 'NONE',
      reason: 'FALLBACK_NON_LOCAL',
      zipUsed: null
    });
  }
}