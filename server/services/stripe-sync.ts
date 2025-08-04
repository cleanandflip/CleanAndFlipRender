import Stripe from 'stripe';
import { db } from '../db/index.js';
import { products, categories } from '../../shared/schema.js';
import { eq, isNull, or } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

interface ProductSyncData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: any[];
  brand: string | null;
  condition: string | null;
  stock: number;
  category: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  sku: string | null;
  weight: number | null;
  dimensions: any | null;
}

export class StripeProductSync {
  // Sync single product with all details
  static async syncProduct(productId: string): Promise<void> {
    try {
      console.log(`Starting sync for product ${productId}`);
      
      // Get complete product data
      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          images: products.images,
          brand: products.brand,
          condition: products.condition,
          stock: products.stockQuantity,
          stripeProductId: products.stripeProductId,
          stripePriceId: products.stripePriceId,
          sku: products.sku,
          weight: products.weight,
          dimensions: products.dimensions,
          category: categories.name
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Upload images to Stripe first
      const stripeImageUrls = await this.uploadImagesToStripe(product.images);

      // Prepare product data for Stripe
      const stripeProductData = {
        name: product.name,
        description: product.description || `${product.brand || ''} ${product.condition || ''} condition`.trim(),
        images: stripeImageUrls,
        active: product.stock > 0,
        metadata: {
          product_id: product.id,
          brand: product.brand || '',
          condition: product.condition || '',
          category: product.category || '',
          stock: String(product.stock),
          sku: product.sku || '',
          weight: product.weight ? String(product.weight) : '',
          dimensions: product.dimensions ? JSON.stringify(product.dimensions) : ''
        },
        shippable: true,
        package_dimensions: product.dimensions ? {
          height: product.dimensions.height,
          length: product.dimensions.length,
          weight: product.weight || 1000, // Default 1kg
          width: product.dimensions.width
        } : undefined
      };

      let stripeProduct;
      let stripePrice;

      // Create or update Stripe product
      if (product.stripeProductId) {
        // Update existing product
        stripeProduct = await stripe.products.update(
          product.stripeProductId,
          stripeProductData
        );
        console.log(`Updated Stripe product ${stripeProduct.id}`);
      } else {
        // Create new product
        stripeProduct = await stripe.products.create(stripeProductData);
        console.log(`Created new Stripe product ${stripeProduct.id}`);
      }

      // Handle price updates
      const priceInCents = Math.round(product.price * 100);
      
      if (product.stripePriceId) {
        // Check if price changed
        const currentPrice = await stripe.prices.retrieve(product.stripePriceId);
        if (currentPrice.unit_amount !== priceInCents) {
          // Deactivate old price
          await stripe.prices.update(product.stripePriceId, { active: false });
          
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'usd',
            metadata: {
              product_id: product.id
            }
          });
          console.log(`Created new price ${stripePrice.id} (${priceInCents} cents)`);
        } else {
          stripePrice = currentPrice;
        }
      } else {
        // Create new price
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: priceInCents,
          currency: 'usd',
          metadata: {
            product_id: product.id
          }
        });
        console.log(`Created price ${stripePrice.id} (${priceInCents} cents)`);
      }

      // Update database with Stripe IDs and sync status
      await db
        .update(products)
        .set({
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          stripeSyncStatus: 'synced',
          stripeLastSync: new Date()
        })
        .where(eq(products.id, productId));

      console.log(`Successfully synced product ${productId} to Stripe`);
    } catch (error) {
      console.error(`Failed to sync product ${productId}:`, error);
      
      // Update sync status to failed
      await db
        .update(products)
        .set({
          stripeSyncStatus: 'failed',
          stripeLastSync: new Date()
        })
        .where(eq(products.id, productId));
      
      throw error;
    }
  }

  // Upload images to Stripe
  static async uploadImagesToStripe(images: any[]): Promise<string[]> {
    if (!images || images.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      if (image.url) {
        // Ensure we're using full URLs
        let imageUrl = image.url;
        
        // Convert Cloudinary URLs to proper format if needed
        if (imageUrl.includes('cloudinary')) {
          imageUrl = imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        
        uploadedUrls.push(imageUrl);
      }
    }
    
    return uploadedUrls.slice(0, 8); // Stripe allows max 8 images
  }

  // Sync all products
  static async syncAllProducts(): Promise<void> {
    console.log('Starting full product sync to Stripe...');
    
    const unsyncedProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(
        or(
          isNull(products.stripeProductId),
          eq(products.stripeSyncStatus, 'pending'),
          eq(products.stripeSyncStatus, 'failed')
        )
      );
    
    console.log(`Found ${unsyncedProducts.length} products to sync`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of unsyncedProducts) {
      try {
        await this.syncProduct(String(product.id));
        successCount++;
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failCount++;
        console.error(`Failed to sync product ${product.id}:`, error);
      }
    }
    
    console.log(`Sync complete: ${successCount} succeeded, ${failCount} failed`);
  }

  // Delete product from Stripe
  static async deleteFromStripe(productId: string): Promise<void> {
    const [product] = await db
      .select({ stripeProductId: products.stripeProductId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    if (product?.stripeProductId) {
      await stripe.products.update(product.stripeProductId, { active: false });
      console.log(`Deactivated Stripe product ${product.stripeProductId}`);
    }
  }

  // Sync product from Stripe webhook
  static async syncFromStripeWebhook(stripeProductId: string): Promise<void> {
    const stripeProduct = await stripe.products.retrieve(stripeProductId);
    
    // Update local database with Stripe data
    await db
      .update(products)
      .set({
        name: stripeProduct.name,
        description: stripeProduct.description || null,
        stripeSyncStatus: 'synced',
        stripeLastSync: new Date()
      })
      .where(eq(products.stripeProductId, stripeProductId));
  }
}