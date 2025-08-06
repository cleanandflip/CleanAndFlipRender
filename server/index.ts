import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Logger } from './utils/logger';
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/env-validation';
import { db } from './db';
import { sql } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  console.log("[INFO] [MAIN] Environment mode:", app.get("env"));
  console.log("[INFO] [MAIN] NODE_ENV:", process.env.NODE_ENV);
  
  // Force development mode to serve React frontend
  const isDev = true; // Force dev mode to serve the React app
  
  if (isDev) {
    console.log("[INFO] [MAIN] Setting up Vite development server...");
    await setupVite(app, server);
    console.log("[INFO] [MAIN] Vite development server configured successfully");
  } else {
    console.log("[INFO] [MAIN] Setting up static file serving...");
    try {
      serveStatic(app);
      console.log("[INFO] [MAIN] Static file serving configured successfully");
    } catch (error) {
      console.log("[WARN] [MAIN] Static build not found, falling back to dev mode");
      await setupVite(app, server);
    }
  }

  // Server is started by registerRoutes function
  // No need to start it again here
})();
