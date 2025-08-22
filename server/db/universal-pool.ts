import { Pool } from "pg";
import { DATABASE_URL } from "../config/env";

declare global { 
	var __universalPgPool: Pool | undefined; 
}

function createPool(): Pool | undefined {
	if (!DATABASE_URL) return undefined;
	return new Pool({
		connectionString: DATABASE_URL,
		ssl: { rejectUnauthorized: false },
		max: 10,
		idleTimeoutMillis: 30_000,
		keepAlive: true,
	});
}

export const universalPool: Pool | undefined = global.__universalPgPool ?? createPool();

if (process.env.NODE_ENV !== "production" && universalPool) {
	global.__universalPgPool = universalPool;
}