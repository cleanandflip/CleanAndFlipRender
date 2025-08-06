import { db } from '../server/db/index.js';
import { sql } from 'drizzle-orm';

async function verifySetup() {
  console.log('🔍 VERIFYING DATABASE SETUP\n');
  console.log('='.repeat(60));
  
  // Check current configuration
  console.log('📊 Current Configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  APP_URL: ${process.env.APP_URL || 'not set'}`);
  console.log(`  REPL_SLUG: ${process.env.REPL_SLUG || 'not in Replit'}`);
  
  // Check which database we're connected to
  const dbInfo = await db.execute(sql`
    SELECT current_database() as db_name,
           current_user as db_user
  `);
  
  console.log(`\n🗄️  Connected Database:`);
  console.log(`  Name: ${dbInfo.rows[0].db_name}`);
  console.log(`  User: ${dbInfo.rows[0].db_user}`);
  
  // Check data
  const counts = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM categories) as categories
  `);
  
  console.log(`\n📈 Database Contents:`);
  console.log(`  Users: ${counts.rows[0].users}`);
  console.log(`  Products: ${counts.rows[0].products}`);
  console.log(`  Categories: ${counts.rows[0].categories}`);
  
  // Test user lookup
  console.log('\n🧪 Testing User Lookup:');
  const testEmails = ['cleanandflipyt@gmail.com', 'test3@gmail.com'];
  
  for (const email of testEmails) {
    const user = await db.execute(sql`
      SELECT id, email 
      FROM users 
      WHERE LOWER(email) = ${email.toLowerCase()}
      LIMIT 1
    `);
    
    if (user.rows.length > 0) {
      console.log(`  ✅ ${email} - FOUND`);
    } else {
      console.log(`  ❌ ${email} - NOT FOUND`);
    }
  }
  
  // Determine which DB should be used
  const isProduction = process.env.NODE_ENV === 'production';
  const expectedDb = isProduction ? 'neondb' : 'development';
  const actualDb = dbInfo.rows[0].db_name;
  
  console.log('\n✅ Verification Results:');
  if (actualDb === expectedDb) {
    console.log(`  ✅ Correct database in use (${actualDb})`);
  } else {
    console.log(`  ⚠️ Wrong database! Expected ${expectedDb}, got ${actualDb}`);
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

verifySetup();