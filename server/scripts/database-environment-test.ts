#!/usr/bin/env tsx
/**
 * Test database environment and connectivity
 * Helps identify if different environments are using different databases
 */
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function testDatabaseEnvironment() {
  console.log('🔍 Testing database environment...\n');
  
  try {
    // Basic connection info
    console.log('📋 Environment Info:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.log('   Process PID:', process.pid);
    console.log('   Timestamp:', new Date().toISOString());
    
    // Database metadata
    console.log('\n🗃️  Database Metadata:');
    const dbInfo = await db.execute(sql`
      SELECT 
        version() as version,
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        NOW() as server_time
    `);
    
    const info = dbInfo.rows[0];
    console.log('   Version:', info.version);
    console.log('   Database:', info.database_name);
    console.log('   User:', info.user_name);
    console.log('   Server IP:', info.server_ip || 'Not available');
    console.log('   Server Port:', info.server_port || 'Not available');
    console.log('   Server Time:', info.server_time);
    
    // Users table analysis
    console.log('\n👥 Users Table Analysis:');
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email LIKE '%cleanandflipyt%' THEN 1 END) as cleanandflip_users,
        MIN(created_at) as oldest_user,
        MAX(created_at) as newest_user
      FROM users
    `);
    
    const stats = userStats.rows[0];
    console.log('   Total users:', stats.total_users);
    console.log('   CleanAndFlip users:', stats.cleanandflip_users);
    console.log('   Oldest user:', stats.oldest_user);
    console.log('   Newest user:', stats.newest_user);
    
    // Specific user test
    console.log('\n🔍 Specific User Test:');
    const specificUser = await db.execute(sql`
      SELECT id, email, created_at
      FROM users
      WHERE email = 'cleanandflipyt@gmail.com'
      LIMIT 1
    `);
    
    if (specificUser.rows.length > 0) {
      console.log('   ✅ User found:', specificUser.rows[0].email);
      console.log('   🆔 ID:', specificUser.rows[0].id);
      console.log('   📅 Created:', specificUser.rows[0].created_at);
    } else {
      console.log('   ❌ User NOT found');
      
      // Show similar emails
      const similarEmails = await db.execute(sql`
        SELECT email, created_at
        FROM users
        WHERE email ILIKE '%cleanandflip%'
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      if (similarEmails.rows.length > 0) {
        console.log('   📧 Similar emails found:');
        similarEmails.rows.forEach((row, index) => {
          console.log(`      ${index + 1}. ${row.email} (${row.created_at})`);
        });
      } else {
        console.log('   📧 No similar emails found');
      }
    }
    
    // Connection performance test
    console.log('\n⚡ Performance Test:');
    const tests = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await db.execute(sql`SELECT ${i + 1} as test_number`);
      const duration = Date.now() - start;
      tests.push(duration);
      console.log(`   Test ${i + 1}: ${duration}ms`);
    }
    
    const avgTime = tests.reduce((a, b) => a + b, 0) / tests.length;
    const maxTime = Math.max(...tests);
    const minTime = Math.min(...tests);
    
    console.log(`   📊 Average: ${avgTime.toFixed(1)}ms`);
    console.log(`   📊 Min: ${minTime}ms, Max: ${maxTime}ms`);
    
    if (avgTime > 200) {
      console.log('   ⚠️  High latency detected - database may be remote or overloaded');
    }
    
    console.log('\n✅ Database environment test completed');
    
  } catch (error) {
    console.error('❌ Database environment test failed:', error);
    console.error('Error details:', (error as Error).message);
    process.exit(1);
  }
}

testDatabaseEnvironment().catch(console.error);