import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { Logger } from './utils/logger';
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/env-validation';
import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Prevent multiple server instances
if (global.serverInstance) {
  Logger.info('[MAIN] Server already running, exiting...');
  process.exit(0);
}
global.serverInstance = true;

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
  
  // Check if we should serve static files or use Vite dev server
  const isProductionBuild = fs.existsSync(path.resolve(import.meta.dirname, "public"));
  
  if (isProductionBuild) {
    // Production: serve static files
    const publicPath = path.resolve(import.meta.dirname, "public");
    app.use(express.static(publicPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(publicPath, "index.html"));
      }
    });
  } else {
    // Development: serve frontend from client directory
    const clientPath = path.resolve(process.cwd(), "client");
    const indexPath = path.join(clientPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      app.use(express.static(clientPath));
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.sendFile(indexPath);
        }
      });
    } else {
      // Fallback for when frontend is not built
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.json({
            message: "Clean & Flip API Server - Development Mode",
            status: "operational",
            note: "Frontend not built - run 'npm run build' or start Vite dev server"
          });
        }
      });
    }
  }

  Logger.info(`[MAIN] Server setup completed successfully`);
  
  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    Logger.info('[SHUTDOWN] SIGTERM received, closing server...');
    httpServer?.close(() => {
      Logger.info('[SHUTDOWN] Server closed successfully');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    Logger.info('[SHUTDOWN] SIGINT received, closing server...');
    httpServer?.close(() => {
      Logger.info('[SHUTDOWN] Server closed successfully');
      process.exit(0);
    });
  });
  
  // Keep process alive while server is running
  process.on('exit', () => {
    Logger.info('[SHUTDOWN] Process exiting...');
  });
  
} catch (error) {
  Logger.error('[MAIN] Server startup failed:', error);
  process.exit(1);
}
})();
