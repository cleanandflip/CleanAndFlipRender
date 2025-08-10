import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Complete Migration from Development to Production
 * Migrates ALL data: users, categories, products, orders, submissions
 */
async function migrateEverythingToProduction() {
  console.log('🚚 COMPLETE MIGRATION TO PRODUCTION');
  console.log('='.repeat(65));
  
  // Verify we have the required URLs
  const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  const prodUrl = process.env.DATABASE_URL_PROD;
  
  if (!devUrl || !prodUrl) {
    console.error('❌ Both DATABASE_URL and DATABASE_URL_PROD must be set');
    console.error('Current status:');
    console.error(`   DEV (DATABASE_URL):      ${devUrl ? 'Set' : 'Missing'}`);
    console.error(`   PROD (DATABASE_URL_PROD): ${prodUrl ? 'Set' : 'Missing'}`);
    console.error('\nAdd DATABASE_URL_PROD to your Replit Secrets');
    process.exit(1);
  }
  
  if (devUrl === prodUrl) {
    console.error('❌ Development and production URLs cannot be the same');
    process.exit(1);
  }
  
  // Safety check
  if (prodUrl.includes('lingering-flower')) {
    console.error('❌ CRITICAL: Production URL appears to be a development database!');
    console.error('Production URL should NOT contain "lingering-flower"');
    process.exit(1);
  }
  
  try {
    // Connect to both databases
    const devSql = neon(devUrl);
    const prodSql = neon(prodUrl);
    const devDb = drizzle(devSql, { schema });
    const prodDb = drizzle(prodSql, { schema });
    
    // Test connections
    await devSql`SELECT 1 as test`;
    await prodSql`SELECT 1 as test`;
    
    console.log('✅ Connected to both databases');
    console.log(`   DEV:  ${new URL(devUrl).hostname}`);
    console.log(`   PROD: ${new URL(prodUrl).hostname}`);
    
    // Check current state
    console.log('\n📊 Analyzing current data...');
    
    const devCounts = await Promise.all([
      devSql`SELECT COUNT(*) as count FROM users`,
      devSql`SELECT COUNT(*) as count FROM categories`,
      devSql`SELECT COUNT(*) as count FROM products`,
      devSql`SELECT COUNT(*) as count FROM orders`,
      devSql`SELECT COUNT(*) as count FROM equipment_submissions`
    ]);
    
    const prodCounts = await Promise.all([
      prodSql`SELECT COUNT(*) as count FROM users`,
      prodSql`SELECT COUNT(*) as count FROM categories`, 
      prodSql`SELECT COUNT(*) as count FROM products`,
      prodSql`SELECT COUNT(*) as count FROM orders`,
      prodSql`SELECT COUNT(*) as count FROM equipment_submissions`
    ]);
    
    console.log('\n   DEVELOPMENT DATABASE:');
    console.log(`     Users: ${devCounts[0][0].count}`);
    console.log(`     Categories: ${devCounts[1][0].count}`);
    console.log(`     Products: ${devCounts[2][0].count}`);
    console.log(`     Orders: ${devCounts[3][0].count}`);
    console.log(`     Submissions: ${devCounts[4][0].count}`);
    
    console.log('\n   PRODUCTION DATABASE (before migration):');
    console.log(`     Users: ${prodCounts[0][0].count}`);
    console.log(`     Categories: ${prodCounts[1][0].count}`);
    console.log(`     Products: ${prodCounts[2][0].count}`);
    console.log(`     Orders: ${prodCounts[3][0].count}`);
    console.log(`     Submissions: ${prodCounts[4][0].count}`);
    
    if (Number(prodCounts[0][0].count) > 0 || Number(prodCounts[2][0].count) > 0) {
      console.log('\n⚠️  Production database contains existing data!');
      console.log('This migration will ADD to existing data, not replace it.');
    }
    
    // Start migration
    console.log('\n🔄 Starting complete migration...');
    
    // 1. Migrate Categories
    console.log('\n1️⃣  Migrating categories...');
    const devCategories = await devDb.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.displayOrder)]
    });
    
    const categoryMapping: { [oldId: string]: string } = {};
    let categoriesMigrated = 0;
    
    for (const category of devCategories) {
      const existing = await prodDb.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.slug, category.slug)
      });
      
      if (existing) {
        console.log(`     ⚠️  Category '${category.name}' exists, using existing`);
        categoryMapping[category.id] = existing.id;
      } else {
        const [newCategory] = await prodDb.insert(schema.categories).values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: category.isActive
        }).returning();
        
        categoryMapping[category.id] = newCategory.id;
        categoriesMigrated++;
        console.log(`     ✅ Migrated: ${category.name}`);
      }
    }
    
    // 2. Migrate Users
    console.log('\n2️⃣  Migrating users...');
    const devUsers = await devDb.query.users.findMany();
    
    const userMapping: { [oldId: string]: string } = {};
    let usersMigrated = 0;
    
    for (const user of devUsers) {
      const existing = await prodDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, user.email)
      });
      
      if (existing) {
        console.log(`     ⚠️  User '${user.email}' exists, using existing`);
        userMapping[user.id] = existing.id;
      } else {
        const [newUser] = await prodDb.insert(schema.users).values({
          email: user.email,
          password: user.password, // Already hashed
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          street: user.street,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          latitude: user.latitude,
          longitude: user.longitude
        }).returning();
        
        userMapping[user.id] = newUser.id;
        usersMigrated++;
        console.log(`     ✅ Migrated: ${user.email} (${user.role})`);
      }
    }
    
    // 3. Migrate Products
    console.log('\n3️⃣  Migrating products...');
    const devProducts = await devDb.query.products.findMany();
    
    let productsMigrated = 0;
    const productMapping: { [oldId: string]: string } = {};
    
    for (const product of devProducts) {
      const existing = await prodDb.query.products.findFirst({
        where: (products, { and, eq }) => and(
          eq(products.name, product.name),
          eq(products.brand, product.brand || '')
        )
      });
      
      if (existing) {
        console.log(`     ⚠️  Product '${product.name}' exists, skipping`);
        productMapping[product.id] = existing.id;
      } else {
        const newCategoryId = product.categoryId ? categoryMapping[product.categoryId] : null;
        
        const [newProduct] = await prodDb.insert(schema.products).values({
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: newCategoryId,
          subcategory: product.subcategory,
          condition: product.condition,
          status: product.status,
          featured: product.featured,
          brand: product.brand,
          model: product.model,
          tags: product.tags,
          specifications: product.specifications,
          weight: product.weight,
          dimensions: product.dimensions,
          images: product.images,
          searchVector: product.searchVector
        }).returning();
        
        productMapping[product.id] = newProduct.id;
        productsMigrated++;
        console.log(`     ✅ Migrated: ${product.name}`);
      }
    }
    
    // 4. Migrate Orders
    console.log('\n4️⃣  Migrating orders...');
    const devOrders = await devDb.query.orders.findMany();
    
    let ordersMigrated = 0;
    const orderMapping: { [oldId: string]: string } = {};
    
    for (const order of devOrders) {
      const newUserId = userMapping[order.userId];
      if (!newUserId) {
        console.log(`     ⚠️  Order ${order.id} - user not found, skipping`);
        continue;
      }
      
      const [newOrder] = await prodDb.insert(schema.orders).values({
        userId: newUserId,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        paymentIntentId: order.paymentIntentId,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        trackingNumber: order.trackingNumber,
        notes: order.notes
      }).returning();
      
      orderMapping[order.id] = newOrder.id;
      ordersMigrated++;
      console.log(`     ✅ Migrated order: ${order.id} → ${newOrder.id}`);
    }
    
    // 5. Migrate Order Items
    console.log('\n5️⃣  Migrating order items...');
    const devOrderItems = await devDb.query.orderItems.findMany();
    
    let orderItemsMigrated = 0;
    
    for (const item of devOrderItems) {
      const newOrderId = orderMapping[item.orderId];
      const newProductId = productMapping[item.productId];
      
      if (!newOrderId || !newProductId) {
        console.log(`     ⚠️  Order item - missing references, skipping`);
        continue;
      }
      
      await prodDb.insert(schema.orderItems).values({
        orderId: newOrderId,
        productId: newProductId,
        quantity: item.quantity,
        price: item.price
      });
      
      orderItemsMigrated++;
      console.log(`     ✅ Migrated order item`);
    }
    
    // 6. Migrate Equipment Submissions
    console.log('\n6️⃣  Migrating equipment submissions...');
    const devSubmissions = await devDb.query.equipmentSubmissions.findMany();
    
    let submissionsMigrated = 0;
    
    for (const submission of devSubmissions) {
      const newUserId = userMapping[submission.userId];
      if (!newUserId) {
        console.log(`     ⚠️  Submission ${submission.id} - user not found, skipping`);
        continue;
      }
      
      await prodDb.insert(schema.equipmentSubmissions).values({
        userId: newUserId,
        name: submission.name,
        brand: submission.brand,
        category: submission.category,
        condition: submission.condition,
        description: submission.description,
        estimatedValue: submission.estimatedValue,
        images: submission.images,
        status: submission.status,
        notes: submission.notes,
        contactPreference: submission.contactPreference,
        phoneNumber: submission.phoneNumber,
        preferredContactTime: submission.preferredContactTime
      });
      
      submissionsMigrated++;
      console.log(`     ✅ Migrated submission: ${submission.name}`);
    }
    
    // Final verification
    console.log('\n📊 MIGRATION COMPLETE - Final counts:');
    
    const finalProdCounts = await Promise.all([
      prodSql`SELECT COUNT(*) as count FROM users`,
      prodSql`SELECT COUNT(*) as count FROM categories`,
      prodSql`SELECT COUNT(*) as count FROM products`,
      prodSql`SELECT COUNT(*) as count FROM orders`,
      prodSql`SELECT COUNT(*) as count FROM equipment_submissions`
    ]);
    
    console.log('\n   PRODUCTION DATABASE (after migration):');
    console.log(`     Users: ${finalProdCounts[0][0].count}`);
    console.log(`     Categories: ${finalProdCounts[1][0].count}`);
    console.log(`     Products: ${finalProdCounts[2][0].count}`);
    console.log(`     Orders: ${finalProdCounts[3][0].count}`);
    console.log(`     Submissions: ${finalProdCounts[4][0].count}`);
    
    console.log('\n   MIGRATION SUMMARY:');
    console.log(`     Categories migrated: ${categoriesMigrated}`);
    console.log(`     Users migrated: ${usersMigrated}`);
    console.log(`     Products migrated: ${productsMigrated}`);
    console.log(`     Orders migrated: ${ordersMigrated}`);
    console.log(`     Order items migrated: ${orderItemsMigrated}`);
    console.log(`     Submissions migrated: ${submissionsMigrated}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy your application using Replit Deploy');
    console.log('2. Test login with your existing developer account');
    console.log('3. Verify all products appear in the catalog');
    console.log('4. Check that the developer dashboard works');
    console.log('5. Continue development in your dev environment');
    
    console.log('\n✅ Complete migration successful!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEverythingToProduction().catch(console.error);
}

export default migrateEverythingToProduction;