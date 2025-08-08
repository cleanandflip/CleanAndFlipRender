#!/usr/bin/env tsx
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 40) + '...');
  
  try {
    // Test basic connection
    const start = Date.now();
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as db_version`);
    const connectionTime = Date.now() - start;
    
    console.log('✅ Database connection successful');
    console.log('⏱️  Connection time:', connectionTime + 'ms');
    console.log('📅 Database time:', result.rows[0]?.current_time);
    console.log('🗃️  Database version:', result.rows[0]?.db_version);
    
    // Test user lookup specifically
    const userStart = Date.now();
    const userResult = await db.execute(sql`
      SELECT id, email, created_at 
      FROM users 
      WHERE email = 'cleanandflipyt@gmail.com'
      LIMIT 1
    `);
    const userTime = Date.now() - userStart;
    
    console.log('\n👤 User lookup test:');
    console.log('⏱️  Query time:', userTime + 'ms');
    console.log('📧 User found:', userResult.rows.length > 0 ? 'YES' : 'NO');
    
    if (userResult.rows.length > 0) {
      console.log('🆔 User ID:', userResult.rows[0].id);
      console.log('📧 Email:', userResult.rows[0].email);
      console.log('📅 Created:', userResult.rows[0].created_at);
    }
    
    // Test connection pool
    const poolStart = Date.now();
    await Promise.all([
      db.execute(sql`SELECT 1`),
      db.execute(sql`SELECT 2`),
      db.execute(sql`SELECT 3`),
      db.execute(sql`SELECT 4`),
      db.execute(sql`SELECT 5`)
    ]);
    const poolTime = Date.now() - poolStart;
    
    console.log('\n⚡ Connection pool test:');
    console.log('⏱️  5 concurrent queries:', poolTime + 'ms');
    
    console.log('\n✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Error details:', (error as Error).message);
    process.exit(1);
  }
}

testDatabaseConnection().catch(console.error);