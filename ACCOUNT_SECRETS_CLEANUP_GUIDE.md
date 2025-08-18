# Account Secrets Cleanup Guide

## Current Account Secrets Analysis

Based on your screenshot and our codebase analysis, here's what can be safely removed from your **Account Secrets**:

### ❌ SAFE TO REMOVE (Legacy/Unused):

1. **EXPECTED_DB_HOST** 
   - Legacy validation variable from old database security system
   - Made obsolete by our recent security improvements
   - ⚠️ **This is the main one showing as problematic**

### ✅ KEEP THESE (Required):

1. **APP_ENV** - Environment detection
2. **CLOUDINARY_API_KEY** - Image storage
3. **CLOUDINARY_API_SECRET** - Image storage
4. **CLOUDINARY_CLOUD_NAME** - Image storage
5. **DEV_DATABASE_URL** - Development database
6. **GEOAPIFY_API_KEY** - Location services
7. **GOOGLE_CLIENT_ID** - Google OAuth
8. **GOOGLE_CLIENT_SECRET** - Google OAuth
9. **PROD_DATABASE_URL** - Production database
10. **RESEND_API_KEY** - Email services
11. **SESSION_SECRET** - Session security
12. **STRIPE_PUBLISHABLE_KEY** - Payment processing
13. **STRIPE_SECRET_KEY** - Payment processing
14. **VITE_GEOAPIFY_API_KEY** - Frontend location services

## How to Remove Account Secrets

1. **Go to Account Secrets** (where you took this screenshot)
2. **Find EXPECTED_DB_HOST**
3. **Click the edit/delete button** (pencil icon on the right)
4. **Delete this secret**

## Why EXPECTED_DB_HOST Should Be Removed

- **Legacy Security Check**: This was used in old database validation logic
- **No Longer Referenced**: Our codebase analysis shows it's not used anywhere
- **Replaced by Better Security**: New environment-specific database URLs provide superior security
- **Causing Sync Issues**: This is likely contributing to the "secrets out of sync" warnings

## Verification

After removing `EXPECTED_DB_HOST`:

1. **Check for Sync Warnings**: The "secrets out of sync" message should disappear
2. **Test Application**: Both development and production should work normally
3. **Monitor Logs**: No "missing environment variable" errors should appear

## Why Other Secrets Should Stay

All other secrets in your account are actively used:
- **Cloudinary**: Image upload and processing
- **Google OAuth**: User authentication
- **Stripe**: Payment processing
- **Database URLs**: Core data storage
- **API Keys**: Various integrations

## Expected Result

After removing `EXPECTED_DB_HOST`, you should have a clean account secrets configuration with no sync warnings and all functionality intact.