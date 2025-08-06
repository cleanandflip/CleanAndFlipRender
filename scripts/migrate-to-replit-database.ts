import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createMigrationPlan() {
  console.log('🔄 MIGRATION TO REPLIT OFFICIAL DATABASE');
  console.log('='.repeat(70));
  
  try {
    // Current working database data
    console.log('📊 CURRENT WORKING DATABASE DATA:');
    
    const dataCounts = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM users`),
      db.execute(sql`SELECT COUNT(*) as count FROM products`),
      db.execute(sql`SELECT COUNT(*) as count FROM categories`),
      db.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens WHERE expires_at > NOW()`)
    ]);
    
    console.log(`   Users: ${dataCounts[0].rows[0]?.count} (including admin)`);
    console.log(`   Products: ${dataCounts[1].rows[0]?.count} (ready for sale)`);
    console.log(`   Categories: ${dataCounts[2].rows[0]?.count}`);
    console.log(`   Active Password Resets: ${dataCounts[3].rows[0]?.count}`);
    
    // Sample users to confirm we have real data
    const sampleUsers = await db.execute(sql`
      SELECT email, first_name, role, created_at::date as created
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n👥 SAMPLE USERS TO MIGRATE:');
    sampleUsers.rows.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.first_name}) - ${user.role} - ${user.created}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 MIGRATION PLAN TO REPLIT OFFICIAL DATABASE:');
    console.log('\n📋 WHAT YOU NEED TO DO:');
    
    console.log('\n1️⃣ BACKUP CURRENT DATA (SAFETY):');
    console.log('   - Run: npm run db:export (if available)');
    console.log('   - Or use pg_dump to backup current database');
    console.log('   - This ensures we can restore if needed');
    
    console.log('\n2️⃣ PREPARE REPLIT OFFICIAL DATABASE:');
    console.log('   - Update your .env DATABASE_URL to use Replit\'s database');
    console.log('   - From: ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech');
    console.log('   - To: ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech (from your secrets)');
    
    console.log('\n3️⃣ MIGRATE SCHEMA AND DATA:');
    console.log('   - Run: npm run db:push (to create tables in official database)');
    console.log('   - Export users, products, categories from current database');
    console.log('   - Import into official Replit database');
    
    console.log('\n4️⃣ UPDATE ENVIRONMENT:');
    console.log('   - Your Replit secrets already point to official database');
    console.log('   - Just need to update local .env to match');
    
    console.log('\n5️⃣ VERIFY MIGRATION:');
    console.log('   - Test login with cleanandflipyt@gmail.com');
    console.log('   - Verify password reset works');
    console.log('   - Check that all products are visible');
    
    console.log('\n6️⃣ CLEANUP:');
    console.log('   - Delete old working database (ep-round-silence-aeetk60u-pooler)');
    console.log('   - Keep only Replit official database');
    
    console.log('\n⚠️  WHAT WILL CHANGE:');
    console.log('   ❌ DELETE: ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech');
    console.log('   ❌ DELETE: ep-lucky-credit-afc4egyc-2.us-west-2.aws.neon.tech');
    console.log('   ✅ KEEP: ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech (official Replit)');
    
    console.log('\n🚀 RESULT:');
    console.log('   - One official Replit-managed database');
    console.log('   - All your data migrated safely');
    console.log('   - Aligned with Replit\'s database management');
    console.log('   - Ready for production deployment');
    
  } catch (error) {
    console.error('❌ Migration planning failed:', error);
  }
  
  process.exit(0);
}

createMigrationPlan();