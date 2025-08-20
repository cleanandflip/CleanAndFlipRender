import { Pool } from "pg";
import { DATABASE_URL } from "../config/env";

declare global { 
  var __universalPgPool: Pool | undefined; 
}

export const universalPool = global.__universalPgPool ?? new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
});

if (process.env.NODE_ENV !== "production") {
  global.__universalPgPool = universalPool;
}