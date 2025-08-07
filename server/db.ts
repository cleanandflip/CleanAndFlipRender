import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';

// For development, use a mock database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/cleanflip_dev';

const sql = neon(connectionString);
export const db = drizzle(sql);

export default db;