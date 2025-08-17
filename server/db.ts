// server/db.ts
import { env } from "./config/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  // The Neon driver automatically uses SSL and serverless pooling
  const sql = neon(env.DATABASE_URL);
  _db = drizzle(sql, { schema });
  return _db;
}

// For backward compatibility - export the database instance
export const db = getDb();

// Optional simple health check
export async function ping() {
  const db = getDb();
  const sql = neon(env.DATABASE_URL);
  await sql`SELECT 1`;
}