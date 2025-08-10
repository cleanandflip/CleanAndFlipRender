import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Initialize Production Database
 * Creates developer user, categories, and essential data
 */
async function initializeProduction() {
  console.log('🚀 INITIALIZING PRODUCTION DATABASE');
  console.log('='.repeat(65));
  
  const environment = getCurrentEnvironment();
  if (environment !== 'production') {
    console.error('❌ This script can only run in production environment');
    console.error('Set NODE_ENV=production or REPLIT_DEPLOYMENT=true');
    process.exit(1);
  }
  
  const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!prodUrl) {
    console.error('❌ DATABASE_URL_PROD must be set for production initialization');
    process.exit(1);
  }
  
  // Safety check: ensure we're not using dev database
  if (prodUrl.includes('lingering-flower')) {
    console.error('❌ CRITICAL: Cannot initialize development database in production mode!');
    process.exit(1);
  }
  
  const developerEmail = process.env.DEVELOPER_EMAIL;
  const developerPassword = process.env.DEVELOPER_PASSWORD;
  const developerFirstName = process.env.DEVELOPER_FIRST_NAME || 'Developer';
  const developerLastName = process.env.DEVELOPER_LAST_NAME || 'User';
  
  if (!developerEmail || !developerPassword) {
    console.error('❌ DEVELOPER_EMAIL and DEVELOPER_PASSWORD must be set');
    console.error('Add these to your Replit Secrets:');
    console.error('  DEVELOPER_EMAIL = your-email@example.com');
    console.error('  DEVELOPER_PASSWORD = your-secure-password');
    process.exit(1);
  }
  
  try {
    const sql = neon(prodUrl);
    const db = drizzle(sql, { schema });
    
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected to production database');
    
    // Check if already initialized
    const existingDeveloper = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, developerEmail)
    });
    
    if (existingDeveloper) {
      console.log('⚠️  Production database already initialized');
      console.log(`   Developer user exists: ${existingDeveloper.email}`);
      
      // Update verification
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
      
      console.log(`   Users: ${userCount[0].count}`);
      console.log(`   Categories: ${categoryCount[0].count}`);
      console.log('✅ Production database verified');
      return;
    }
    
    console.log('🔧 Initializing production data...');
    
    // Create developer user
    const hashedPassword = await bcrypt.hash(developerPassword, 12);
    const [developer] = await db.insert(schema.users).values({
      email: developerEmail,
      password: hashedPassword,
      firstName: developerFirstName,
      lastName: developerLastName,
      role: 'developer'
    }).returning();
    
    console.log(`✅ Created developer user: ${developer.email}`);
    
    // Create essential categories
    const categories = [
      {
        name: 'Weight Plates',
        slug: 'weight-plates',
        description: 'Olympic and standard weight plates',
        displayOrder: 1
      },
      {
        name: 'Barbells',
        slug: 'barbells',
        description: 'Olympic and standard barbells',
        displayOrder: 2
      },
      {
        name: 'Dumbbells',
        slug: 'dumbbells',
        description: 'Adjustable and fixed dumbbells',
        displayOrder: 3
      },
      {
        name: 'Racks & Stands',
        slug: 'racks-stands',
        description: 'Squat racks, power racks, and stands',
        displayOrder: 4
      },
      {
        name: 'Benches',
        slug: 'benches',
        description: 'Weight benches and workout benches',
        displayOrder: 5
      },
      {
        name: 'Cardio Equipment',
        slug: 'cardio',
        description: 'Treadmills, bikes, and cardio machines',
        displayOrder: 6
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Gym accessories and small equipment',
        displayOrder: 7
      }
    ];
    
    const createdCategories = await db.insert(schema.categories).values(categories).returning();
    console.log(`✅ Created ${createdCategories.length} product categories`);
    
    // Create essential database indexes for performance
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_price ON products(category_id, price)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_featured ON products(status, is_featured)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON orders(user_id, status)`;
    
    console.log('✅ Created performance indexes');
    
    // Verify initialization
    const finalCounts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users WHERE role = 'developer'`,
      sql`SELECT COUNT(*) as count FROM categories`,
      sql`SELECT COUNT(*) as count FROM pg_indexes WHERE tablename IN ('products', 'users', 'orders')`
    ]);
    
    console.log('\n📊 PRODUCTION INITIALIZATION COMPLETE:');
    console.log(`   Developer Users: ${finalCounts[0][0].count}`);
    console.log(`   Categories: ${finalCounts[1][0].count}`);
    console.log(`   Indexes: ${finalCounts[2][0].count}`);
    console.log(`   Database: ${new URL(prodUrl).hostname}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy your application to Replit');
    console.log('2. Test login with developer credentials');
    console.log('3. Add products through the developer dashboard');
    console.log('4. Configure Stripe for payments');
    
    console.log('\n✅ Production database ready for deployment!');
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeProduction().catch(console.error);
}

export default initializeProduction;