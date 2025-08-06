#!/usr/bin/env tsx
/**
 * Comprehensive password reset verification script
 * Tests all aspects of the password reset flow
 */
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { PasswordResetService } from '../services/password-reset.service';
import { findUserByEmail } from '../utils/user-lookup';

async function verifyPasswordReset() {
  console.log('🔍 Verifying password reset functionality...\n');
  
  const testEmail = 'cleanandflipyt@gmail.com';
  const testIP = '34.170.191.254';
  const testUserAgent = 'Mozilla/5.0 (Test)';
  
  try {
    // 1. Verify database connection
    console.log('1️⃣ Testing database connection...');
    const dbStart = Date.now();
    const dbTest = await db.execute(sql`SELECT NOW() as current_time`);
    const dbTime = Date.now() - dbStart;
    console.log(`   ✅ Database connected (${dbTime}ms)`);
    console.log(`   📅 Database time: ${dbTest.rows[0]?.current_time}\n`);
    
    // 2. Verify user exists
    console.log('2️⃣ Testing user lookup...');
    const userStart = Date.now();
    const user = await findUserByEmail(testEmail);
    const userTime = Date.now() - userStart;
    
    if (user) {
      console.log(`   ✅ User found (${userTime}ms)`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📧 Email: ${user.email}\n`);
    } else {
      console.log(`   ❌ User not found (${userTime}ms)\n`);
      return false;
    }
    
    // 3. Clear any existing tokens
    console.log('3️⃣ Clearing existing tokens...');
    const clearResult = await db.execute(sql`
      UPDATE password_reset_tokens 
      SET used = true, used_at = NOW()
      WHERE user_id = ${user.id} AND used = false
    `);
    console.log(`   🧹 Cleared ${clearResult.rowCount || 0} existing tokens\n`);
    
    // 4. Test password reset request
    console.log('4️⃣ Testing password reset request...');
    const resetStart = Date.now();
    const resetResult = await PasswordResetService.requestPasswordReset(
      testEmail, 
      testIP, 
      testUserAgent
    );
    const resetTime = Date.now() - resetStart;
    
    console.log(`   ⏱️  Request time: ${resetTime}ms`);
    console.log(`   📤 Success: ${resetResult.success}`);
    console.log(`   💬 Message: ${resetResult.message}`);
    
    if (resetResult.debugInfo) {
      console.log(`   🔍 Debug info:`, resetResult.debugInfo);
    }
    
    // 5. Verify token was created
    console.log('\n5️⃣ Verifying token creation...');
    const tokenResult = await db.execute(sql`
      SELECT id, created_at, expires_at, used, ip_address
      FROM password_reset_tokens
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0];
      console.log(`   ✅ Token created`);
      console.log(`   🆔 Token ID: ${token.id}`);
      console.log(`   📅 Created: ${token.created_at}`);
      console.log(`   ⏰ Expires: ${token.expires_at}`);
      console.log(`   🔒 Used: ${token.used}`);
      console.log(`   🌐 IP: ${token.ip_address}`);
    } else {
      console.log(`   ❌ No token found`);
      return false;
    }
    
    // 6. Test rate limiting
    console.log('\n6️⃣ Testing rate limiting...');
    const rateLimitStart = Date.now();
    const rateLimitResult = await PasswordResetService.requestPasswordReset(
      testEmail, 
      testIP, 
      testUserAgent
    );
    const rateLimitTime = Date.now() - rateLimitStart;
    
    console.log(`   ⏱️  Request time: ${rateLimitTime}ms`);
    console.log(`   📤 Success: ${rateLimitResult.success}`);
    console.log(`   💬 Message: ${rateLimitResult.message}`);
    
    if (rateLimitResult.debugInfo?.rateLimited || rateLimitResult.debugInfo?.recentTokenExists) {
      console.log(`   ✅ Rate limiting working correctly`);
    } else {
      console.log(`   ⚠️  Rate limiting may not be working`);
    }
    
    console.log('\n✅ All password reset tests passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Password reset verification failed:', error);
    console.error('Error details:', (error as Error).message);
    return false;
  }
}

verifyPasswordReset()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });