import { IS_PROD } from "./app-env";

// Use the current Replit database for now, and switch back to dual databases when needed
export function getDatabaseUrl() {
  return process.env.DATABASE_URL!;
}

// Export existing functions for compatibility
export const DATABASE_URL = process.env.DATABASE_URL!;
export const getDbHost = () => new URL(process.env.DATABASE_URL!).host;