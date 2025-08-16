import { db } from "../db";
import { sql } from "drizzle-orm";
import { Logger } from "../utils/logger";

/**
 * Production Schema Guard - Validates critical database schema requirements
 * Prevents production crashes due to missing columns or schema drift
 */
export async function validateSchemaOnStartup(): Promise<void> {
  Logger.info('[SCHEMA] Validating production database schema...');
  
  try {
    // Check if critical columns exist
    const criticalColumns = [
      { table: 'users', column: 'profile_address_id' },
      { table: 'products', column: 'featured' },
      { table: 'cart_items', column: 'owner_id' },
      { table: 'addresses', column: 'is_local' }
    ];

    for (const { table, column } of criticalColumns) {
      const result = await db.execute(sql`
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = ${table} AND column_name = ${column}
      `);
      
      if (!result.rowCount || result.rowCount === 0) {
        Logger.error(`[SCHEMA] ❌ CRITICAL: Missing column ${table}.${column} in current DATABASE_URL`);
        Logger.error(`[SCHEMA] Migrations have NOT been applied to this database.`);
        Logger.error(`[SCHEMA] Run: npm run drizzle:migrate`);
      } else {
        Logger.debug(`[SCHEMA] ✅ ${table}.${column} exists`);
      }
    }

    // Check critical indexes
    const criticalIndexes = [
      'idx_products_featured_status_updated',
      'idx_products_active_created',
      'users_email_unique'
    ];

    for (const indexName of criticalIndexes) {
      const result = await db.execute(sql`
        SELECT 1 FROM pg_indexes WHERE indexname = ${indexName}
      `);
      
      if (!result.rowCount || result.rowCount === 0) {
        Logger.warn(`[SCHEMA] ⚠️  Missing performance index: ${indexName}`);
      } else {
        Logger.debug(`[SCHEMA] ✅ Index ${indexName} exists`);
      }
    }

    // Check database version
    const versionResult = await db.execute(sql`SELECT version()`);
    const version = versionResult.rows[0]?.version || 'Unknown';
    
    if (version.includes('PostgreSQL 16')) {
      Logger.info('[SCHEMA] ✅ PostgreSQL 16.x detected (optimal)');
    } else {
      Logger.warn(`[SCHEMA] ⚠️  Database version: ${version} (consider PostgreSQL 16.x)`);
    }

    Logger.info('[SCHEMA] ✅ Schema validation completed');
    
  } catch (error: any) {
    Logger.error('[SCHEMA] ❌ Schema validation failed:', {
      message: error.message,
      code: error.code
    });
    
    // Don't crash - just warn loudly
    Logger.error('[SCHEMA] 🚨 PRODUCTION WARNING: Database schema validation failed');
    Logger.error('[SCHEMA] Application may encounter runtime errors if schema is misaligned');
  }
}

/**
 * Runtime schema safety check for specific operations
 */
export async function ensureColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND column_name = ${columnName}
    `);
    
    return (result.rowCount || 0) > 0;
  } catch (error) {
    Logger.error(`[SCHEMA] Failed to check column ${tableName}.${columnName}:`, error);
    return false;
  }
}