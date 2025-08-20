/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string
  readonly VITE_API_URL: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_GEOAPIFY_API_KEY?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

