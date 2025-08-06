import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

// Database connection - SIMPLE VERSION
console.log("[DB] Initializing database connection...");

if (!process.env.DATABASE_URL) {
  console.error("[DB] ❌ DATABASE_URL is not set!");
  throw new Error("DATABASE_URL environment variable is not set");
}

// Log connection info
try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log("[DB] Connecting to:", dbUrl.hostname);
} catch (e) {
  console.error("[DB] Invalid DATABASE_URL format");
}

// Create simple Neon HTTP client (NO WEBSOCKET!)
const client = neon(process.env.DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Test connection
db.execute(sql`SELECT 1`)
  .then(() => console.log("[DB] ✅ Database connected"))
  .catch((err) => console.error("[DB] ❌ Connection failed:", err.message));

// Simple retry wrapper (optional)
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Operation failed after retries");
};
