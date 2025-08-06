import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from './logger';

/**
 * Find user by email with multiple fallback strategies
 */
export async function findUserByEmail(email: string): Promise<any | null> {
  if (!email) return null;
  
  // Multiple normalization strategies
  const normalizations = [
    email.toLowerCase().trim(),                    // Standard normalization
    email.trim(),                                  // Case-sensitive trim
    email.toLowerCase(),                           // Just lowercase
    email,                                         // Exact as provided
    email.replace(/\s+/g, ''),                    // Remove all spaces
    email.toLowerCase().replace(/\s+/g, ''),      // Lowercase + remove spaces
  ];
  
  // Remove duplicates
  const uniqueEmails = Array.from(new Set(normalizations));
  
  Logger.info('[DEBUG] Trying email variations:', uniqueEmails);
  
  for (const emailVariant of uniqueEmails) {
    try {
      const queryStart = Date.now();
      // Try raw SQL first (most reliable)
      const result = await db.execute(sql`
        SELECT id, email, first_name, last_name, password, role, created_at
        FROM users
        WHERE email = ${emailVariant}
        LIMIT 1
      `);
      const queryTime = Date.now() - queryStart;
      
      if (result.rows.length > 0) {
        Logger.info(`[DEBUG] User found with email variant: ${emailVariant} (${queryTime}ms)`);
        return result.rows[0];
      } else {
        Logger.info(`[DEBUG] No match for variant: ${emailVariant} (${queryTime}ms)`);
      }
    } catch (error) {
      Logger.error(`[DEBUG] Query error for variant: ${emailVariant}`, (error as Error).message);
    }
  }
  
  // If still not found, try case-insensitive search
  try {
    const caseInsensitiveStart = Date.now();
    const result = await db.execute(sql`
      SELECT id, email, first_name, last_name, password, role, created_at
      FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(${email}))
      LIMIT 1
    `);
    const caseInsensitiveTime = Date.now() - caseInsensitiveStart;
    
    if (result.rows.length > 0) {
      Logger.info(`[DEBUG] User found with case-insensitive search (${caseInsensitiveTime}ms)`);
      return result.rows[0];
    } else {
      Logger.info(`[DEBUG] No match with case-insensitive search (${caseInsensitiveTime}ms)`);
    }
  } catch (error) {
    Logger.error('[DEBUG] Case-insensitive search error:', (error as Error).message);
  }
  
  // Last resort: partial match (dangerous but helps debug)
  if (process.env.NODE_ENV === 'development') {
    try {
      const result = await db.execute(sql`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE email ILIKE ${`%${email.trim()}%`}
        LIMIT 5
      `);
      
      if (result.rows.length > 0) {
        Logger.info('[DEBUG] Partial matches found:', result.rows.map(r => r.email));
      }
    } catch (error) {
      Logger.error('[DEBUG] Partial match error:', (error as Error).message);
    }
  }
  
  return null;
}

/**
 * Debug function to list all user emails
 */
export async function debugListEmails(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT email, LENGTH(email) as len, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    return result.rows.map(r => `${r.email} (length: ${r.len})`);
  } catch (error) {
    Logger.error('[DEBUG] Error listing emails:', error);
    return [];
  }
}