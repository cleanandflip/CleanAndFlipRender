import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function analyzeDatabase() {
  console.log('🔍 DATABASE SYNC ANALYSIS');
  console.log('='.repeat(50));
  
  try {
    console.log('\n📊 CURRENT DATABASE STATUS:');
    
    // Get database info
    const dbInfo = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as postgres_version
    `);
    
    if (dbInfo.rows.length > 0) {
      console.log('✅ Database:', dbInfo.rows[0].database_name);
      console.log('✅ User:', dbInfo.rows[0].user_name);
    }
    
    // Check tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 AVAILABLE TABLES:');
    tables.rows.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.table_name}`);
    });
    
    // Check user data
    const userCount = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
    console.log(`\n👥 USERS: ${userCount.rows[0]?.total || 0}`);
    
    if (userCount.rows[0]?.total > 0) {
      const sampleUsers = await db.execute(sql`
        SELECT email, first_name, created_at::date as date_created
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('   Recent users:');
      sampleUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.first_name}) - ${user.date_created}`);
      });
    }
    
    // Check password reset tokens
    try {
      const tokenCount = await db.execute(sql`
        SELECT COUNT(*) as total FROM password_reset_tokens WHERE expires_at > NOW()
      `);
      console.log(`\n🔑 ACTIVE TOKENS: ${tokenCount.rows[0]?.total || 0}`);
    } catch (e) {
      console.log('\n🔑 PASSWORD RESET TOKENS: Table not found (will be created on first use)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RECOMMENDATIONS:');
    console.log('1. For TESTING: Use current database (has users)');
    console.log('2. For PRODUCTION: Either:');
    console.log('   a) Use SAME database URL in production');
    console.log('   b) Migrate data to production database');
    console.log('   c) Set up fresh production database');
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
  }
  
  process.exit(0);
}

analyzeDatabase();