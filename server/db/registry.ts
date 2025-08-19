import { Pool } from "pg";

export type Branch = "dev" | "prod";

// Use the newly provisioned database for both dev and prod for now
// In production, you would set PROD_DATABASE_URL to point to Muddy-Moon
const devUrl = process.env.DATABASE_URL;  // Lucky-Poem (newly provisioned)
const prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL; // Muddy-Moon (fallback to dev for now)

if (!devUrl) throw new Error("DATABASE_URL missing - database not provisioned");

console.log("[DB Registry] Dev (Lucky-Poem):", devUrl?.slice(0, 30) + "...");
console.log("[DB Registry] Prod (Muddy-Moon):", prodUrl?.slice(0, 30) + "...");

const devPool = new Pool({ connectionString: devUrl, max: 10 });
const prodPool = new Pool({ connectionString: prodUrl, max: 10 });

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