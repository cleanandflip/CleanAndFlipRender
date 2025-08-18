// server/db.ts
import { DATABASE_URL } from "./config/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Simple database connection without schema to avoid circular references
const sql = neon(DATABASE_URL);
export const db = drizzle(sql);

// Optional simple health check
export async function ping() {
  // @ts-ignore drizzle neon-http allows raw sql via db.execute
  await db.execute("select 1");
}