// Simple test script to sync products to Stripe
import { db } from './server/db/index.js';
import { products } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

async function syncProductToStripe(productId) {
  try {
    console.log(`Syncing product ${productId}...`);
    
    // Get product data
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      console.log(`Product ${productId} not found`);
      return;
    }

    console.log(`Found product: ${product.name}`);

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description || `${product.brand || ''} weightlifting equipment`,
      images: product.images?.map(img => img.url).filter(Boolean) || [],
      active: product.stockQuantity > 0,
      metadata: {
        product_id: product.id,
        brand: product.brand || '',
        condition: product.condition || '',
        sku: product.sku || '',
      },
    });

    console.log(`Created Stripe product: ${stripeProduct.id}`);

    // Create Stripe price
    const priceInCents = Math.round(parseFloat(product.price) * 100);
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: priceInCents,
      currency: 'usd',
      metadata: {
        product_id: product.id
      }
    });

    console.log(`Created Stripe price: ${stripePrice.id} (${priceInCents} cents)`);

    // Update database
    await db
      .update(products)
      .set({
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        stripeSyncStatus: 'synced',
        stripeLastSync: new Date()
      })
      .where(eq(products.id, productId));

    console.log(`✅ Successfully synced product ${product.name}`);
    return { success: true, stripeProductId: stripeProduct.id, stripePriceId: stripePrice.id };
  } catch (error) {
    console.error(`❌ Failed to sync product ${productId}:`, error.message);
    
    // Update sync status to failed
    await db
      .update(products)
      .set({
        stripeSyncStatus: 'failed',
        stripeLastSync: new Date()
      })
      .where(eq(products.id, productId));
    
    return { success: false, error: error.message };
  }
}

async function syncAllProducts() {
  try {
    console.log('🔄 Starting product sync to Stripe...\n');

    // Get all products that need syncing
    const allProducts = await db.select().from(products);
    console.log(`Found ${allProducts.length} products to sync\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of allProducts) {
      const result = await syncProductToStripe(product.id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('---');
    }

    console.log(`\n🎉 Sync completed!`);
    console.log(`✅ Successfully synced: ${successCount} products`);
    console.log(`❌ Failed to sync: ${failCount} products`);
    
    // Show final status
    const updatedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        stripeProductId: products.stripeProductId,
        stripeSyncStatus: products.stripeSyncStatus
      })
      .from(products);
    
    console.log('\n📊 Final sync status:');
    updatedProducts.forEach(p => {
      console.log(`${p.name}: ${p.stripeSyncStatus} ${p.stripeProductId ? `(${p.stripeProductId})` : ''}`);
    });

  } catch (error) {
    console.error('💥 Sync process failed:', error);
  }
}

// Run the sync
syncAllProducts();