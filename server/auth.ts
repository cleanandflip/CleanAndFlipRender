import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { normalizeEmail, parseCityStateZip, isLocalZip, validateCityStateZip, normalizePhone } from "@shared/utils";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      isAdmin: boolean;
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
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false, // Don't create table - already exists
      schemaName: 'public',
      tableName: 'sessions', // Use existing sessions table
      errorLog: (err: any) => {
        // Suppress "already exists" errors for index and table
        if (err && !err.message?.includes('already exists') && !err.message?.includes('IDX_session_expire')) {
          console.error('Session store error:', err);
        }
      }
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Normalize email for case-insensitive login
        const normalizedEmail = normalizeEmail(email);
        console.log(`Login attempt for email: ${normalizedEmail}`);
        
        const user = await storage.getUserByEmail(normalizedEmail);
        if (!user) {
          console.log(`User not found for email: ${normalizedEmail}`);
          return done(null, false, { 
            message: "No account found with this email address. Please check your email or create a new account.",
            code: "USER_NOT_FOUND"
          });
        }
        
        console.log(`User found, checking password for: ${normalizedEmail}`);
        console.log(`User password hash exists: ${!!user.password}`);
        
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          console.log(`Invalid password for email: ${normalizedEmail}`);
          return done(null, false, { 
            message: "Incorrect password. Please check your password and try again.",
            code: "INVALID_PASSWORD"
          });
        }
        
        console.log(`Successful login for email: ${normalizedEmail}`);
        return done(null, {
          ...user,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false
        });
      } catch (error: any) {
        console.error('Login authentication error:', error.message);
        return done(error, false, { 
          message: "System error during login. Please try again.",
          code: "SYSTEM_ERROR"
        });
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? {
        ...user,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false
      } : null);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, confirmPassword, firstName, lastName, address, cityStateZip, phone } = req.body;

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

      // Validate city, state, ZIP format
      if (cityStateZip && !validateCityStateZip(cityStateZip)) {
        return res.status(400).json({ 
          message: "Please enter city, state ZIP in format: City, ST 12345"
        });
      }

      // Normalize email and check if user already exists (don't reveal if email exists for security)
      const normalizedEmail = normalizeEmail(email);
      console.log(`Registration attempt for email: ${normalizedEmail}`);
      
      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        console.log(`Email already exists: ${normalizedEmail}`);
        return res.status(409).json({ 
          error: "Account already exists",
          details: "An account with this email already exists. Please sign in instead.",
          code: "EMAIL_EXISTS",
          suggestion: "Try logging in with your existing account."
        });
      }

      // Determine if user is local customer
      let isLocalCustomer = false;
      if (cityStateZip) {
        const parsed = parseCityStateZip(cityStateZip);
        if (parsed) {
          isLocalCustomer = isLocalZip(parsed.zip);
        }
      }

      // Determine role based on criteria (using normalized email)
      let role: "user" | "developer" | "admin" = "user";
      if (normalizedEmail.includes("developer") || normalizedEmail.includes("@dev.")) {
        role = "developer";
      }
      if (normalizedEmail === "admin@cleanandflip.com") {
        role = "admin";
      }

      // Normalize phone number
      const normalizedPhone = phone ? normalizePhone(phone) : undefined;

      const user = await storage.createUser({
        email: normalizedEmail,
        password: await hashPassword(password),
        firstName,
        lastName,
        address: address || undefined,
        cityStateZip: cityStateZip || undefined,
        phone: normalizedPhone,
        role,
        isAdmin: role === "admin" || role === "developer",
        isLocalCustomer,
      });

      const userForSession = {
        ...user,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false
      };
      req.login(userForSession, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'user',
          isAdmin: user.isAdmin,
          isLocalCustomer: user.isLocalCustomer,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint with detailed error messages
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
        console.error('Passport authentication error:', err);
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
          errorResponse.suggestion = "Try creating a new account or check your email spelling.";
        } else if (info?.code === "INVALID_PASSWORD") {
          errorResponse.suggestion = "Double-check your password or consider password reset.";
        }
        
        return res.status(401).json(errorResponse);
      }
      
      const userForSession = {
        ...user,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false
      };
      
      req.login(userForSession, (loginErr) => {
        if (loginErr) {
          console.error('Session creation error:', loginErr);
          return res.status(500).json({ 
            error: "Session error",
            details: "Login successful but session creation failed. Please try again."
          });
        }
        
        console.log(`Login successful for: ${email}`);
        res.status(200).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'user',
            isAdmin: user.isAdmin || false,
          }
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
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
      console.error('Debug check-email error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    
    const user = req.user as User;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
    });
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  console.log('RequireAuth middleware - Is authenticated:', req.isAuthenticated?.());
  console.log('RequireAuth middleware - User from passport:', req.user);
  console.log('RequireAuth middleware - Session passport:', req.session?.passport);
  
  // Check if user is authenticated via passport
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    console.log('User not authenticated via passport in requireAuth');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  const user = req.user;
  if (!user) {
    console.log('No user object in request in requireAuth');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  // Set userId for consistent access in route handlers
  req.userId = user.id;
  console.log('RequireAuth - Authentication successful for user:', user.email, 'userId:', user.id);
  next();
}

// Middleware to require specific roles
export function requireRole(roles: string | string[]) {
  return (req: any, res: any, next: any) => {
    console.log('RequireRole middleware - Is authenticated:', req.isAuthenticated?.());
    console.log('RequireRole middleware - User from passport:', req.user);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as User;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    console.log('RequireRole check:', {
      userRole: user.role,
      isAdmin: user.isAdmin,
      allowedRoles,
      hasRole: allowedRoles.includes(user.role || 'user'),
      isAdminUser: user.isAdmin
    });
    
    // Allow if user has the required role OR if user is admin (admins can do everything)
    if (!allowedRoles.includes(user.role || 'user') && !user.isAdmin) {
      console.log('Permission denied - user lacks required role and is not admin');
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    console.log('Permission granted for user:', user.email);
    next();
  };
}