import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { Logger } from './config/logger';
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/env-validation';
import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Cleanup any existing processes on this port
const cleanup = async () => {
  try {
    const { exec } = await import('child_process');
    const port = process.env.PORT || 5000;
    exec(`lsof -t -i:${port}`, (error, stdout) => {
      if (stdout) {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          if (pid && pid !== process.pid.toString()) {
            console.log(`[CLEANUP] Killing old process ${pid} on port ${port}`);
            exec(`kill -9 ${pid}`);
          }
        });
      }
    });
  } catch (error) {
    // Ignore cleanup errors
  }
};

// Prevent multiple server instances
if ((global as any).serverInstance) {
  console.log('[MAIN] Server already running, exiting...');
  process.exit(0);
}
(global as any).serverInstance = true;

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

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Run cleanup before starting
    await cleanup();
    
    Logger.info(`[MAIN] Starting Clean & Flip API Server`);
    
    // Validate environment
    const envConfig = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    Logger.info(`[MAIN] Environment validation passed`);

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

  const httpServer = await registerRoutes(app);
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    // Production: serve static files from the dist directory
    const distPath = path.resolve(import.meta.dirname, "../dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.sendFile(path.join(distPath, "index.html"));
        }
      });
      Logger.info(`[MAIN] Serving static files from ${distPath}`);
    } else {
      // Fallback for production without build files
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.json({
            message: "Clean & Flip API Server",
            status: "production",
            note: "Frontend build files not found - run 'npm run build'"
          });
        }
      });
      Logger.info(`[MAIN] Production mode - no build files found`);
    }
  } else {
    // Development: setup vite dev server
    try {
      const viteModule = await import("./vite.js");
      await viteModule.setupVite(app, httpServer);
      Logger.info(`[MAIN] Vite development server initialized`);
    } catch (error) {
      Logger.error(`[MAIN] Failed to setup Vite dev server:`, error);
      // Fallback to serving client directory directly
      const clientPath = path.resolve(process.cwd(), "client");
      const indexPath = path.join(clientPath, "index.html");
      
      if (fs.existsSync(indexPath)) {
        app.use(express.static(clientPath));
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(indexPath);
          }
        });
        Logger.info(`[MAIN] Serving client files directly from ${clientPath}`);
      } else {
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.json({
              message: "Clean & Flip API Server - Development Mode",
              status: "operational",
              note: "Vite dev server unavailable - serving API only"
            });
          }
        });
        Logger.info(`[MAIN] Development mode - serving API only`);
      }
    }
  }

  Logger.info(`[MAIN] Server setup completed successfully`);
  
  // Enhanced graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    Logger.info(`[SHUTDOWN] ${signal} received, initiating graceful shutdown...`);
    (global as any).serverInstance = false;
    
    if (httpServer) {
      httpServer.close((err) => {
        if (err) {
          Logger.error('[SHUTDOWN] Error closing server:', err);
          process.exit(1);
        } else {
          Logger.info('[SHUTDOWN] Server closed successfully');
          process.exit(0);
        }
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        Logger.error('[SHUTDOWN] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Keep process alive while server is running
  process.on('exit', () => {
    Logger.info('[SHUTDOWN] Process exiting...');
  });
  
} catch (error) {
  Logger.error('[MAIN] Server startup failed:', error);
  process.exit(1);
}
})();
