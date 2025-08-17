import { env } from "./env";

export function assertProdDB() {
  if (env.APP_ENV !== "production") return;
  const url = new URL(env.DATABASE_URL);
  if (env.EXPECTED_DB_HOST && url.host !== env.EXPECTED_DB_HOST) {
    throw new Error(`[BOOT] Wrong DB host for prod: got ${url.host}, expected ${env.EXPECTED_DB_HOST}`);
  }
  if (url.protocol !== "postgres:") {
    throw new Error("[BOOT] DATABASE_URL must be postgres:// in prod");
  }
}