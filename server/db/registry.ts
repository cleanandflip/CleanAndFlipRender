import { Pool } from "pg";

const ssl =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

type Branch = "dev" | "prod";

const pools: Record<Branch, Pool> = {
  dev: new Pool({ connectionString: process.env.DEV_DATABASE_URL!, ssl }),
  prod: new Pool({ connectionString: process.env.PROD_DATABASE_URL!, ssl }),
};

export function getPool(branch: Branch) {
  return pools[branch];
}

export type { Branch };