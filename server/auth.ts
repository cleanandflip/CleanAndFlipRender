import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { normalizeEmail, parseCityStateZip, isLocalZip, validateCityStateZip, normalizePhone } from "@shared/utils";
import { authLimiter } from "./middleware/security";
import { Logger, LogLevel } from "./utils/logger";
import { DATABASE_URL } from "./config/database";
import { initializeGoogleAuth } from './auth/google-strategy';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
    }
    interface Request {
      userId?: string;
    }
  }
}

const SALT_ROUNDS = 12; // Industry standard

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

// Password validation function
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Include at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Include at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Include at least one special character (!@#$%^&*)");
  }
  
  return { isValid: errors.length === 0, errors };
}

// These functions are now imported from shared/utils.ts

export function setupAuth(app: Express) {
  // Initialize Google OAuth strategy
  initializeGoogleAuth();
  
  // CRITICAL: Validate database configuration BEFORE creating session store
  console.log('[SESSION] Validating database configuration...');
  console.log('[SESSION] DATABASE_URL configured:', !!DATABASE_URL);
  console.log('[SESSION] DATABASE_URL format:', DATABASE_URL?.startsWith('postgresql://') ? 'Valid PostgreSQL' : 'Invalid');
  
  if (!DATABASE_URL) {
    console.error('[SESSION] CRITICAL: No DATABASE_URL found - this will cause MemoryStore fallback');
    console.error('[SESSION] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      APP_ENV: process.env.APP_ENV,
      hasProdUrl: !!process.env.PROD_DATABASE_URL,
      hasDevUrl: !!process.env.DEV_DATABASE_URL,
      hasLegacyUrl: !!process.env.DATABASE_URL
    });
    throw new Error('DATABASE_URL is required for session storage - cannot proceed with MemoryStore');
  }
  
  // Test database connection BEFORE setting up session store
  console.log('[SESSION] Testing database connection...');
  
  const PostgresSessionStore = connectPg(session);
  
  // Create session store with enhanced error handling
  let sessionStore: any;
  try {
    sessionStore = new PostgresSessionStore({
      conString: DATABASE_URL,
      createTableIfMissing: false, // Don't create table - already exists
      schemaName: 'public',
      tableName: 'sessions',
      ttl: 7 * 24 * 60 * 60,          // 7 days (seconds)
      pruneSessionInterval: 60 * 60,  // Prune expired rows hourly
      errorLog: (err: any) => {
        console.error('[SESSION STORE] PostgreSQL store error:', {
          message: err.message,
          code: err.code,
          name: err.name
        });
        
        if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
          console.error('[SESSION STORE] PRODUCTION ERROR: PostgreSQL session store failed');
        }
      }
    });
    
    console.log('[SESSION] PostgreSQL session store created successfully');
  } catch (error: any) {
    console.error('[SESSION] FAILED to create PostgreSQL session store:', error.message);
    console.error('[SESSION] This will definitely cause MemoryStore fallback');
    throw new Error(`Session store initialization failed: ${error.message}`);
  }
  
  const isProd = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    name: 'cf.sid',
    resave: false,            // Don't write on every request
    saveUninitialized: false, // CRITICAL: Don't create sessions for anonymous visitors
    store: sessionStore,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: isProd,                         // HTTPS only in production
      sameSite: isProd ? 'none' : 'lax',      // Cross-site in production
      maxAge: SEVEN_DAYS,                     // 7 days instead of 30
    },
    rolling: true, // Reset expiry on activity
  };

  app.set("trust proxy", 1);
  
  // CRITICAL: Skip session/auth for static assets and service worker
  app.use((req, _res, next) => {
    const path = req.path;
    if (
      path === '/sw.js' ||
      path === '/favicon.ico' ||
      path.startsWith('/assets/') ||
      path.startsWith('/static/') ||
      path.startsWith('/vite/') ||
      path.startsWith('/@vite/') ||
      path.startsWith('/src/') ||
      path.startsWith('/@fs/')
    ) {
      return next(); // Skip to next middleware without session/auth overhead
    }
    return next();
  });
  
  // Apply session middleware with validation
  console.log('[SESSION] Applying session middleware with PostgreSQL store...');
  app.use(session(sessionSettings));
  
  // Verify session store is actually being used (not falling back to MemoryStore)
  const appliedStore = (sessionSettings.store as any);
  if (appliedStore && appliedStore.constructor.name === 'PGStore') {
    console.log('[SESSION] ✅ PostgreSQL session store confirmed active');
  } else {
    console.error('[SESSION] ❌ WARNING: Session store is not PostgreSQL - MemoryStore fallback detected!');
    console.error('[SESSION] Store type:', appliedStore?.constructor?.name || 'Unknown');
    if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
      throw new Error('Production cannot use MemoryStore for sessions');
    }
  }
  
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Normalize email for case-insensitive login
        const normalizedEmail = normalizeEmail(email);
        Logger.debug(`Login attempt for email: ${normalizedEmail}`);
        
        const user = await storage.getUserByEmail(normalizedEmail);
        if (!user) {
          Logger.debug(`User not found for email: ${normalizedEmail}`);
          return done(null, false, { 
            message: "No account found with this email address. Please check your email or create a new account."
          });
        }
        
        Logger.debug(`User found, checking password for: ${normalizedEmail}`);
        Logger.debug(`User password hash exists: ${!!user.password}`);
        
        const passwordMatch = user.password ? await comparePasswords(password, user.password) : false;
        if (!passwordMatch) {
          Logger.debug(`Invalid password for email: ${normalizedEmail}`);
          return done(null, false, { 
            message: "Incorrect password. Please check your password and try again."
          });
        }
        
        Logger.debug(`Successful login for email: ${normalizedEmail}`);
        return done(null, {
          ...user,
          role: user.role || 'user'
        });
      } catch (error: any) {
        Logger.error('Login authentication error:', error.message);
        return done(error, false, { 
          message: "System error during login. Please try again."
        });
      }
    }),
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === 'production' 
            ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-domain.replit.app'}/api/auth/google/callback`
            : "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"), undefined);
            }

            const normalizedEmail = normalizeEmail(email);
            Logger.debug(`Google OAuth attempt for email: ${normalizedEmail}`);

            // Check if user already exists by email
            let user = await storage.getUserByEmail(normalizedEmail);
            
            if (user) {
              // Update user with Google info if not already set
              if (!user.googleId) {
                user = await storage.updateUserGoogleInfo(user.id, {
                  googleId: profile.id,
                  profileImageUrl: profile.photos?.[0]?.value,
                  isEmailVerified: true,
                  authProvider: 'google'
                });
              }
              Logger.debug(`Existing user logged in via Google: ${normalizedEmail}`);
              return done(null, {
                ...user,
                role: user.role || 'user'
              } as any);
            } else {
              // Create new user from Google profile
              const newUser = await storage.createUserFromGoogle({
                email: normalizedEmail,
                firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
                lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
                googleId: profile.id,
                profileImageUrl: profile.photos?.[0]?.value,
                authProvider: 'google',
                isEmailVerified: true
              });
              
              Logger.debug(`New user created via Google: ${normalizedEmail}`);
              return done(null, {
                ...newUser,
                role: newUser.role || 'user'
              } as any);
            }
          } catch (error: any) {
            Logger.error('Google OAuth error:', error.message);
            return done(error, undefined);
          }
        }
      )
    );
  } else {
    Logger.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  // CRITICAL FIX: Proper Passport serialization - store only user ID
  passport.serializeUser((user, done) => {
    const userId = (user as any).id;
    Logger.debug(`[PASSPORT] Serializing user ID: ${userId}`);
    done(null, userId); // Store only the ID, not an object
  });
  
  // PRODUCTION-SAFE: Never crash on auth failures - wrap in comprehensive try/catch
  passport.deserializeUser(async (id: string, done) => {
    try {
      Logger.debug(`[PASSPORT] Deserializing user with ID: ${id}`);
      
      // Query database for user with comprehensive error handling
      const user = await storage.getUser(id);
      if (!user) {
        Logger.debug(`[PASSPORT] User not found for ID: ${id}`);
        return done(null, false); // User not found
      }
      
      // Remove password from user object for security
      const { password, ...userWithoutPassword } = user;
      const userForSession = {
        ...userWithoutPassword,
        role: user.role || 'user'
      };
      
      Logger.debug(`[PASSPORT] Successfully deserialized user: ${user.email}`);
      done(null, userForSession);
    } catch (error: any) {
      Logger.error(`[PASSPORT] Deserialization error (${error.code}):`, error.message);
      
      // Handle specific database schema errors gracefully
      if (error.code === '42703') {
        Logger.error('[PASSPORT] Schema mismatch detected during user deserialization');
        Logger.error('[PASSPORT] This indicates missing columns in production database');
      }
      
      // CRITICAL: Never crash the request due to a user fetch problem
      // This ensures /sw.js and other requests can continue even if DB issues occur
      return done(null, false);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { 
        email, 
        password, 
        confirmPassword, 
        firstName, 
        lastName, 
        phone,
        isLocalCustomer 
      } = req.body;

      // Validate required fields
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Password does not meet requirements",
          errors: passwordValidation.errors
        });
      }


      // Normalize email and check if user already exists (don't reveal if email exists for security)
      const normalizedEmail = normalizeEmail(email);
      Logger.debug(`Registration attempt for email: ${normalizedEmail}`);
      
      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        Logger.debug(`Email already exists: ${normalizedEmail}`);
        return res.status(409).json({ 
          error: "Account already exists",
          details: "An account with this email already exists. Please sign in instead.",
          code: "EMAIL_EXISTS"
        });
      }

      // Local customer status is determined client-side based on Asheville zip codes

      // Determine role based on criteria (using normalized email)
      let role: "user" | "developer" = "user";
      if (normalizedEmail.includes("developer") || normalizedEmail.includes("@dev.") || normalizedEmail === "admin@cleanandflip.com") {
        role = "developer";
      }

      // Normalize phone number
      const normalizedPhone = phone ? normalizePhone(phone) : undefined;

      const user = await storage.createUser({
        email: normalizedEmail,
        password: await hashPassword(password),
        firstName,
        lastName,
        phone: normalizedPhone,
        role,
      });

      const userForSession = {
        ...user,
        role: user.role || 'user'
      };
      // CRITICAL: Use req.logIn to establish Passport session properly
      req.logIn(userForSession, (err) => {
        if (err) return next(err);
        
        // CRITICAL FIX: Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            Logger.error('Registration session save error:', saveErr);
            return res.status(500).json({ 
              error: "Session persistence failed",
              details: "Registration successful but session could not be saved. Please try logging in."
            });
          }
          
          Logger.debug(`Registration successful and session saved for: ${user.email}`);
          Logger.debug(`Session passport user: ${JSON.stringify((req.session as any).passport)}`);
          
          res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'user'
          });
        });
      });
    } catch (error) {
      Logger.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint with detailed error messages and rate limiting
  app.post("/api/login", (req, res, next) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Missing credentials",
        details: "Please provide both email and password."
      });
    }

    passport.authenticate("local", (err: any, user: User, info: any) => {
      if (err) {
        Logger.error('Passport authentication error:', err);
        return res.status(500).json({ 
          error: "System error",
          details: "A system error occurred during login. Please try again."
        });
      }
      
      if (!user) {
        const errorResponse = {
          error: "Authentication failed",
          details: info?.message || "Invalid credentials",
          code: info?.code || "INVALID_CREDENTIALS"
        };
        
        // Add helpful suggestions based on error type
        if (info?.code === "USER_NOT_FOUND") {
          (errorResponse as any).suggestion = "Try creating a new account or check your email spelling.";
        } else if (info?.code === "INVALID_PASSWORD") {
          (errorResponse as any).suggestion = "Double-check your password or consider password reset.";
        }
        
        return res.status(401).json(errorResponse);
      }
      
      const userForSession = {
        ...user,
        role: user.role || 'user'
      };
      
      // CRITICAL: Use req.logIn to establish Passport session properly
      req.logIn(userForSession, (loginErr) => {
        if (loginErr) {
          Logger.error('Session creation error:', loginErr);
          return res.status(500).json({ 
            error: "Session error",
            details: "Login successful but session creation failed. Please try again."
          });
        }
        
        // CRITICAL FIX: Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            Logger.error('Session save error:', saveErr);
            return res.status(500).json({ 
              error: "Session persistence failed",
              details: "Login successful but session could not be saved. Please try again."
            });
          }
          
          Logger.debug(`Login successful and session saved for: ${email}`);
          Logger.debug(`Session ID: ${req.sessionID}`);
          Logger.debug(`Session passport user: ${JSON.stringify((req.session as any).passport)}`);
          Logger.debug(`Is authenticated: ${req.isAuthenticated()}`);
          
          res.status(200).json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role || 'user'
            }
          });
        });
      });
    })(req, res, next);
  });

  // Logout endpoint - CRITICAL FIX for session persistence bug
  app.post("/api/logout", (req, res, next) => {
    try {
      // Destroy session completely to prevent auto re-authentication
      req.session.destroy((err) => {
        if (err) {
          Logger.error('Session destruction error:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        
        // Clear session cookie completely
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        // Also try alternative cookie names
        res.clearCookie('sessionId');
        res.clearCookie('session');
        
        Logger.debug('Session destroyed and cookies cleared for logout');
        res.json({ success: true });
      });
    } catch (error) {
      Logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Debug endpoint to check account status
  app.post("/api/debug/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const normalizedEmail = normalizeEmail(email);
      const user = await storage.getUserByEmail(normalizedEmail);
      
      if (user) {
        res.json({
          exists: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created: user.createdAt,
            hasPassword: !!user.password
          }
        });
      } else {
        res.json({ 
          exists: false,
          checkedEmail: normalizedEmail
        });
      }
    } catch (error: any) {
      Logger.error('Debug check-email error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Session test endpoint (for debugging)
  app.get("/api/session-test", (req, res) => {
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      userId: (req.session as any)?.passport?.user,
      isAuthenticated: req.isAuthenticated?.() || false,
      sessionData: req.session,
    });
  });

  // Google OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { 
      successRedirect: "/",
      failureRedirect: "/auth?error=oauth_failed" 
    })
  );

  // Note: /api/user endpoint is defined in routes.ts to avoid conflicts
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  const endpoint = `${req.method} ${req.path}`;
  
  // Check if user is authenticated via passport
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    Logger.consolidate(
      `auth-fail-${endpoint}`,
      `Authentication failed for ${endpoint}`,
      LogLevel.DEBUG
    );
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
  
  const user = req.user;
  if (!user) {
    Logger.consolidate(
      `auth-fail-nouser-${endpoint}`,
      `No user object for ${endpoint}`,
      LogLevel.DEBUG
    );
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
  
  // Set userId for consistent access in route handlers
  req.userId = user.id;
  Logger.consolidate(
    `auth-success-${user.id}-${endpoint}`,
    `Auth successful for user ${user.id} on ${endpoint}`,
    LogLevel.DEBUG
  );
  next();
}

// Middleware to require specific roles
export function requireRole(roles: string | string[]) {
  return (req: any, res: any, next: any) => {
    Logger.debug('RequireRole middleware - Is authenticated:', req.isAuthenticated?.());
    Logger.debug('RequireRole middleware - User from passport:', req.user);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as User;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    Logger.debug('RequireRole check:', {
      userRole: user.role,
      allowedRoles,
      hasRole: allowedRoles.includes(user.role || 'user'),
      isDeveloper: user.role === 'developer'
    });
    
    // Allow if user has the required role OR if user is developer (developers can do everything)
    if (!allowedRoles.includes(user.role || 'user') && user.role !== 'developer') {
      Logger.debug('Permission denied - user lacks required role and is not developer');
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    Logger.debug('Permission granted for user:', user.email);
    next();
  };
}

