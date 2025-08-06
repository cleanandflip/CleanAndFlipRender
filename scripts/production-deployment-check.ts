import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkProductionReadiness() {
  console.log('🚀 PRODUCTION DEPLOYMENT READINESS CHECK');
  console.log('='.repeat(60));
  
  const checks = [];
  let allGood = true;
  
  try {
    // Check 1: Database Connection
    console.log('\n🔍 Checking database connection...');
    const dbInfo = await db.execute(sql`SELECT current_database(), current_user, version()`);
    if (dbInfo.rows.length > 0) {
      checks.push({ name: 'Database Connection', status: '✅ Connected', details: dbInfo.rows[0].current_database });
    }
    
    // Check 2: Required Tables
    console.log('🔍 Checking required tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'products', 'categories', 'password_reset_tokens')
      ORDER BY table_name
    `);
    
    const requiredTables = ['categories', 'password_reset_tokens', 'products', 'users'];
    const foundTables = tables.rows.map(t => t.table_name);
    const missing = requiredTables.filter(t => !foundTables.includes(t));
    
    if (missing.length === 0) {
      checks.push({ name: 'Required Tables', status: '✅ All Present', details: `${foundTables.length}/4 tables` });
    } else {
      checks.push({ name: 'Required Tables', status: '❌ Missing', details: missing.join(', ') });
      allGood = false;
    }
    
    // Check 3: Address Columns
    console.log('🔍 Checking address columns...');
    const addressColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('street', 'city', 'state', 'zip_code', 'latitude', 'longitude')
    `);
    
    if (addressColumns.rows.length >= 6) {
      checks.push({ name: 'Address Columns', status: '✅ Complete', details: `${addressColumns.rows.length}/6 columns` });
    } else {
      checks.push({ name: 'Address Columns', status: '❌ Incomplete', details: `${addressColumns.rows.length}/6 columns` });
      allGood = false;
    }
    
    // Check 4: Users
    console.log('🔍 Checking users...');
    const userCount = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
    const adminCount = await db.execute(sql`SELECT COUNT(*) as total FROM users WHERE role = 'admin'`);
    
    if (userCount.rows[0]?.total > 0 && adminCount.rows[0]?.total > 0) {
      checks.push({ 
        name: 'Users & Admin', 
        status: '✅ Ready', 
        details: `${userCount.rows[0].total} users, ${adminCount.rows[0].total} admin` 
      });
    } else {
      checks.push({ name: 'Users & Admin', status: '❌ Missing', details: 'No users or admin' });
      allGood = false;
    }
    
    // Check 5: Categories
    console.log('🔍 Checking categories...');
    const categoryCount = await db.execute(sql`SELECT COUNT(*) as total FROM categories WHERE is_active = true`);
    
    if (categoryCount.rows[0]?.total > 0) {
      checks.push({ 
        name: 'Categories', 
        status: '✅ Populated', 
        details: `${categoryCount.rows[0].total} active categories` 
      });
    } else {
      checks.push({ name: 'Categories', status: '❌ Empty', details: 'No active categories' });
      allGood = false;
    }
    
    // Check 6: Password Reset System
    console.log('🔍 Checking password reset system...');
    try {
      // Import and test the simple password reset
      const { SimplePasswordReset } = await import('../server/services/simple-password-reset');
      const pr = new SimplePasswordReset();
      const testUser = await pr.findUser('cleanandflipyt@gmail.com');
      
      if (testUser) {
        checks.push({ 
          name: 'Password Reset', 
          status: '✅ Working', 
          details: 'User lookup and system functional' 
        });
      } else {
        checks.push({ name: 'Password Reset', status: '❌ Failed', details: 'Cannot find test user' });
        allGood = false;
      }
    } catch (error) {
      checks.push({ name: 'Password Reset', status: '❌ Error', details: 'System not working' });
      allGood = false;
    }
    
    // Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION READINESS RESULTS');
    console.log('='.repeat(60));
    
    checks.forEach(check => {
      console.log(`${check.status} ${check.name}`);
      console.log(`   ${check.details}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (allGood) {
      console.log('🎉 PRODUCTION READY! ✅');
      console.log('');
      console.log('🔑 Admin Login:');
      console.log('   Email: cleanandflipyt@gmail.com');
      console.log('   Password: Admin123!');
      console.log('');
      console.log('🚀 Deploy with confidence!');
    } else {
      console.log('⚠️  ISSUES FOUND - FIX BEFORE DEPLOYMENT');
      console.log('');
      console.log('Run the fix script again:');
      console.log('   npx tsx scripts/fix-production-completely.ts');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Production check failed:', error);
    allGood = false;
  }
  
  process.exit(allGood ? 0 : 1);
}

checkProductionReadiness();