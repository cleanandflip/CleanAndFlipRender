// Profile completion validation
import { db } from '../db';
import { addresses } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export async function isProfileComplete(userId: string): Promise<boolean> {
  const addressCount = await db.select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .then(results => results.length);
    
  const hasDefault = await db.select({ id: addresses.id })
    .from(addresses)
    .where(and(
      eq(addresses.userId, userId),
      eq(addresses.isDefault, true)
    ))
    .then(results => results.length > 0);
    
  return addressCount > 0 && hasDefault;
}