import { Pool } from "@neondatabase/serverless";

type Branch = "dev" | "prod";

const pools: Record<Branch, Pool> = {
  dev: new Pool({ connectionString: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL }),
  prod: new Pool({ connectionString: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL }),
};

export function getPool(branch: Branch) {
  return pools[branch];
}

export type { Branch };