import { Pool } from "pg";
import { ENV } from "../config/env";

export type Branch = "dev" | "prod";

console.log("[DB Registry] Dev host:", new URL(ENV.devDbUrl).host);
console.log("[DB Registry] Prod host:", new URL(ENV.prodDbUrl).host);

const devPool = new Pool({ connectionString: ENV.devDbUrl, max: 10 });
const prodPool = new Pool({ connectionString: ENV.prodDbUrl, max: 10 });

export function getPool(branch: Branch): Pool {
  return branch === "prod" ? prodPool : devPool;
}

// Health check function
export async function testConnection(branch: Branch): Promise<boolean> {
  try {
    const pool = getPool(branch);
    const result = await pool.query('SELECT 1 as test');
    return result.rows[0]?.test === 1;
  } catch (error) {
    console.error(`[DB Registry] ${branch} connection failed:`, error);
    return false;
  }
}