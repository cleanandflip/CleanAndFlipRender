// server/db.ts
import { env } from "./config/env";
import { getDatabaseConfig } from "./config/database";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  // Get the correct database URL based on environment
  const dbConfig = getDatabaseConfig();
  const sql = neon(dbConfig.url);
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