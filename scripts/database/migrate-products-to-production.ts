import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Migrate Products from Development to Production
 * Copies real products and categories to production database
 */
async function migrateProductsToProduction() {
  console.log('🚚 MIGRATING PRODUCTS TO PRODUCTION');
  console.log('='.repeat(65));
  
  // Verify we're running in the right context
  const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  const prodUrl = process.env.DATABASE_URL_PROD;
  
  if (!devUrl || !prodUrl) {
    console.error('❌ Both DATABASE_URL_DEV and DATABASE_URL_PROD must be set');
    console.error('Current status:');
    console.error(`   DEV:  ${devUrl ? 'Set' : 'Missing'}`);
    console.error(`   PROD: ${prodUrl ? 'Set' : 'Missing'}`);
    process.exit(1);
  }
  
  if (devUrl === prodUrl) {
    console.error('❌ Development and production URLs cannot be the same');
    process.exit(1);
  }
  
  // Safety check
  if (prodUrl.includes('lingering-flower')) {
    console.error('❌ CRITICAL: Production URL appears to be a development database!');
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
    
    // Get development data
    console.log('\n📦 Reading development data...');
    
    const devCategories = await devDb.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.displayOrder)]
    });
    
    const devProducts = await devDb.query.products.findMany({
      where: (products, { eq }) => eq(products.status, 'active')
    });
    
    console.log(`   Categories: ${devCategories.length}`);
    console.log(`   Active Products: ${devProducts.length}`);
    
    // Check if production already has data
    const prodCategories = await prodDb.query.categories.findMany();
    const prodProducts = await prodDb.query.products.findMany();
    
    if (prodCategories.length > 0 || prodProducts.length > 0) {
      console.log('\n⚠️  Production database already contains data:');
      console.log(`   Categories: ${prodCategories.length}`);
      console.log(`   Products: ${prodProducts.length}`);
      console.log('\nDo you want to proceed? This will add to existing data.');
      // In a real implementation, you'd want user confirmation here
    }
    
    console.log('\n🔄 Migrating categories...');
    
    // Migrate categories (skip if they already exist)
    const categoryMapping: { [oldId: string]: string } = {};
    
    for (const category of devCategories) {
      // Check if category already exists
      const existing = await prodDb.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.slug, category.slug)
      });
      
      if (existing) {
        console.log(`   ⚠️  Category '${category.name}' already exists, using existing`);
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
        console.log(`   ✅ Migrated category: ${category.name}`);
      }
    }
    
    console.log('\n🏷️  Migrating products...');
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const product of devProducts) {
      // Check if product already exists (by name and brand)
      const existing = await prodDb.query.products.findFirst({
        where: (products, { and, eq }) => and(
          eq(products.name, product.name),
          eq(products.brand, product.brand)
        )
      });
      
      if (existing) {
        console.log(`   ⚠️  Product '${product.name}' already exists, skipping`);
        skippedCount++;
        continue;
      }
      
      // Map category ID
      const newCategoryId = product.categoryId ? categoryMapping[product.categoryId] : null;
      
      await prodDb.insert(schema.products).values({
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
        images: product.images
      });
      
      migratedCount++;
      console.log(`   ✅ Migrated product: ${product.name} (${product.brand})`);
    }
    
    // Final verification
    const finalProdCategories = await prodDb.query.categories.findMany();
    const finalProdProducts = await prodDb.query.products.findMany();
    
    console.log('\n📊 MIGRATION COMPLETE:');
    console.log(`   Categories in production: ${finalProdCategories.length}`);
    console.log(`   Products in production: ${finalProdProducts.length}`);
    console.log(`   Products migrated: ${migratedCount}`);
    console.log(`   Products skipped: ${skippedCount}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy your application to production');
    console.log('2. Test the production site');
    console.log('3. Verify all products appear correctly');
    console.log('4. Continue development in dev environment');
    
    console.log('\n✅ Product migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProductsToProduction().catch(console.error);
}

export default migrateProductsToProduction;