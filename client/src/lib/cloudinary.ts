const CLOUD = "clean-flip";
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

/** Build a themed, optimized URL. Keep slugs exact. */
export function categoryImg(slug: string, size = 512) {
  // Use f_auto & q_auto + cover crop; centralize transforms here only.
  return `${BASE}/f_auto,q_auto,c_fill,w_${size},h_${size}/v1/categories/${slug}.jpg`;
}

/** Single fallback used site-wide */
export const FALLBACK_IMG = `${BASE}/f_auto,q_auto/c_fit,w_512/v1/placeholders/category-fallback.png`;