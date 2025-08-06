import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function checkDatabases() {
  console.log('='.repeat(60));
  console.log('DATABASE COMPARISON AND VERIFICATION');
  console.log('='.repeat(60));
  
  // Check current database
  const currentUrl = process.env.DATABASE_URL;
  console.log('\n1. CURRENT DATABASE (REPLIT):');
  if (currentUrl) {
    try {
      const urlObj = new URL(currentUrl);
      console.log('Host:', urlObj.hostname);
      console.log('Database:', urlObj.pathname.substring(1));
      console.log('User:', urlObj.username);
    } catch (e) {
      console.log('Could not parse DATABASE_URL');
    }
  }
  
  const currentSql = neon(currentUrl!);
  const currentDb = drizzle(currentSql);
  
  try {
    // Test basic connection
    const dbInfo = await currentDb.execute(sql`SELECT current_database() as db, current_user as user`);
    console.log(`Connected to: ${dbInfo.rows[0].db} as ${dbInfo.rows[0].user}`);
    
    // Check users table
    const userCount = await currentDb.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`Users table: ✅ ${userCount.rows[0].count} users found`);
    
    // List sample users
    const sampleUsers = await currentDb.execute(sql`SELECT email FROM users LIMIT 3`);
    console.log('Sample users:', sampleUsers.rows.map(u => u.email).join(', '));
    
    // Check password_reset_tokens table
    try {
      const tokenCount = await currentDb.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens`);
      console.log(`Password reset tokens: ✅ Table exists with ${tokenCount.rows[0].count} tokens`);
      
      // Show table structure
      const tableInfo = await currentDb.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'password_reset_tokens' 
        ORDER BY ordinal_position
      `);
      console.log('Table structure:');
      tableInfo.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } catch (tokenError) {
      console.log('Password reset tokens: ❌ TABLE MISSING');
      console.log('Error:', tokenError.message);
    }
    
    // Check all tables in schema
    const allTables = await currentDb.execute(sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('\nAll tables in public schema:');
    allTables.rows.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
    // Check specific test users
    console.log('\n2. TESTING SPECIFIC USERS:');
    const testEmails = ['cleanandflipyt@gmail.com', 'test3@gmail.com'];
    for (const email of testEmails) {
      const user = await currentDb.execute(sql`
        SELECT id, email, first_name, role 
        FROM users 
        WHERE LOWER(TRIM(email)) = ${email.toLowerCase()}
      `);
      
      if (user.rows.length > 0) {
        console.log(`✅ ${email} - ID: ${user.rows[0].id}, Role: ${user.rows[0].role || 'user'}`);
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('Full error:', error);
  }
  
  // Check for production database differences
  const prodUrl = process.env.PRODUCTION_DATABASE_URL;
  if (prodUrl && prodUrl !== currentUrl) {
    console.log('\n3. PRODUCTION DATABASE (DIFFERENT):');
    console.log('Production URL exists and differs from current');
    
    try {
      const prodSql = neon(prodUrl);
      const prodDb = drizzle(prodSql);
      
      const prodUsers = await prodDb.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log(`Production users: ${prodUsers.rows[0].count}`);
      
      const prodTokens = await prodDb.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens`);
      console.log(`Production tokens table: ✅ ${prodTokens.rows[0].count} tokens`);
      
    } catch (prodError) {
      console.log('❌ Production database error:', prodError.message);
    }
  } else {
    console.log('\n3. PRODUCTION DATABASE: Using same as development');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATION:');
  console.log('For production deployment, ensure DATABASE_URL points to this working database');
  console.log('Current DATABASE_URL should be used in production environment variables');
  console.log('='.repeat(60));
}

checkDatabases().catch(console.error);