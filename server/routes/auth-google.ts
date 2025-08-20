import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router } from 'express';
import { storage } from '../storage';
import { Logger } from '../utils/logger';
import { requireAuth } from '../auth';
import { db } from '../db';
import { users } from '@shared/schema';
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
      return done(new Error('No email from Google profile'), undefined);
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
        profileComplete: true, // Google users are immediately active
        // No password field for Google users
      } as any);
    } else if (!user.googleId) {
      // Link existing account with Google
      await storage.updateUserGoogleInfo(user.id, {
        googleId: profile.id,
        profileImageUrl: profile.photos?.[0]?.value || '',
        isEmailVerified: true,
        authProvider: 'google' // Update provider
      });
    }
    
    return done(null, user as any);
  } catch (error) {
    return done(error as any, undefined);
  }
}));

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  // Store return URL for after auth
  req.session.returnTo = (req.query.returnTo as string) || req.headers.referer || '/dashboard';
  
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
    const baseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_ORIGIN || '')
      : '';
    
    const returnUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(`${baseUrl}${returnUrl}`);
  }
);

// REMOVED: Onboarding endpoints - no longer needed per user instructions

export default router;