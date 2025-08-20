export const env = {
  NODE: import.meta.env.VITE_ENV ?? 'production',
  API_URL: import.meta.env.VITE_API_URL,
  STRIPE_PK: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
  GEOAPIFY: import.meta.env.VITE_GEOAPIFY_API_KEY ?? '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
};

if (!env.API_URL) {
  throw new Error('[VITE] Missing VITE_API_URL');
}