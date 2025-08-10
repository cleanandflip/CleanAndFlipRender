import { defineConfig } from "drizzle-kit";

// Production Drizzle Configuration
const prodUrl = process.env.DATABASE_URL_PROD;

if (!prodUrl) {
  throw new Error("DATABASE_URL_PROD must be set for production database operations");
}

// Safety check: ensure we're not using dev database
if (prodUrl.includes('lingering-flower')) {
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