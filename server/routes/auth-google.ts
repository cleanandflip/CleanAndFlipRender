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
    
    Logger.debug('[AUTH] Google callback for user:', user?.id);
    
    // Force redirect to onboarding for new Google users
    if (!user.profileComplete || user.onboardingStep > 0) {
      // Redirect to onboarding with step
      const step = user.onboardingStep || 1;
      Logger.debug('[AUTH] Redirecting to onboarding step:', step);
      res.redirect('/onboarding?step=' + step + '&new=true');
    } else {
      // Redirect to dashboard or original destination
      const returnTo = (req.session as any)?.returnTo || '/dashboard';
      delete (req.session as any)?.returnTo;
      Logger.debug('[AUTH] Redirecting to:', returnTo);
      res.redirect(returnTo);
    }
  }
);

// Onboarding endpoints
router.post('/onboarding/address', requireAuth, async (req, res) => {
  const { street, city, state, zipCode, phone } = req.body;
  const userId = (req.user as any).id;
  
  try {
    // Update user address and phone
    await db.update(users)
      .set({
        street,
        city,
        state,
        zipCode,
        phone,
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