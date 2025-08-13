/**
 * Onboarding completion endpoints
 * Handles setting default addresses and marking users as onboarded
 */

import express from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const isAuthenticated = authMiddleware.requireAuth;
import { storage } from '../storage';
import { getOnboardingStatus } from '../lib/userOnboarding';
import { Logger } from '../utils/logger';

const router = express.Router();

// Complete onboarding by setting default address
const completeOnboardingSchema = z.object({
  addressId: z.string().min(1, "Address ID is required")
});

router.post('/complete', isAuthenticated, async (req, res) => {
  try {
    const { addressId } = completeOnboardingSchema.parse(req.body);
    const userId = (req.user as any).id;

    Logger.debug(`[ONBOARDING] Completing onboarding for user ${userId} with address ${addressId}`);

    // Update user's default address
    const updatedUser = await storage.updateUserProfileAddress(userId, addressId);

    // Update additional onboarding fields
    await storage.updateUser(userId, {
      profileComplete: true,
      onboardingStep: 3,
      onboardingCompletedAt: new Date()
    });

    // Refresh session with updated user data
    const userWithAddress = await storage.getUserById(userId);
    
    req.login(userWithAddress, (err) => {
      if (err) {
        Logger.error('[ONBOARDING] Session refresh error:', err);
        return res.status(500).json({ 
          error: 'Session refresh failed',
          message: 'Onboarding completed but session could not be updated' 
        });
      }

      Logger.info(`[ONBOARDING] Successfully completed onboarding for user ${userId}`);
      res.json({ 
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          id: userWithAddress.id,
          onboarded: true,
          profileAddressId: addressId
        }
      });
    });

  } catch (error: any) {
    Logger.error('[ONBOARDING] Complete onboarding error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Failed to complete onboarding',
      message: 'An error occurred while completing your profile setup'
    });
  }
});

// Get current onboarding status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const status = getOnboardingStatus(user);

    // Include profile address if available
    let profileAddress = null;
    if (user.profileAddressId) {
      try {
        profileAddress = await storage.getAddressById(user.profileAddressId);
      } catch (error) {
        Logger.warn(`[ONBOARDING] Failed to fetch profile address ${user.profileAddressId}:`, error);
      }
    }

    res.json({
      ...status,
      profileAddress
    });

  } catch (error: any) {
    Logger.error('[ONBOARDING] Get status error:', error);
    res.status(500).json({
      error: 'Failed to get onboarding status',
      message: 'Could not retrieve your profile completion status'
    });
  }
});

export default router;