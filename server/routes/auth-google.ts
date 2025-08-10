import { Router } from 'express';
import passport from 'passport';
import { db } from '../db';
import { users, userOnboarding } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../auth';
import { Logger } from '../utils/logger';

const router = Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  async (req, res) => {
    const user = req.user as any;
    
    Logger.info('[AUTH] Google callback for user:', { 
      id: user?.id, 
      profileComplete: user?.profileComplete, 
      onboardingStep: user?.onboardingStep 
    });
    
    try {
      // Check current user state from database to get fresh data
      const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
      
      if (dbUser) {
        // Don't force onboarding immediately - let them browse first
        if (!dbUser.profileComplete) {
          const onboardingStep = dbUser.onboardingStep ?? 0;
          const isNewUser = onboardingStep <= 1;
          Logger.info('[AUTH] New Google user - allowing browsing, will prompt at checkout:', { isNewUser, onboardingStep });
          // Let them browse with welcome message instead of forcing onboarding
          return res.redirect(`${req.protocol}://${req.get('host')}/products?welcome=true&google=true&new=${isNewUser}`);
        }
      }
      
      // Only allow dashboard access if profile is complete
      Logger.info('[AUTH] Redirecting completed Google user to dashboard');
      res.redirect(`${req.protocol}://${req.get('host')}/dashboard`);
      
    } catch (error) {
      Logger.error('[AUTH] Error in Google callback:', error);
      res.redirect('/login?error=callback_error');
    }
  }
);

// Onboarding endpoints
router.post('/onboarding/address', requireAuth, async (req, res) => {
  const { street, city, state, zipCode, phone, latitude, longitude } = req.body;
  const userId = (req.user as any).id;
  
  try {
    // Update user address, phone, and geolocation data
    await db.update(users)
      .set({
        street,
        city,
        state,
        zipCode: zipCode,
        phone,
        latitude: latitude || null,
        longitude: longitude || null,
        onboardingStep: 2,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Update onboarding tracking
    await db.update(userOnboarding)
      .set({
        addressCompleted: true,
        phoneCompleted: !!phone,
        updatedAt: new Date()
      })
      .where(eq(userOnboarding.userId, userId));
    
    res.json({ success: true, nextStep: 2 });
  } catch (error) {
    Logger.error('[ONBOARDING] Address update error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

router.post('/onboarding/complete', requireAuth, async (req, res) => {
  const userId = (req.user as any).id;
  
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    // Create Stripe customer if needed
    if (!user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId }
      });
      
      await db.update(users)
        .set({ 
          stripeCustomerId: customer.id,
          profileComplete: true,
          onboardingStep: 0,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } else {
      await db.update(users)
        .set({ 
          profileComplete: true,
          onboardingStep: 0,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
    
    // Mark onboarding complete
    await db.update(userOnboarding)
      .set({
        stripeCustomerCreated: true,
        updatedAt: new Date()
      })
      .where(eq(userOnboarding.userId, userId));
    
    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    Logger.error('[ONBOARDING] Completion error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;