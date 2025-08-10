import { defineConfig } from "drizzle-kit";

// Production Drizzle Configuration
const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!prodUrl) {
  throw new Error("DATABASE_URL_PROD or DATABASE_URL must be set for database operations");
}

// Only enforce safety check if we're explicitly using DATABASE_URL_PROD
if (process.env.DATABASE_URL_PROD && prodUrl.includes('lingering-flower')) {
  throw new Error('CRITICAL: Cannot use development database for production operations!');
}

export default defineConfig({
  out: "./migrations/production",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: prodUrl,
  },
  verbose: true,
  strict: true,
});