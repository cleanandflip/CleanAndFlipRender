import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Logger } from './utils/logger';
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/env-validation';
import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const app = express();

// CRITICAL: Trust proxy headers for correct redirects
app.set('trust proxy', true);

// Reduced limits since images now go directly to Cloudinary
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Enhanced startup logging with environment validation
  Logger.info(`[MAIN] Starting Clean & Flip API Server`);
  
  try {
    // Validate environment configuration before starting
    const envConfig = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    
    Logger.info(`[MAIN] Environment validation passed`);
    Logger.info(`[MAIN] System Info:`, envInfo);
  } catch (error) {
    Logger.error(`[MAIN] Environment validation failed:`, error);
    process.exit(1);
  }

  // Global error handlers to prevent crashes
  process.on('uncaughtException', (error) => {
    Logger.error('[MAIN] Uncaught Exception - Server may be unstable:', error);
    if (process.env.NODE_ENV === 'production') {
      Logger.error('[MAIN] In production mode - attempting graceful recovery');
      // Don't exit in production, try to recover
    } else {
      Logger.error('[MAIN] In development mode - exiting process');
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    Logger.error(`[MAIN] Unhandled Promise Rejection:`, {
      reason: reason,
      promise: promise,
      stack: reason instanceof Error ? reason.stack : 'No stack trace available'
    });
  });

  // Add signal handlers for graceful shutdown
  process.on('SIGTERM', () => {
    Logger.info('[MAIN] Received SIGTERM signal - initiating graceful shutdown');
  });

  process.on('SIGINT', () => {
    Logger.info('[MAIN] Received SIGINT signal - initiating graceful shutdown');
  });

  let server;
  try {
    Logger.info('[MAIN] Initializing server...');
    server = await registerRoutes(app);
    Logger.info('[MAIN] Server initialization completed successfully');
  } catch (error) {
    Logger.error('[MAIN] Failed to start server:', error);
    process.exit(1);
  }

  // Run cleanup every hour for password reset tokens
  setInterval(async () => {
    try {
      // Clean up expired tokens directly with SQL
      const deleted = await db.execute(
        sql`DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true`
      );
      if (deleted.rowCount && deleted.rowCount > 0) {
        Logger.info(`[CLEANUP] Removed ${deleted.rowCount} expired password reset tokens`);
      }
    } catch (error) {
      Logger.error('[CLEANUP] Error cleaning up tokens:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Don't throw in production
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Import and setup simple password reset
  const { SimplePasswordReset } = await import('./services/simple-password-reset.js');
  const passwordReset = new SimplePasswordReset();

  // REQUEST PASSWORD RESET
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is required' 
        });
      }
      
      const result = await passwordReset.requestReset(email);
      res.json(result);
      
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred' 
      });
    }
  });

  // VALIDATE TOKEN
  app.get('/api/auth/validate-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const valid = await passwordReset.validateToken(token);
      
      res.json({ 
        valid: !!valid,
        message: valid ? 'Token is valid' : 'Invalid or expired token'
      });
      
    } catch (error) {
      res.status(400).json({ 
        valid: false, 
        message: 'Invalid token' 
      });
    }
  });

  // RESET PASSWORD
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password || password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid request' 
        });
      }
      
      const success = await passwordReset.resetPassword(token, password);
      
      res.json({ 
        success,
        message: success ? 'Password reset successfully' : 'Failed to reset password'
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred' 
      });
    }
  });

  // Check if we should serve static files or use Vite dev server
  const isProductionBuild = fs.existsSync(path.resolve(import.meta.dirname, "public"));
  
  if (isProductionBuild) {
    serveStatic(app);
  } else {
    // Use Vite dev server even in production NODE_ENV for development workflow
    await setupVite(app, server);
  }

  // Server is started by registerRoutes function
  // No need to start it again here
})();
