// server/config/google.ts
import { APP_ENV } from "./env";

// Use the existing Google OAuth credentials
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Dynamic redirect URI based on environment and domain
export const GOOGLE_REDIRECT_URI = (() => {
  if (APP_ENV === "production") {
    return "https://cleanandflip.com/api/auth/google/callback";
  } else {
    // Development fallback
    return "/api/auth/google/callback";
  }
})();