import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router } from 'express';
import { storage } from '../storage';
import { Logger } from '../utils/logger';
import { requireAuth } from '../auth';
import { db } from '../db';
import { users, userOnboarding } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend session type to include returnTo
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

const router = Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback', // Use relative URL
  proxy: true, // CRITICAL: Trust proxy headers
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists by email
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email from Google profile'), null);
    }
    
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create new Google user
      user = await storage.createUser({
        googleId: profile.id,
        email: email,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || '',
        isEmailVerified: true,
        authProvider: 'google',
        profileComplete: false, // MUST complete onboarding
        onboardingStep: 0,
        // No password field for Google users
      });
    } else if (!user.googleId) {
      // Link existing account with Google
      await storage.updateUserGoogleInfo(user.id, {
        googleId: profile.id,
        profileImageUrl: profile.photos?.[0]?.value || '',
        isEmailVerified: true,
        authProvider: 'google' // Update provider
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  // Store return URL for after auth
  req.session.returnTo = req.query.returnTo || req.headers.referer || '/dashboard';
  
  // Save session before redirect
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  });
});

// Handle Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
  async (req, res) => {
    const user = req.user as any;
    
    // Determine base URL for redirect
    const host = req.get('host');
    const baseUrl = host?.includes('cleanandflip.com') 
      ? 'https://cleanandflip.com'
      : host?.includes('cleanflip.replit.app')
      ? 'https://cleanflip.replit.app'
      : '';
    
    // New Google users MUST complete onboarding
    if (!user.profileComplete && user.authProvider === 'google') {
      res.redirect(`${baseUrl}/onboarding?source=google&required=true`);
    } else {
      const returnUrl = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      res.redirect(`${baseUrl}${returnUrl}`);
    }
  }
);

// Add onboarding completion endpoint
router.post('/onboarding/complete', requireAuth, async (req, res) => {
  try {
    const { address, phone, preferences } = req.body;
    const user = req.user as any;
    
    // Validate required fields for Google users
    if (user.authProvider === 'google') {
      if (!address?.street || !address?.city || !address?.state || !address?.zipCode) {
        return res.status(400).json({ error: 'Complete address required' });
      }
      if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
      }
    }

    // Update user profile
    await storage.updateUser(user.id, {
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: phone,
      latitude: address.latitude ? String(address.latitude) : undefined,
      longitude: address.longitude ? String(address.longitude) : undefined,
      profileComplete: true,
      onboardingStep: 4,
      isLocalCustomer: address.zipCode?.startsWith('287') || address.zipCode?.startsWith('288'),
      updatedAt: new Date()
    });

    const returnUrl = (req.query.return as string) || '/dashboard';
    const isLocal = address.zipCode?.startsWith('287') || address.zipCode?.startsWith('288');
    
    res.json({ 
      success: true, 
      redirectUrl: returnUrl,
      isLocalCustomer: isLocal
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;