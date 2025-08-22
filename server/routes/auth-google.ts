import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router } from 'express';
import { storage } from '../storage';
import { Logger } from '../utils/logger';
import { requireAuth } from '../auth';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { ENV } from '../config/env';

// Extend session type to include returnTo
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

const router = Router();

const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (hasGoogle) {
	// Configure Google OAuth Strategy
	passport.use(new GoogleStrategy({
		clientID: process.env.GOOGLE_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		callbackURL: '/api/auth/google/callback', // Use relative URL
		proxy: true, // CRITICAL: Trust proxy headers
		passReqToCallback: true
	}, async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
		try {
			const email = profile.emails?.[0]?.value?.toLowerCase() || '';
			let user = await storage.findUserByEmail(email);
			
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
				} as any);
			} else if (!user.googleId) {
				// Link existing account with Google
				await storage.updateUserGoogleInfo(user.id, {
					googleId: profile.id,
					profileImageUrl: profile.photos?.[0]?.value || '',
					isEmailVerified: true,
					authProvider: 'google'
				});
			}
			
			return done(null, user);
		} catch (error) {
			return done(error);
		}
	}));
	
	// Routes
	router.get('/google/start', passport.authenticate('google', {
		scope: ['profile', 'email']
	}));
	
	router.get('/google/callback', passport.authenticate('google', {
		failureRedirect: '/auth?error=google'
	}), (_req, res) => {
		res.redirect('/');
	});
} else {
	// No-op routes when Google OAuth is not configured
	router.get('/google/start', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
	router.get('/google/callback', (_req, res) => res.status(503).json({ error: 'Google OAuth not configured' }));
}

export default router;