import { sql } from 'drizzle-orm';
import { db } from '../db';
import { Logger } from '../utils/logger';

// Cache for table columns to avoid repeated queries
const tableColumnsCache = new Map<string, Set<string>>();

/**
 * Get actual columns that exist in a database table
 */
export async function getTableColumns(tableName: string): Promise<Set<string>> {
  // Check cache first
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName)!;
  }

  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      AND table_schema = 'public'
    `);
    
    const columns = new Set(result.rows.map(row => row.column_name as string));
    tableColumnsCache.set(tableName, columns);
    
    return columns;
  } catch (error) {
    Logger.error(`Failed to get columns for table ${tableName}:`, error);
    return new Set();
  }
}

/**
 * Build a safe select object that only includes existing columns
 */
export async function buildSafeSelect(
  tableName: string,
  desiredColumns: Record<string, any>
): Promise<Record<string, any>> {
  const existingColumns = await getTableColumns(tableName);
  const safeSelect: Record<string, any> = {};
  
  for (const [alias, column] of Object.entries(desiredColumns)) {
    // Extract column name from the column object
    const columnName = column.name || alias;
    
    if (existingColumns.has(columnName)) {
      safeSelect[alias] = column;
    } else {
      Logger.warn(`Column '${columnName}' does not exist in table '${tableName}', skipping...`);
    }
  }
  
  return safeSelect;
}

/**
 * Clear the columns cache (useful after migrations)
 */
export function clearColumnsCache(tableName?: string) {
  if (tableName) {
    tableColumnsCache.delete(tableName);
  } else {
    tableColumnsCache.clear();
  }
}

/**
 * Validate database schema on startup
 */
export async function validateDatabaseSchema(): Promise<void> {
  Logger.info('🔍 Validating database schema...');
  
  try {
    const productColumns = await getTableColumns('products');
    const requiredColumns = ['id', 'name', 'price', 'categoryId'];
    const missingRequired = requiredColumns.filter(col => !productColumns.has(col));
    
    if (missingRequired.length > 0) {
      Logger.error(`❌ Missing required columns in products table: ${missingRequired.join(', ')}`);
    } else {
      Logger.info('✅ Database schema validation passed');
    }
    
    // Log optional missing columns
    const optionalColumns = ['subcategory', 'brand', 'weight', 'dimensions'];
    const missingOptional = optionalColumns.filter(col => !productColumns.has(col));
    
    if (missingOptional.length > 0) {
      Logger.warn(`⚠️  Missing optional columns: ${missingOptional.join(', ')}`);
      Logger.warn('   These columns exist in schema but may need migration verification');
    }
  } catch (error) {
    Logger.error('Schema validation error:', error);
  }
}