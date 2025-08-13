/**
 * Address Repository - Single source of truth for address operations
 * Handles canonicalization, deduplication, and local customer detection
 */

import { db } from '../db';
import { addresses, users } from '../../shared/schema';
import type { Address, InsertAddress } from '../../shared/schema';
import { canonicalizeAddress } from '../lib/addressCanonicalizer';
import { fingerprintOf } from '../lib/fingerprint';
import { isLocal } from '../services/localService';
import { eq, and, sql } from 'drizzle-orm';

export interface UpsertAddressParams {
  userId?: string;
  geoapifyPlaceId?: string | null;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  setDefault?: boolean;
}

export class AddressRepository {
  /**
   * Upsert address with deduplication and canonicalization
   * Returns existing address if duplicate is found, otherwise creates new one
   */
  async upsertAddress(params: UpsertAddressParams): Promise<Address> {
    const canonical = canonicalizeAddress({
      street: params.street,
      city: params.city,
      state: params.state,
      postal_code: params.postalCode,
      country: params.country
    });
    
    const fingerprint = fingerprintOf(canonical);
    const formatted = this.formatAddress(params);

    // Try to find existing address by fingerprint first
    if (params.userId) {
      const existingAddress = await db
        .select()
        .from(addresses)
        .where(and(
          eq(addresses.userId, params.userId),
          eq(addresses.fingerprint, fingerprint)
        ))
        .limit(1);

      if (existingAddress.length > 0) {
        const existing = existingAddress[0];
        
        // Update coordinates if provided and missing
        if (params.latitude && params.longitude && (!existing.latitude || !existing.longitude)) {
          const [updated] = await db
            .update(addresses)
            .set({
              latitude: params.latitude.toString(),
              longitude: params.longitude.toString(),
              geoapifyPlaceId: params.geoapifyPlaceId,
              updatedAt: new Date()
            })
            .where(eq(addresses.id, existing.id))
            .returning();
          
          // Update user's local status if this becomes default
          if (params.setDefault) {
            await this.setDefaultAddress(params.userId, updated.id);
          }
          
          return updated;
        }
        
        // Set as default if requested
        if (params.setDefault) {
          await this.setDefaultAddress(params.userId, existing.id);
        }
        
        return existing as Address;
      }
    }

    // Create new address
    const addressData: Omit<InsertAddress, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: params.userId || null,
      label: params.label || null,
      formatted,
      street: params.street || null,
      city: params.city || null,
      state: params.state || null,
      postalCode: params.postalCode || null,
      country: params.country || 'US',
      latitude: params.latitude ? params.latitude.toString() : null,
      longitude: params.longitude ? params.longitude.toString() : null,
      geoapifyPlaceId: params.geoapifyPlaceId || null,
      canonicalLine: canonical,
      fingerprint,
      isDefault: params.setDefault || false
    };

    const [newAddress] = await db
      .insert(addresses)
      .values(addressData)
      .returning();

    // Set as default and update user's local status
    if (params.setDefault && params.userId) {
      await this.setDefaultAddress(params.userId, newAddress.id);
    }

    return newAddress;
  }

  /**
   * Set an address as the default for a user
   * Also updates the user's local customer status
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Unset all other defaults for this user
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));

    // Set the specified address as default
    await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(addresses.id, addressId));

    // Get the address to check if it's local
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, addressId))
      .limit(1);

    if (address) {
      // Update user's local customer status
      const localStatus = await isLocal(address);
      await db
        .update(users)
        .set({ 
          isLocalCustomer: localStatus,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(sql`${addresses.isDefault} DESC, ${addresses.createdAt} DESC`);
  }

  /**
   * Get the default address for a user
   */
  async getDefaultAddress(userId: string): Promise<Address | null> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.isDefault, true)
      ))
      .limit(1);

    return address || null;
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, addressId));
  }

  /**
   * Format address into a single line
   */
  private formatAddress(params: UpsertAddressParams): string {
    const parts = [
      params.street,
      params.city,
      params.state,
      params.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

export const addressRepo = new AddressRepository();