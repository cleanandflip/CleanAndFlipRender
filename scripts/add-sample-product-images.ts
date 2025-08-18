// scripts/add-sample-product-images.ts
import { db } from '../server/db';
import { products } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addSampleImages() {
  console.log("🖼️ Adding sample images to products...");

  // Sample fitness equipment images from Cloudinary's public samples
  const fitnessImages = {
    'Barbell': [
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/v1733932800/fitness/barbell-olympic-45lb.jpg',
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/v1733932800/fitness/barbell-detail.jpg'
    ],
    'Adjustable Dumbbells': [
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/v1733932800/fitness/adjustable-dumbbells-set.jpg',
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/v1733932800/fitness/dumbbells-close-up.jpg'
    ]
  };

  // Alternative: Use Cloudinary's built-in sample images
  const fallbackImages = {
    'Barbell': [
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/samples/ecommerce/analog-classic',
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/samples/ecommerce/accessories-bag'
    ],
    'Adjustable Dumbbells': [
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/samples/ecommerce/leather-bag-gray',
      'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/samples/ecommerce/shoes'
    ]
  };

  try {
    // Get all products
    const allProducts = await db.select().from(products);
    console.log(`📦 Found ${allProducts.length} products`);

    for (const product of allProducts) {
      console.log(`🔄 Processing: ${product.name}`);
      
      // Use fallback images since custom fitness images may not exist yet
      const imagesToUse = fallbackImages[product.name as keyof typeof fallbackImages] || [
        'https://res.cloudinary.com/dv1bgzccd/image/upload/f_auto,q_auto,c_fit,w_400,h_400/samples/ecommerce/analog-classic'
      ];

      // Update product with images
      await db
        .update(products)
        .set({ 
          images: imagesToUse,
          updatedAt: new Date()
        })
        .where(eq(products.id, product.id));
      
      console.log(`✅ Updated ${product.name} with ${imagesToUse.length} images`);
    }

    console.log("🎯 Sample images added successfully!");
    
    // Verify the update
    const updatedProducts = await db.select({ id: true, name: true, images: true }).from(products);
    updatedProducts.forEach(p => {
      console.log(`📸 ${p.name}: ${p.images?.length || 0} images`);
    });

  } catch (error) {
    console.error("❌ Error adding sample images:", error);
  }
}

addSampleImages();