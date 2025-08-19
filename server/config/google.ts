// server/config/google.ts
// Use the existing Google OAuth credentials
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Dynamic redirect URI based on environment and domain
export const GOOGLE_REDIRECT_URI = (() => {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
  if (appEnv === "production") {
    return "https://cleanandflip.com/api/auth/google/callback";
  } else {
    // Development fallback
    return "/api/auth/google/callback";
  }
})();