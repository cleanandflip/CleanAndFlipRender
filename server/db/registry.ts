import { Pool } from 'pg';
import { ENV } from '../config/env';

export type Branch = "dev" | "prod";

try { console.log("[DB Registry] Dev host:", ENV.devDbUrl ? new URL(ENV.devDbUrl).host : 'unconfigured'); } catch {}
try { console.log("[DB Registry] Prod host:", ENV.prodDbUrl ? new URL(ENV.prodDbUrl).host : 'unconfigured'); } catch {}

const devPool = ENV.devDbUrl ? new Pool({ connectionString: ENV.devDbUrl, max: 10 }) : undefined as any;
const prodPool = ENV.prodDbUrl ? new Pool({ connectionString: ENV.prodDbUrl, max: 10 }) : undefined as any;

export type BranchPool = ReturnType<typeof createPoolForBranch>;

function createPoolForBranch(branch: Branch) {
	if (branch === 'dev') return devPool;
	return prodPool;
}

export function getPool(branch: Branch) {
	const pool = createPoolForBranch(branch);
	if (!pool) throw new Error(`Database URL not configured for ${branch}`);
	return pool;
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