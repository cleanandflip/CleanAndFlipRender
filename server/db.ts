// server/db.ts
import { ENV } from "./config/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let sql: any = null;
let dbInstance: any = null;

function ensureDb() {
  if (!dbInstance && ENV.devDbUrl) {
    sql = neon(ENV.devDbUrl);
    dbInstance = drizzle(sql);
  }
  return dbInstance;
}

export const db = ensureDb();

// Optional simple health check
export async function ping() {
  const database = ensureDb();
  if (!database) return; // No DB configured; treat as healthy for slate boot
  // @ts-ignore drizzle neon-http allows raw sql via db.execute
  await database.execute("select 1");
}