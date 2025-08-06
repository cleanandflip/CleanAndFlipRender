import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import { Logger } from './server/utils/logger';
import { validateEnvironmentVariables, getEnvironmentInfo } from './server/config/env-validation';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware without vite dependency
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
  // Enhanced startup logging with environment validation
  Logger.info(`[MAIN] Starting Clean & Flip API Server (Alternative Mode)`);
  
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

  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test`);
    Logger.info(`[MAIN] Database connection successful`);
  } catch (error) {
    Logger.error(`[MAIN] Database connection failed:`, error);
    process.exit(1);
  }

  registerRoutes(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Clean & Flip API Server Running',
      timestamp: new Date().toISOString(),
      mode: 'alternative'
    });
  });

  // Basic static file serving for production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist/public'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 5000;
  const HOST = '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    Logger.info(`[MAIN] 🚀 Server running on http://${HOST}:${PORT}`);
    Logger.info(`[MAIN] 📊 Health check: http://${HOST}:${PORT}/health`);
    Logger.info(`[MAIN] 🏢 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    Logger.info('[MAIN] SIGTERM received, shutting down gracefully');
    server.close(() => {
      Logger.info('[MAIN] Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    Logger.info('[MAIN] SIGINT received, shutting down gracefully');
    server.close(() => {
      Logger.info('[MAIN] Process terminated');
      process.exit(0);
    });
  });
})().catch((error) => {
  Logger.error('[MAIN] Fatal error during startup:', error);
  process.exit(1);
});