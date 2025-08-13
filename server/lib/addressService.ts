import { db } from '../db';
import { addresses, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * SSOT Address Service - Manages address operations with database integrity
 */
export class AddressService {
  /**
   * Sets an address as the default for a user
   * Ensures only one default per user with atomic transaction
   */
  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // First, clear any existing default for this user
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
      
      // Set the new default address
      await tx
        .update(addresses)
        .set({ isDefault: true })
        .where(and(
          eq(addresses.id, addressId),
          eq(addresses.userId, userId)
        ));
      
      // Update the user's profile address reference
      await tx
        .update(users)
        .set({ profileAddressId: addressId })
        .where(eq(users.id, userId));
    });
  }

  /**
   * Gets the user's default address with validation
   */
  static async getDefaultAddress(userId: string) {
    const result = await db.execute(sql`
      SELECT a.* 
      FROM addresses a
      WHERE a.user_id = ${userId} 
        AND a.is_default = true
      LIMIT 1
    `);
    
    return result.rows[0] || null;
  }

  /**
   * Creates a new address and optionally sets it as default
   */
  static async createAddress(addressData: any, userId: string, setAsDefault: boolean = false) {
    const result = await db.transaction(async (tx) => {
      // If this should be the default, clear existing defaults first
      if (setAsDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }

      // Create the new address
      const [newAddress] = await tx
        .insert(addresses)
        .values({
          ...addressData,
          userId,
          isDefault: setAsDefault,
        })
        .returning();

      // If set as default, update user profile reference
      if (setAsDefault) {
        await tx
          .update(users)
          .set({ profileAddressId: newAddress.id })
          .where(eq(users.id, userId));
      }

      return newAddress;
    });

    return result;
  }
}