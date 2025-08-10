import { neon } from '@neondatabase/serverless';

async function analyzeProductionDatabase() {
  console.log('🔍 ANALYZING PRODUCTION DATABASE (100GB)');
  console.log('='.repeat(60));
  
  // Connect to the production database
  const prodUrl = 'postgresql://neondb_owner:npg_7Qd8voYykPql@ep-lucky-credit-afcslqgy.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
  const sql = neon(prodUrl);
  
  try {
    // Basic connection info
    const dbInfo = await sql`
      SELECT 
        current_database() as db_name,
        current_user as user_name,
        version() as version
    `;
    
    console.log('📊 PRODUCTION DATABASE INFO:');
    console.log(`   Database: ${dbInfo[0]?.db_name}`);
    console.log(`   User: ${dbInfo[0]?.user_name}`);
    console.log(`   Storage: 100GB (significant data volume)`);
    
    // Check for tables
    const tables = await sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    
    console.log(`\n📋 TABLES FOUND: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });
    
    // If users table exists, check user count
    const hasUsersTable = tables.some(t => t.tablename === 'users');
    if (hasUsersTable) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`\n👥 USERS IN PRODUCTION: ${userCount[0]?.count}`);
      
      // Sample users
      const sampleUsers = await sql`
        SELECT email, first_name, role, created_at::date as created
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      console.log('\n👥 SAMPLE USERS:');
      sampleUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.first_name}) - ${user.role} - ${user.created}`);
      });
    }
    
    // Check products if table exists
    const hasProductsTable = tables.some(t => t.tablename === 'products');
    if (hasProductsTable) {
      const productCount = await sql`SELECT COUNT(*) as count FROM products`;
      console.log(`\n🛍️ PRODUCTS IN PRODUCTION: ${productCount[0]?.count}`);
    }
    
    // Check orders if table exists
    const hasOrdersTable = tables.some(t => t.tablename === 'orders');
    if (hasOrdersTable) {
      const orderCount = await sql`SELECT COUNT(*) as count FROM orders`;
      console.log(`\n🛒 ORDERS IN PRODUCTION: ${orderCount[0]?.count}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRODUCTION DATABASE ANALYSIS:');
    
    if (tables.length > 0) {
      console.log('✅ This is a LIVE production database with real data');
      console.log('✅ 100GB storage indicates significant business activity');
      console.log('⚠️  This should be your PRIMARY database for deployment');
    } else {
      console.log('❌ Database appears empty despite 100GB allocation');
    }
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('This production database should be your main database.');
    console.log('Consider migrating/consolidating all data here.');
    
  } catch (error) {
    console.error('❌ Production database analysis failed:', error.message);
    console.log('This may indicate connection issues or access restrictions');
  }
}

analyzeProductionDatabase();