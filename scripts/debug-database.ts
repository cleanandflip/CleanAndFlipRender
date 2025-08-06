import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function debug() {
  console.log('='.repeat(60));
  console.log('DATABASE DEBUG COMPREHENSIVE TEST');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing database connection...');
    const dbInfo = await db.execute(sql`SELECT current_database() as db, current_user as user, version() as ver`);
    console.log('Database:', dbInfo.rows[0].db);
    console.log('User:', dbInfo.rows[0].user);
    console.log('Version:', dbInfo.rows[0].ver.substring(0, 50) + '...');
    
    // Test 2: Count users
    console.log('\n2. Counting users...');
    const count = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
    console.log('Total users:', count.rows[0].total);
    
    // Test 3: List users
    console.log('\n3. Listing users...');
    const userList = await db.execute(sql`SELECT id, email, first_name FROM users ORDER BY created_at DESC LIMIT 10`);
    if (userList.rows.length === 0) {
      console.log('❌ NO USERS FOUND!');
    } else {
      console.log('✅ Found users:');
      userList.rows.forEach(u => console.log(`  - ${u.email} (${u.first_name || 'No name'})`));
    }
    
    // Test 4: Check specific emails
    console.log('\n4. Checking specific test emails...');
    const emails = ['cleanandflipyt@gmail.com', 'test3@gmail.com'];
    for (const email of emails) {
      const result = await db.execute(
        sql`SELECT id, email, first_name FROM users WHERE LOWER(TRIM(email)) = ${email.toLowerCase()}`
      );
      console.log(`  ${email}: ${result.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      if (result.rows.length > 0) {
        console.log(`    ID: ${result.rows[0].id}, Name: ${result.rows[0].first_name || 'N/A'}`);
      }
    }
    
    // Test 5: Test UserService query method
    console.log('\n5. Testing UserService findUserByEmail method...');
    const { UserService } = await import('../server/services/user.service');
    const userService = new UserService();
    
    for (const email of emails) {
      console.log(`\nTesting UserService with: ${email}`);
      const user = await userService.findUserByEmail(email);
      if (user) {
        console.log(`✅ UserService found: ${user.email} (ID: ${user.id})`);
      } else {
        console.log(`❌ UserService did not find: ${email}`);
      }
    }
    
    // Test 6: Password reset tokens
    console.log('\n6. Checking password reset tokens...');
    const tokens = await db.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens`);
    console.log('Total password reset tokens:', tokens.rows[0].count);
    
    const recentTokens = await db.execute(
      sql`SELECT user_id, LEFT(token, 20) as token_preview, used, created_at 
          FROM password_reset_tokens 
          WHERE created_at > NOW() - INTERVAL '1 day'
          ORDER BY created_at DESC 
          LIMIT 5`
    );
    
    if (recentTokens.rows.length > 0) {
      console.log('Recent tokens:');
      recentTokens.rows.forEach(t => {
        console.log(`  - ${t.token_preview}... (${t.used ? 'USED' : 'ACTIVE'}) - ${t.created_at}`);
      });
    }
    
    console.log('\n✅ Database diagnostics completed successfully');
    
  } catch (error) {
    console.error('\n🔥 DATABASE ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

debug();