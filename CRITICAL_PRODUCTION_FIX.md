# CRITICAL: Production Database Contamination Fix

## Problem Identified
Your production site `cleanandflip.com` is serving the correct frontend build but API calls are being routed to your **development database and session store** instead of production.

## Evidence
- Production frontend: Returns built assets (`/assets/index-BGvY_q5t.js`)
- Backend APIs: Hitting development environment (shows up in your localhost logs)
- Session debug: Production shows different sessionID but no user data

## Root Cause
Your deployment environment variables are not properly configured, causing production API calls to route to development.

## IMMEDIATE ACTION REQUIRED

### Step 1: Stop Auto-Deploys
1. Go to **Replit → Your Project → Deployments**
2. **Pause automatic deployments** while we fix this

### Step 2: Configure Production Environment Variables
Go to **Replit → Deployments → Settings → Environment Variables** and set:

```bash
# Critical Production Variables
APP_ENV=production
DATABASE_URL=postgresql://[production-credentials]@ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PROD_DATABASE_URL=[same as DATABASE_URL]
SESSION_SECRET=[secure-random-production-string]

# Remove These From Production
DEV_DATABASE_URL=[DELETE THIS]
```

### Step 3: Verify Configuration
After deployment restart, check:
```bash
curl https://cleanandflip.com/api/healthz
```

Should return:
```json
{
  "status": "ok",
  "env": "production", 
  "dbHost": "ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech"
}
```

### Step 4: Test Session Isolation
```bash
curl https://cleanandflip.com/api/_debug/session
```

Should return production-specific session data, NOT development session data.

## Why This Happened
1. Production deployment inherited development environment variables
2. Frontend builds correctly but backend API calls use development database
3. Cart operations on production write to development database
4. This creates cross-environment data contamination

## Current Risk Level: CRITICAL
- Customer data mixing between environments
- Development database receiving production traffic
- Session security compromised
- Data integrity violations

## Next Steps After Fix
1. Verify health check shows production environment
2. Test cart operations stay in production
3. Confirm no cross-environment data sharing
4. Re-enable auto-deployments

## Verification Commands
```bash
# Production health
curl https://cleanandflip.com/api/healthz

# Should show production DB host
curl https://cleanandflip.com/api/_debug/session

# Development health (should be different)
curl http://localhost:5000/api/healthz
```