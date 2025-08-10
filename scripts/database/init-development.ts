import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Initialize Development Database
 * Creates test data for development work
 */
async function initializeDevelopment() {
  console.log('🛠️ INITIALIZING DEVELOPMENT DATABASE');
  console.log('='.repeat(65));
  
  const environment = getCurrentEnvironment();
  if (environment !== 'development') {
    console.error('❌ This script can only run in development environment');
    console.error('Set NODE_ENV=development or remove production flags');
    process.exit(1);
  }
  
  const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  if (!devUrl) {
    console.error('❌ DATABASE_URL_DEV must be set for development initialization');
    process.exit(1);
  }
  
  try {
    const sql = neon(devUrl);
    const db = drizzle(sql, { schema });
    
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected to development database');
    
    // Check if already initialized
    const existingUsers = await db.query.users.findMany();
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Development database already initialized');
      console.log(`   Users: ${existingUsers.length}`);
      
      const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
      console.log(`   Categories: ${categoryCount[0].count}`);
      console.log('✅ Development database verified');
      return;
    }
    
    console.log('🔧 Creating development test data...');
    
    // Create test developer user
    const hashedPassword = await bcrypt.hash('developer123', 10);
    const [developer] = await db.insert(schema.users).values({
      email: 'developer@cleanandflip.dev',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Developer',
      role: 'developer',
      street: '123 Test Street',
      city: 'Asheville',
      state: 'NC',
      zipCode: '28801'
    }).returning();
    
    console.log(`✅ Created test developer: ${developer.email}`);
    
    // Create test regular users
    const testUsers = [
      {
        email: 'user1@test.com',
        firstName: 'John',
        lastName: 'Local',
        zipCode: '28801' // Local Asheville
      },
      {
        email: 'user2@test.com',
        firstName: 'Jane',
        lastName: 'Remote',
        zipCode: '90210' // Non-local
      },
      {
        email: 'user3@test.com',
        firstName: 'Mike',
        lastName: 'Asheville',
        zipCode: '28806' // Local Asheville
      }
    ];
    
    for (const userData of testUsers) {
      const userPassword = await bcrypt.hash('user123', 10);
      await db.insert(schema.users).values({
        email: userData.email,
        password: userPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        street: '456 Example Ave',
        city: userData.zipCode.startsWith('288') ? 'Asheville' : 'Los Angeles',
        state: userData.zipCode.startsWith('288') ? 'NC' : 'CA',
        zipCode: userData.zipCode
      });
    }
    
    console.log(`✅ Created ${testUsers.length} test users`);
    
    // Create test categories
    const categories = [
      {
        name: 'Weight Plates',
        slug: 'weight-plates',
        description: 'Olympic and standard weight plates for strength training',
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Barbells',
        slug: 'barbells',
        description: 'Olympic barbells and specialty bars',
        displayOrder: 2,
        isActive: true
      },
      {
        name: 'Dumbbells',
        slug: 'dumbbells',
        description: 'Fixed and adjustable dumbbells',
        displayOrder: 3,
        isActive: true
      },
      {
        name: 'Racks & Stands',
        slug: 'racks-stands',
        description: 'Power racks, squat stands, and storage',
        displayOrder: 4,
        isActive: true
      },
      {
        name: 'Benches',
        slug: 'benches',
        description: 'Weight benches and workout benches',
        displayOrder: 5,
        isActive: true
      },
      {
        name: 'Cardio Equipment',
        slug: 'cardio',
        description: 'Treadmills, bikes, and cardio machines',
        displayOrder: 6,
        isActive: true
      }
    ];
    
    const createdCategories = await db.insert(schema.categories).values(categories).returning();
    console.log(`✅ Created ${createdCategories.length} test categories`);
    
    // Mark all data as test data in a metadata table if it exists
    await sql`
      INSERT INTO system_settings (key, value, description) 
      VALUES (
        'environment_type', 
        'development', 
        'This database contains test data for development'
      ) 
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `.catch(() => {
      // If system_settings table doesn't exist, that's okay
      console.log('Note: system_settings table not found, skipping environment marker');
    });
    
    // Verify initialization
    const finalCounts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM categories`,
      sql`SELECT COUNT(*) as count FROM users WHERE role = 'developer'`
    ]);
    
    console.log('\n📊 DEVELOPMENT INITIALIZATION COMPLETE:');
    console.log(`   Total Users: ${finalCounts[0][0].count}`);
    console.log(`   Categories: ${finalCounts[1][0].count}`);
    console.log(`   Developer Users: ${finalCounts[2][0].count}`);
    console.log(`   Database: ${new URL(devUrl).hostname}`);
    
    console.log('\n🎯 TEST CREDENTIALS:');
    console.log('   Developer: developer@cleanandflip.dev / developer123');
    console.log('   User 1:    user1@test.com / user123 (Local - 28801)');
    console.log('   User 2:    user2@test.com / user123 (Remote - 90210)');
    console.log('   User 3:    user3@test.com / user123 (Local - 28806)');
    
    console.log('\n✅ Development database ready for testing!');
    
  } catch (error) {
    console.error('❌ Development initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDevelopment().catch(console.error);
}

export default initializeDevelopment;