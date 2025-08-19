import { Pool } from "pg";

export type Branch = "dev" | "prod";

const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL; // Lucky-Poem
const prodUrl = process.env.PROD_DATABASE_URL;                           // Muddy-Moon

if (!devUrl) throw new Error("DEV_DATABASE_URL (or DATABASE_URL) missing");
if (!prodUrl) throw new Error("PROD_DATABASE_URL missing");

const devPool = new Pool({ connectionString: devUrl, max: 10 });
const prodPool = new Pool({ connectionString: prodUrl, max: 10 });

export function getPool(branch: Branch): Pool {
  return branch === "prod" ? prodPool : devPool;
}

// Helper to get DB info for logging
export function getBranchInfo(branch: Branch) {
  return {
    branch,
    name: branch === "prod" ? "Production (muddy-moon)" : "Development (lucky-poetry)",
    url: branch === "prod" ? "PROD_DATABASE_URL" : "DEV_DATABASE_URL"
  };
}