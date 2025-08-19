import { Pool } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../config/database";
import { IS_PROD } from "../config/app-env";

type Branch = "dev" | "prod";

const pools: Record<Branch, Pool> = {
  dev: new Pool({ connectionString: process.env.DEV_DATABASE_URL || getDatabaseUrl() }),
  prod: new Pool({ connectionString: process.env.PROD_DATABASE_URL || getDatabaseUrl() }),
};

export function getPool(branch: Branch) {
  return pools[branch];
}

export type { Branch };