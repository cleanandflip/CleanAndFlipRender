// server/config/google.ts
import { APP_ENV } from "./env";

// Use the existing Google OAuth credentials
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Dynamic redirect URI based on environment and domain
export const GOOGLE_REDIRECT_URI = (() => {
  // Try to get the current domain from environment or headers
  const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
  
  if (APP_ENV === "production" && process.env.PROD_DOMAIN) {
    return `https://${process.env.PROD_DOMAIN}/auth/google/callback`;
  } else if (replitDomain) {
    return `https://${replitDomain}/auth/google/callback`;
  } else {
    // Fallback for development
    return `https://localhost:5000/auth/google/callback`;
  }
})();