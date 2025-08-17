import { env } from "./env";

export function assertProdDB() {
  if (env.APP_ENV !== "production") return;
  
  // Use PROD_DATABASE_URL for production, fallback to DATABASE_URL
  const dbUrl = env.PROD_DATABASE_URL || env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("PROD_DATABASE_URL or DATABASE_URL must be set for production environment");
  }
  
  const url = new URL(dbUrl);
  
  // Extract hostname from EXPECTED_DB_HOST if it's a full URL
  let expectedHost = env.EXPECTED_DB_HOST;
  if (expectedHost && expectedHost.startsWith('postgresql://')) {
    expectedHost = new URL(expectedHost).host;
  }
  
  // Log current vs expected for debugging
  console.log(`[GUARD] Current DB: ${url.host}, Expected: ${expectedHost || 'any'}`);
  
  // Only enforce host matching if EXPECTED_DB_HOST is set and we're in strict production mode
  if (expectedHost && url.host !== expectedHost && env.NODE_ENV === "production") {
    throw new Error(`Wrong DB host for prod: got ${url.host}, expected ${expectedHost}`);
  }
  
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Database URL must be postgres:// or postgresql:// in prod");
  }
}