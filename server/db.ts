// server/db.ts
import { DATABASE_URL } from "./config/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  // Use the environment-aware database URL
  const sql = neon(DATABASE_URL);
  _db = drizzle(sql, { schema });
  return _db;
}

// For backward compatibility - export the database instance
export const db = getDb();

// Optional simple health check
export async function ping() {
  const db = getDb();
  // @ts-ignore drizzle neon-http allows raw sql via db.execute
  await db.execute("select 1");
}