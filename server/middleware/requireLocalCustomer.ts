// server/middleware/requireLocalCustomer.ts
import type { Request, Response, NextFunction } from 'express';
import { evaluateLocality } from '../../shared/locality';
import { db } from '../db';

async function getDefaultAddressZip(userId?: string | null) {
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
      .limit(1);
    
    return result[0]?.postalCode ?? null;
  } catch (error) {
    console.warn('Error fetching default address ZIP for local check:', error);
    return null;
  }
}

export async function requireLocalCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? null;
    const defaultAddressZip = await getDefaultAddressZip(userId);
    const status = evaluateLocality({ defaultAddressZip, zipOverride: null, ipZipFallback: null });

    if (!status.eligible) {
      return res.status(403).json({
        code: 'LOCAL_CUSTOMER_REQUIRED',
        message: 'This action is only available to local customers.',
        resolution: 'Set a default local address in your account or enter a local ZIP.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireLocalCustomer middleware:', error);
    return res.status(500).json({
      code: 'LOCALITY_CHECK_FAILED',
      message: 'Unable to verify locality status.',
      resolution: 'Please try again later.'
    });
  }
}