import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { Logger } from "./config/logger";
import {
  validateEnvironmentVariables,
  getEnvironmentInfo,
} from "./config/env-validation";
import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Prevent multiple server instances
if ((global as any).serverInstance) {
  console.log("[MAIN] Server already running, exiting...");
  process.exit(0);
}
(global as any).serverInstance = true;

// Cleanup function to kill any existing processes on the port
const cleanup = async () => {
  try {
    const { exec } = await import("child_process");
    const port = process.env.PORT || 5000;

    return new Promise<void>((resolve) => {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (stdout) {
          const pids = stdout.trim().split("\n");
          pids.forEach((pid) => {
            if (pid && pid !== process.pid.toString()) {
              console.log(
                `[CLEANUP] Killing old process ${pid} on port ${port}`,
              );
              try {
                process.kill(parseInt(pid), "SIGKILL");
              } catch (e) {
                // Process might already be dead
              }
            }
          });
        }
        // Add small delay to ensure port is freed
        setTimeout(resolve, 500);
      });
    });
  } catch (error) {
    // Ignore cleanup errors on systems without lsof
    return Promise.resolve();
  }
};

// Main server initialization
async function startServer() {
  try {
    // Run cleanup before starting
    await cleanup();

    Logger.info(`[MAIN] Starting Clean & Flip API Server`);

    // Validate environment
    const envConfig = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    Logger.info(`[MAIN] Environment validation passed`);
    Logger.info(`[MAIN] Environment: ${process.env.NODE_ENV || "development"}`);

    // Create Express app
    const app = express();

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Request logging middleware
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
            const responseStr = JSON.stringify(capturedJsonResponse);
            if (responseStr.length <= 50) {
              logLine += ` :: ${responseStr}`;
            }
          }

          if (logLine.length > 120) {
            logLine = logLine.slice(0, 119) + "…";
          }

          console.log(logLine);
        }
      });

      next();
    });

    // Initialize password reset service
    let passwordReset: any;
    try {
      const { SimplePasswordReset } = await import(
        "./services/simple-password-reset.js"
      );
      passwordReset = new SimplePasswordReset();
      Logger.info("[MAIN] Password reset service initialized");
    } catch (error) {
      Logger.warn("[MAIN] Password reset service not available:", error);
    }

    // Password reset routes (before main routes)
    if (passwordReset) {
      // Request password reset
      app.post("/api/auth/forgot-password", async (req, res) => {
        try {
          const { email } = req.body;

          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Email is required",
            });
          }

          const result = await passwordReset.requestReset(email);
          res.json(result);
        } catch (error) {
          console.error("Password reset error:", error);
          res.status(500).json({
            success: false,
            message: "An error occurred",
          });
        }
      });

      // Validate token
      app.get("/api/auth/validate-token/:token", async (req, res) => {
        try {
          const { token } = req.params;
          const valid = await passwordReset.validateToken(token);

          res.json({
            valid: !!valid,
            message: valid ? "Token is valid" : "Invalid or expired token",
          });
        } catch (error) {
          res.status(400).json({
            valid: false,
            message: "Invalid token",
          });
        }
      });

      // Reset password
      app.post("/api/auth/reset-password", async (req, res) => {
        try {
          const { token, password } = req.body;

          if (!token || !password || password.length < 8) {
            return res.status(400).json({
              success: false,
              message: "Invalid request",
            });
          }

          const success = await passwordReset.resetPassword(token, password);

          res.json({
            success,
            message: success
              ? "Password reset successfully"
              : "Failed to reset password",
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: "An error occurred",
          });
        }
      });
    }

    // Register main application routes - ONLY ONCE
    Logger.info("[MAIN] Registering application routes...");
    const httpServer = await registerRoutes(app);
    Logger.info("[MAIN] Routes registered successfully");

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      Logger.error("[ERROR]", err);
      res.status(status).json({ message });
    });

    // Setup frontend serving based on environment
    if (process.env.NODE_ENV === "production") {
      // Production: serve static files from dist/public
      const publicPath = path.resolve(process.cwd(), "dist/public");
      const distPath = path.resolve(process.cwd(), "dist");

      if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(publicPath, "index.html"));
          }
        });
        Logger.info(`[MAIN] Serving static files from ${publicPath}`);
      } else if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(distPath, "index.html"));
          }
        });
        Logger.info(`[MAIN] Serving static files from ${distPath}`);
      } else {
        Logger.warn(`[MAIN] Production mode but no dist folder found`);
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.json({
              message: "Clean & Flip API Server",
              status: "production",
              note: "Frontend build files not found - run 'npm run build'",
            });
          }
        });
      }
    } else {
      // Development: setup Vite dev server
      try {
        const viteModule = await import("./vite.js");
        await viteModule.setupVite(app, httpServer);
        Logger.info(`[MAIN] Vite development server initialized`);
      } catch (error) {
        Logger.warn(`[MAIN] Vite not available, serving fallback:`, error);

        // Fallback for development without Vite
        const clientPath = path.resolve(process.cwd(), "client");
        if (fs.existsSync(clientPath)) {
          app.use(express.static(clientPath));
          const indexPath = path.join(clientPath, "index.html");
          if (fs.existsSync(indexPath)) {
            app.get("*", (req, res) => {
              if (!req.path.startsWith("/api")) {
                res.sendFile(indexPath);
              }
            });
            Logger.info(`[MAIN] Serving client files from ${clientPath}`);
          }
        } else {
          app.get("*", (req, res) => {
            if (!req.path.startsWith("/api")) {
              res.json({
                message: "Clean & Flip API Server",
                status: "development",
                api: "operational",
              });
            }
          });
        }
      }
    }

    // Cleanup expired tokens periodically (every hour)
    const tokenCleanupInterval = setInterval(
      async () => {
        try {
          const deleted = await db.execute(
            sql`DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true`,
          );
          if (deleted.rowCount && deleted.rowCount > 0) {
            Logger.info(
              `[CLEANUP] Removed ${deleted.rowCount} expired password reset tokens`,
            );
          }
        } catch (error) {
          // Table might not exist, ignore
        }
      },
      60 * 60 * 1000,
    );

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      Logger.info(
        `[SHUTDOWN] ${signal} received, initiating graceful shutdown...`,
      );

      // Clear flag to prevent new instances
      (global as any).serverInstance = false;

      // Clear intervals
      clearInterval(tokenCleanupInterval);

      // Close HTTP server
      if (httpServer) {
        httpServer.close((err) => {
          if (err) {
            Logger.error("[SHUTDOWN] Error closing server:", err);
            process.exit(1);
          } else {
            Logger.info("[SHUTDOWN] Server closed successfully");
            process.exit(0);
          }
        });

        // Force exit after 10 seconds if graceful shutdown fails
        setTimeout(() => {
          Logger.error("[SHUTDOWN] Forced shutdown after timeout");
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("uncaughtException", (err) => {
      Logger.error("[FATAL] Uncaught exception:", err);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });
    process.on("unhandledRejection", (reason, promise) => {
      Logger.error(
        "[FATAL] Unhandled rejection at:",
        promise,
        "reason:",
        reason,
      );
      gracefulShutdown("UNHANDLED_REJECTION");
    });

    Logger.info(`[MAIN] ✅ Server setup completed successfully`);
    Logger.info(
      `[MAIN] 🚀 Server is running on port ${process.env.PORT || 5000}`,
    );
  } catch (error) {
    Logger.error("[MAIN] Server startup failed:", error);
    (global as any).serverInstance = false;
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  Logger.error("[FATAL] Failed to start server:", error);
  process.exit(1);
});
