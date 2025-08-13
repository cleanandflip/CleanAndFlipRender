/**
 * NEW ONBOARDING API ROUTES - Built on SSOT Address System
 * Replaces all legacy onboarding endpoints
 */

import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';
// Import will be handled through direct DB operations

const router = express.Router();

// Onboarding completion schema
const CompleteOnboardingSchema = z.object({
  address: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(2),
    postalCode: z.string().min(5),
    country: z.string().default('US'),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }),
  phone: z.string().min(1)
});

/**
 * POST /api/onboarding/complete
 * Complete user onboarding with address and phone
 */
router.post('/complete', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const validation = CompleteOnboardingSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        issues: validation.error.flatten().fieldErrors
      });
    }

    const { address, phone } = validation.data;

    // Step 1: Create address using SSOT system
    const addressData = {
      ...address,
      setDefault: true
    };

    // Create address using SSOT schema directly  
    const addressResult = await db.execute(sql`
      INSERT INTO addresses (
        user_id, first_name, last_name, street1, street2, city, state,
        postal_code, country, latitude, longitude, is_default, is_local, created_at, updated_at
      ) VALUES (
        ${userId}, ${address.firstName}, ${address.lastName},
        ${address.street1}, ${address.street2 || null}, ${address.city},
        ${address.state}, ${address.postalCode}, ${address.country},
        ${address.latitude || null}, ${address.longitude || null},
        true, false, NOW(), NOW()
      ) RETURNING id, is_local
    `);
    
    const createdAddress = {
      id: addressResult.rows[0]?.id,
      isLocal: false // TODO: Calculate based on coordinates
    };
    
    // Step 2: Update user with phone and completion status
    await db.execute(sql`
      UPDATE users 
      SET 
        phone = ${phone},
        profile_complete = true,
        onboarding_step = 4,
        profile_address_id = ${createdAddress.id},
        is_local_customer = ${createdAddress.isLocal || false},
        onboarding_completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId}
    `);

    Logger.info(`[ONBOARDING] User ${userId} completed onboarding`, {
      userId,
      isLocal: createdAddress.isLocal,
      addressId: createdAddress.id
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      isLocalCustomer: createdAddress.isLocal || false,
      addressId: createdAddress.id
    });

  } catch (error: any) {
    Logger.error('[ONBOARDING] Error completing onboarding:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to complete onboarding'
    });
  }
});

/**
 * GET /api/onboarding/status
 * Get current onboarding status for user
 */
router.get('/status', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const userStatus = await db.execute(sql`
      SELECT 
        profile_complete,
        onboarding_step,
        phone,
        profile_address_id,
        onboarding_completed_at
      FROM users 
      WHERE id = ${userId}
    `);

    if (!userStatus.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userStatus.rows[0];
    
    res.json({
      profileComplete: Boolean(user.profile_complete),
      onboardingStep: user.onboarding_step || 1,
      hasAddress: Boolean(user.profile_address_id),
      hasPhone: Boolean(user.phone),
      completedAt: user.onboarding_completed_at
    });

  } catch (error: any) {
    Logger.error('[ONBOARDING] Error getting status:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get onboarding status'
    });
  }
});

export default router;