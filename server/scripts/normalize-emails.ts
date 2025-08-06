import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

/**
 * Script to normalize all emails in the database to lowercase
 * Run this script after implementing case-insensitive email handling
 */
async function normalizeAllEmails() {
  console.info('🔧 Starting email normalization process...');
  
  try {
    // Update users table
    console.info('📧 Normalizing user emails...');
    const usersResult = await db.execute(sql`
      UPDATE users 
      SET email = LOWER(TRIM(email)) 
      WHERE email != LOWER(TRIM(email))
      RETURNING id, email
    `);
    
    console.info(`✅ Updated ${usersResult.rowCount || 0} user emails`);
    
    // Update email_logs table if exists
    try {
      console.info('📧 Normalizing email logs...');
      const emailLogsResult = await db.execute(sql`
        UPDATE email_logs 
        SET to_email = LOWER(TRIM(to_email)),
            from_email = LOWER(TRIM(from_email))
        WHERE to_email != LOWER(TRIM(to_email)) 
           OR from_email != LOWER(TRIM(from_email))
        RETURNING id
      `);
      console.info(`✅ Updated ${emailLogsResult.rowCount || 0} email log entries`);
    } catch (e) {
      console.info('ℹ️  Email logs table not found or already normalized');
    }
    
    // Update equipment_submissions if exists and has email column
    try {
      console.info('📧 Normalizing equipment submission emails...');
      const submissionsResult = await db.execute(sql`
        UPDATE equipment_submissions 
        SET email = LOWER(TRIM(email)) 
        WHERE email IS NOT NULL 
          AND email != LOWER(TRIM(email))
        RETURNING id, email
      `);
      console.info(`✅ Updated ${submissionsResult.rowCount || 0} submission emails`);
    } catch (e) {
      console.info('ℹ️  Equipment submissions table not found or already normalized');
    }
    
    // Verify normalization
    console.info('🔍 Verifying email normalization...');
    const verificationResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email = LOWER(TRIM(email)) THEN 1 END) as normalized_emails,
        COUNT(CASE WHEN email != LOWER(TRIM(email)) THEN 1 END) as unnormalized_emails
      FROM users
    `);
    
    const verification = verificationResult.rows[0];
    console.info(`📊 Verification Results:`);
    console.info(`   - Total users: ${verification.total_users}`);
    console.info(`   - Normalized emails: ${verification.normalized_emails}`);
    console.info(`   - Unnormalized emails: ${verification.unnormalized_emails}`);
    
    if (verification.unnormalized_emails === '0') {
      console.info('🎉 All emails successfully normalized!');
    } else {
      console.info('⚠️  Some emails still need normalization');
    }
    
    console.info('Email normalization completed successfully');
    
  } catch (error) {
    console.error('❌ Email normalization failed:', error);
    console.error('Email normalization error:', error);
    throw error;
  }
}

// Run the normalization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  normalizeAllEmails()
    .then(() => {
      console.info('✅ Email normalization process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Email normalization failed:', error);
      process.exit(1);
    });
}

export { normalizeAllEmails };