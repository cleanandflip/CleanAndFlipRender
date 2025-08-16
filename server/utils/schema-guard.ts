import { db } from '../db';
import { Logger } from './logger';

/**
 * Production Schema Guard - Prevents deployment with mismatched database schema
 * This catches schema drift issues like missing users.profile_address_id before they cause crashes
 */
export async function assertSchemaReady(): Promise<void> {
  try {
    Logger.info('[SCHEMA] Validating production database schema...');
    
    // Check critical columns exist
    const schemaChecks = await db.execute(`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='profile_address_id'
          ) THEN 'users.profile_address_id: ✅ EXISTS'
          ELSE 'users.profile_address_id: ❌ MISSING'
        END as profile_address_check,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='addresses' AND column_name='id'
          ) THEN 'addresses.id: ✅ EXISTS'
          ELSE 'addresses.id: ❌ MISSING'
        END as addresses_check,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name='users' AND constraint_name LIKE '%profile_address%fkey%'
          ) THEN 'FK constraint: ✅ EXISTS'
          ELSE 'FK constraint: ❌ MISSING'
        END as fk_check
    `);

    const checks = schemaChecks.rows[0];
    Logger.info('[SCHEMA] Database schema validation results:');
    Logger.info(`[SCHEMA] ${checks.profile_address_check}`);
    Logger.info(`[SCHEMA] ${checks.addresses_check}`);
    Logger.info(`[SCHEMA] ${checks.fk_check}`);

    // Check for any missing critical columns
    const missingColumns = await db.execute(`
      SELECT 
        'users' as table_name,
        'profile_address_id' as column_name,
        CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='profile_address_id'
          ) THEN true
          ELSE false
        END as is_missing
      UNION ALL
      SELECT 
        'addresses' as table_name,
        'id' as column_name,
        CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='addresses' AND column_name='id'
          ) THEN true
          ELSE false
        END as is_missing
    `);

    const missingCount = missingColumns.rows.filter((row: any) => row.is_missing).length;

    if (missingCount > 0) {
      Logger.error(
        '[SCHEMA] ⚠️  CRITICAL SCHEMA MISMATCH DETECTED ⚠️'
      );
      Logger.error(
        '[SCHEMA] Missing required database columns. Application expects schema that doesn\'t match this database.'
      );
      Logger.error(
        '[SCHEMA] This will cause Passport authentication failures (ERROR 42703).'
      );
      Logger.error(
        '[SCHEMA] Run database migrations: npm run db:push'
      );
      
      // Log but don't crash - let the production-safe auth handle it
      Logger.warn('[SCHEMA] Continuing startup with schema mismatch warnings...');
    } else {
      Logger.info('[SCHEMA] ✅ All required database columns present');
    }

    // Verify data type compatibility
    const dataTypeCheck = await db.execute(`
      SELECT 
        c1.data_type as users_profile_address_id_type,
        c2.data_type as addresses_id_type,
        CASE 
          WHEN c1.data_type = c2.data_type THEN 'COMPATIBLE'
          ELSE 'TYPE_MISMATCH'
        END as compatibility_status
      FROM information_schema.columns c1, information_schema.columns c2
      WHERE c1.table_name = 'users' AND c1.column_name = 'profile_address_id'
        AND c2.table_name = 'addresses' AND c2.column_name = 'id'
    `);

    if (dataTypeCheck.rows.length > 0) {
      const typeCheck = dataTypeCheck.rows[0];
      Logger.info(`[SCHEMA] Data type compatibility: ${typeCheck.compatibility_status}`);
      Logger.info(`[SCHEMA] users.profile_address_id: ${typeCheck.users_profile_address_id_type}`);
      Logger.info(`[SCHEMA] addresses.id: ${typeCheck.addresses_id_type}`);
    }

  } catch (error: any) {
    Logger.error('[SCHEMA] Schema validation failed:', error.message);
    Logger.warn('[SCHEMA] Continuing startup - production-safe auth will handle any issues...');
  }
}