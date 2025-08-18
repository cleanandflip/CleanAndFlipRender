import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Logger } from '../utils/logger';

const GOOGLE_CONFIG = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-domain.replit.app'}/api/auth/google/callback`
    : "/api/auth/google/callback",
  scope: ['profile', 'email']
};

export function initializeGoogleAuth() {
  passport.use(new GoogleStrategy(
    GOOGLE_CONFIG,
    async (accessToken, refreshToken, profile, done) => {
      try {
        Logger.debug('[AUTH] Google authentication for:', profile.emails?.[0]?.value);
        
        // Extract user info from Google profile
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const picture = profile.photos?.[0]?.value;
        
        if (!email) {
          return done(new Error('No email from Google'), false);
        }
        
        // Check if user exists by Google Sub (new Google Auth schema)
        let [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.googleSub, googleId))
          .limit(1);
        
        if (existingUser) {
          // Existing Google user - update last login
          await db.update(users)
            .set({ 
              lastLoginAt: new Date(),
              googlePicture: picture // Update picture in case it changed
            })
            .where(eq(users.id, existingUser.id));
          
          Logger.debug('[AUTH] Existing Google user logged in:', email);
          return done(null, {
            ...existingUser,
            role: existingUser.role || 'user'
          } as any);
        }
        
        // Check if user exists by email (might be converting from email/password)
        [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        
        if (existingUser) {
          // User exists with email/password - link Google account
          await db.update(users)
            .set({
              googleSub: googleId,
              googleEmail: email,
              googleEmailVerified: true,
              googlePicture: picture,
              authProvider: 'google',
              isEmailVerified: true,
              updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id));
          
          Logger.debug('[AUTH] Linked Google to existing account:', email);
          return done(null, {
            ...existingUser,
            googleSub: googleId,
            role: existingUser.role || 'user'
          } as any);
        }
        
        // New user - create account
        const newUserId = randomUUID();
        
        const [newUser] = await db.insert(users)
          .values({
            id: newUserId,
            email,
            googleSub: googleId,
            googleEmail: email,
            googleEmailVerified: true,
            googlePicture: picture,
            lastLoginAt: new Date(),
            firstName,
            lastName,
            authProvider: 'google',
            isEmailVerified: true,
            profileComplete: true, // Google users are immediately active
            role: 'user' // All new users start as regular users
          })
          .returning();
        
        // REMOVED: Onboarding record creation - no longer needed
        
        Logger.debug('[AUTH] New Google user created:', email);
        return done(null, {
          ...newUser,
          role: newUser.role || 'user'
        } as any);
        
      } catch (error) {
        Logger.error('[AUTH] Google strategy error:', error);
        return done(error as Error, false);
      }
    }
  ));
}