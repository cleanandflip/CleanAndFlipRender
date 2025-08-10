import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Seed Development Database with Test Data
 * Creates realistic test products and data for development
 */
async function seedDevelopment() {
  console.log('🌱 SEEDING DEVELOPMENT DATABASE');
  console.log('='.repeat(65));
  
  const environment = getCurrentEnvironment();
  if (environment !== 'development') {
    console.error('❌ This script can only run in development environment');
    console.error('Set NODE_ENV=development or remove production flags');
    process.exit(1);
  }
  
  const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  if (!devUrl) {
    console.error('❌ DATABASE_URL_DEV must be set for development seeding');
    process.exit(1);
  }
  
  try {
    const sql = neon(devUrl);
    const db = drizzle(sql, { schema });
    
    // Test connection
    await sql`SELECT 1 as test`;
    console.log('✅ Connected to development database');
    
    // Check if categories exist
    const categories = await db.query.categories.findMany();
    if (categories.length === 0) {
      console.error('❌ No categories found. Run init-development first.');
      process.exit(1);
    }
    
    // Check if products already exist
    const existingProducts = await db.query.products.findMany();
    if (existingProducts.length > 0) {
      console.log(`⚠️  Found ${existingProducts.length} existing products`);
      console.log('Skipping seeding to avoid duplicates');
      console.log('✅ Development database already seeded');
      return;
    }
    
    console.log('🔧 Creating test products...');
    
    // Sample products for each category
    const sampleProducts = [
      // Weight Plates
      {
        name: 'Olympic Weight Plate Set (45lbs)',
        description: 'Professional-grade Olympic weight plates. Cast iron construction with durable coating.',
        price: 12999, // $129.99
        category: categories.find(c => c.slug === 'weight-plates')?.id,
        condition: 'good',
        status: 'active',
        isFeatured: true,
        brand: 'Rogue Fitness',
        model: 'Olympic Cast Iron',
        tags: ['olympic', 'cast-iron', 'durable'],
        specifications: { weight: '45lbs', diameter: '17.7 inches', thickness: '1.5 inches' }
      },
      {
        name: 'Bumper Plate Set (25lbs pair)',
        description: 'Color-coded rubber bumper plates perfect for Olympic lifting.',
        price: 8999, // $89.99
        category: categories.find(c => c.slug === 'weight-plates')?.id,
        condition: 'excellent',
        status: 'active',
        brand: 'Rep Fitness',
        model: 'Color Bumper Plates',
        tags: ['bumper', 'olympic', 'rubber'],
        specifications: { weight: '25lbs each', material: 'rubber', color: 'red' }
      },
      
      // Barbells
      {
        name: 'Olympic Barbell (45lbs)',
        description: 'Standard 7-foot Olympic barbell with excellent knurling and rotating sleeves.',
        price: 24999, // $249.99
        category: categories.find(c => c.slug === 'barbells')?.id,
        condition: 'good',
        status: 'active',
        isFeatured: true,
        brand: 'American Barbell',
        model: 'Olympic Training Bar',
        tags: ['olympic', '45lbs', 'knurled'],
        specifications: { length: '7 feet', weight: '45lbs', diameter: '28mm' }
      },
      {
        name: 'Powerlifting Barbell (45lbs)',
        description: 'Heavy-duty powerlifting bar with aggressive knurling and high tensile strength.',
        price: 39999, // $399.99
        category: categories.find(c => c.slug === 'barbells')?.id,
        condition: 'excellent',
        status: 'active',
        brand: 'Eleiko',
        model: 'Powerlifting Bar',
        tags: ['powerlifting', 'competition', 'heavy-duty'],
        specifications: { tensileStrength: '190000 PSI', knurling: 'aggressive', coating: 'zinc' }
      },
      
      // Dumbbells
      {
        name: 'Adjustable Dumbbell Set (5-50lbs)',
        description: 'Space-saving adjustable dumbbells with quick-change system.',
        price: 19999, // $199.99
        category: categories.find(c => c.slug === 'dumbbells')?.id,
        condition: 'good',
        status: 'active',
        isFeatured: true,
        brand: 'Bowflex',
        model: 'SelectTech 552',
        tags: ['adjustable', 'space-saving', 'quick-change'],
        specifications: { range: '5-50lbs per dumbbell', system: 'dial adjustment' }
      },
      {
        name: 'Hex Dumbbell Set (10-50lbs)',
        description: 'Complete set of rubber hex dumbbells with contoured handles.',
        price: 89999, // $899.99
        category: categories.find(c => c.slug === 'dumbbells')?.id,
        condition: 'excellent',
        status: 'active',
        brand: 'CAP Barbell',
        model: 'Rubber Hex Dumbbells',
        tags: ['hex', 'rubber', 'complete-set'],
        specifications: { range: '10-50lbs', increment: '5lbs', coating: 'rubber' }
      },
      
      // Racks & Stands
      {
        name: 'Power Rack with Pull-up Bar',
        description: 'Heavy-duty power rack with safety bars and integrated pull-up station.',
        price: 79999, // $799.99
        category: categories.find(c => c.slug === 'racks-stands')?.id,
        condition: 'good',
        status: 'active',
        isFeatured: true,
        brand: 'Titan Fitness',
        model: 'T-3 Power Rack',
        tags: ['power-rack', 'safety-bars', 'pull-up'],
        specifications: { height: '83 inches', width: '49 inches', weight: '285lbs' }
      },
      {
        name: 'Squat Stand (pair)',
        description: 'Adjustable squat stands with J-hooks and safety pins.',
        price: 29999, // $299.99
        category: categories.find(c => c.slug === 'racks-stands')?.id,
        condition: 'good',
        status: 'active',
        brand: 'Rogue Fitness',
        model: 'SML-2 Squat Stand',
        tags: ['squat-stand', 'adjustable', 'j-hooks'],
        specifications: { heightRange: '22-72 inches', tubing: '3x3 steel', holes: '5/8 inch' }
      },
      
      // Benches
      {
        name: 'Adjustable Weight Bench',
        description: 'Multi-position weight bench with leg developer attachment.',
        price: 24999, // $249.99
        category: categories.find(c => c.slug === 'benches')?.id,
        condition: 'excellent',
        status: 'active',
        brand: 'REP Fitness',
        model: 'AB-3000',
        tags: ['adjustable', 'incline', 'decline'],
        specifications: { positions: '7 back positions', maxWeight: '1000lbs', pad: 'high-density' }
      },
      {
        name: 'Olympic Flat Bench',
        description: 'Heavy-duty flat bench designed for Olympic lifting.',
        price: 19999, // $199.99
        category: categories.find(c => c.slug === 'benches')?.id,
        condition: 'good',
        status: 'active',
        brand: 'American Barbell',
        model: 'Olympic Flat Bench',
        tags: ['flat-bench', 'olympic', 'heavy-duty'],
        specifications: { length: '48 inches', width: '12 inches', weight: '85lbs' }
      },
      
      // Cardio Equipment
      {
        name: 'Concept2 Model D Rower',
        description: 'Professional rowing machine used in CrossFit and rowing clubs worldwide.',
        price: 89999, // $899.99
        category: categories.find(c => c.slug === 'cardio')?.id,
        condition: 'excellent',
        status: 'active',
        isFeatured: true,
        brand: 'Concept2',
        model: 'Model D',
        tags: ['rowing', 'cardio', 'professional'],
        specifications: { monitor: 'PM5', resistance: 'air', flywheel: 'spiral damper' }
      }
    ];
    
    // Insert products
    const createdProducts = [];
    for (const product of sampleProducts) {
      if (product.category) {
        const [created] = await db.insert(schema.products).values(product).returning();
        createdProducts.push(created);
        console.log(`   ✅ Created: ${created.name}`);
      }
    }
    
    console.log(`\n✅ Created ${createdProducts.length} test products`);
    
    // Create some test orders and cart items
    console.log('\n🛒 Creating test orders...');
    
    const users = await db.query.users.findMany({ where: (users, { eq }) => eq(users.role, 'user') });
    
    if (users.length > 0) {
      // Create a test order
      const testUser = users[0];
      const testProduct = createdProducts[0];
      
      if (testProduct) {
        const [order] = await db.insert(schema.orders).values({
          userId: testUser.id,
          total: testProduct.price + 1500, // Add shipping
          status: 'completed',
          shippingCost: 1500,
          paymentIntentId: 'pi_test_' + Date.now()
        }).returning();
        
        await db.insert(schema.orderItems).values({
          orderId: order.id,
          productId: testProduct.id,
          quantity: 1,
          price: testProduct.price
        });
        
        console.log(`   ✅ Created test order for user: ${testUser.email}`);
      }
    }
    
    // Final verification
    const finalCounts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COUNT(*) as count FROM order_items`
    ]);
    
    console.log('\n📊 DEVELOPMENT SEEDING COMPLETE:');
    console.log(`   Products: ${finalCounts[0][0].count}`);
    console.log(`   Orders: ${finalCounts[1][0].count}`);
    console.log(`   Order Items: ${finalCounts[2][0].count}`);
    console.log(`   Database: ${new URL(devUrl).hostname}`);
    
    console.log('\n🎯 TEST DATA READY:');
    console.log('   - Browse products in the catalog');
    console.log('   - Test search functionality');
    console.log('   - Try cart and checkout flow');
    console.log('   - View orders in developer dashboard');
    
    console.log('\n✅ Development database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Development seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDevelopment().catch(console.error);
}

export default seedDevelopment;