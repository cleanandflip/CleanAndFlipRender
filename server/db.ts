import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws"; // Changed from { WebSocket } to default import
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

// Create or import Logger
class Logger {
  static info(...args: any[]) {
    console.log("[INFO]", ...args);
  }
  static error(...args: any[]) {
    console.error("[ERROR]", ...args);
  }
}

// Configure Neon WebSocket for Node.js environment
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
  neonConfig.pipelineConnect = false;
  neonConfig.useSecureWebSocket = true;
}

// Database connection logging
console.log("[DB] Initializing database connection...");
console.log("[DB] NODE_ENV:", process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  console.error("[DB] ❌ CRITICAL: DATABASE_URL is not set!");
  console.error(
    "[DB] Available env vars:",
    Object.keys(process.env)
      .filter(
        (k) =>
          !k.includes("SECRET") && !k.includes("KEY") && !k.includes("TOKEN"),
      )
      .join(", "),
  );
  throw new Error("DATABASE_URL environment variable is not set");
}

// Log database info
try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log("[DB] Connecting to host:", dbUrl.hostname);
  console.log("[DB] Database name:", dbUrl.pathname.substring(1));
} catch (e) {
  console.error("[DB] Invalid DATABASE_URL format");
}

// Pool configuration for production
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 20 : 5, // Less connections in dev
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

let pool = new Pool(poolConfig);

// Pool error handling
pool.on("error", (err: any) => {
  // Silent in production, log in development
  if (process.env.NODE_ENV !== "production") {
    Logger.error("Database pool error:", err.message);
  }

  // Recreate pool if connection terminated
  if (err.code === "57P01" || err.message?.includes("terminating connection")) {
    pool = new Pool(poolConfig);
  }
});

// Simple keep-alive for long-running connections
const keepAlive = async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
  } catch (error: any) {
    // Silent in production - Neon auto-disconnects are normal
    if (process.env.NODE_ENV !== "production") {
      console.log("[DB] Keep-alive ping failed (normal for serverless)");
    }
  }
};

// Keep-alive only in development (Neon handles this in production)
if (process.env.NODE_ENV !== "production") {
  setInterval(keepAlive, 5 * 60 * 1000); // Every 5 minutes
}

// Simplified retry wrapper
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;

      // Only retry on connection errors
      if (error.code === "57P01" || error.code === "ECONNRESET") {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error; // Don't retry other errors
    }
  }
  throw new Error("All retry attempts failed");
};

// Export pool and drizzle instance
export { pool };
export const db = drizzle(pool, { schema });

// Test connection on startup
db.execute(sql`SELECT current_database() as db, current_user as user`)
  .then((result) => {
    const info = result.rows[0];
    console.log("[DB] ✅ Database connected successfully");
    console.log(`[DB] Database: ${info.db}, User: ${info.user}`);
  })
  .catch((err) => {
    console.error("[DB] ❌ Database connection failed:", err.message);
  });

// Graceful shutdown
const shutdown = async () => {
  console.log("[DB] Closing database connections...");
  await pool.end();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
