import { env } from "./env";

export function assertProdDB() {
  if (env.APP_ENV !== "production") return;
  
  // Production requires PROD_DATABASE_URL only
  const dbUrl = env.PROD_DATABASE_URL;
  if (!dbUrl) {
    throw new Error("PROD_DATABASE_URL must be set for production environment");
  }
  
  const url = new URL(dbUrl);
  
  // Log database host for debugging
  console.log(`[GUARD] Production DB: ${url.host}`);
  
  // Ensure production database is not a development database
  if (url.host.includes('lingering-flower')) {
    throw new Error("Cannot use development database (lingering-flower) in production");
  }
  
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("PROD_DATABASE_URL must be postgres:// or postgresql:// in production");
  }
}