import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";

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

// City, State ZIP validation
function validateCityStateZip(cityStateZip: string): boolean {
  const cityStateZipRegex = /^[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}$/;
  return cityStateZipRegex.test(cityStateZip);
}

// Check if ZIP is in local service area (Asheville, NC area)
function checkIfLocalZip(zip: string): boolean {
  const localZips = [
    "28801", "28802", "28803", "28804", "28805", "28806", "28807", "28808", 
    "28810", "28813", "28814", "28815", "28816", "28817", "28818"
  ];
  return localZips.includes(zip);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Allow table creation if needed
      schemaName: 'public',
      tableName: 'session',
      errorLog: (err: any) => {
        if (err && !err.message?.includes('already exists')) {
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
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, {
          ...user,
          role: user.role || 'user'
        });
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? {
        ...user,
        role: user.role || 'user'
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

      // Check if user already exists (don't reveal if email exists for security)
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Registration failed. Please try again." });
      }

      // Determine if user is local customer
      let isLocalCustomer = false;
      if (cityStateZip) {
        const zip = cityStateZip.split(' ').pop();
        isLocalCustomer = checkIfLocalZip(zip || '');
      }

      // Determine role based on criteria
      let role: "user" | "developer" | "admin" = "user";
      if (email.includes("developer") || email.includes("@dev.")) {
        role = "developer";
      }
      if (email === "admin@cleanandflip.com") {
        role = "admin";
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        address: address || undefined,
        cityStateZip: cityStateZip || undefined,
        phone: phone || undefined,
        role,
        isAdmin: role === "admin" || role === "developer",
        isLocalCustomer,
      });

      const userForSession = {
        ...user,
        role: user.role || 'user'
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

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      const userForSession = {
        ...user,
        role: user.role || 'user'
      };
      req.login(userForSession, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'user',
          isAdmin: user.isAdmin,
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

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    
    const user = req.user as User;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.isAdmin,
    });
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to require specific roles
export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as User;
    if (!roles.includes(user.role || 'user')) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}