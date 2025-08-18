const CLOUD = "dv1bgzccd"; // Updated to match environment variable
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

/** Build a themed, optimized URL. Keep slugs exact. */
export function categoryImg(slug: string, size = 512) {
  // Use f_auto & q_auto + cover crop; centralize transforms here only.
  return `${BASE}/f_auto,q_auto,c_fill,w_${size},h_${size}/v1/categories/${slug}.jpg`;
}

/** Generate optimized product image URL */
export function productImg(publicId: string, options = { width: 400, height: 400, quality: "auto" }) {
  const { width, height, quality } = options;
  return `${BASE}/f_auto,q_${quality},c_fill,w_${width},h_${height}/${publicId}`;
}

/** Generate sample product images for demonstration */
export function getSampleProductImage(productName: string, index = 0): string {
  // Use Cloudinary's sample images for demonstration
  const sampleImages = [
    `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/ecommerce/accessories-bag`,
    `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/ecommerce/analog-classic`,
    `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/ecommerce/car-interior-design`,
    `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/ecommerce/leather-bag-gray`,
    `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/ecommerce/shoes`
  ];
  
  // For fitness equipment, use more relevant sample images
  if (productName.toLowerCase().includes('barbell')) {
    return `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/fitness/barbell-sample`;
  }
  if (productName.toLowerCase().includes('dumbbell')) {
    return `${BASE}/f_auto,q_auto,c_fit,w_400,h_400/v1/samples/fitness/dumbbell-sample`;
  }
  
  return sampleImages[index % sampleImages.length];
}

/** Single fallback used site-wide */
export const FALLBACK_IMG = `${BASE}/f_auto,q_auto/c_fit,w_512/v1/placeholders/category-fallback.png`;