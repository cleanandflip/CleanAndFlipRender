# Clean & Flip - Deployment Environment Configuration

This document provides the authoritative configuration guide for deploying Clean & Flip with proper environment isolation.

## Environment Isolation System

Clean & Flip now implements enterprise-grade environment isolation that prevents cross-database contamination. The system automatically validates configurations and refuses to start with mismatched settings.

### Environment Guard Features

- **Automatic Host Validation**: Derives expected database hosts from environment-specific DSNs
- **Cross-Contamination Prevention**: Prevents production from using dev databases and vice versa
- **Zero Manual Configuration**: No need to manually set EXPECTED_DB_HOST
- **Startup Safety**: Server refuses to start with invalid configurations

## Deployment Configuration

### For Production Deployment

Set these environment variables in **Replit → Deployments → Settings → Environment variables**:

```bash
# Required Production Variables
APP_ENV=production
DATABASE_URL=postgresql://[user:pass]@ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PROD_DATABASE_URL=[same as DATABASE_URL]
SESSION_SECRET=[secure-random-string-32+ chars]

# Optional Production Variables  
SESSION_COOKIE_DOMAIN=[your-domain.replit.app]
API_BASE_URL_PROD=https://[your-domain.replit.app]
```

**Remove/Unset these in production:**
- `DEV_DATABASE_URL`
- Any `APP_ENV=development` settings
- Any `EXPECTED_DB_HOST` pointing to dev

### For Development/Preview

Set these environment variables in **Replit workspace secrets**:

```bash
# Required Development Variables
APP_ENV=development
DATABASE_URL=postgresql://[user:pass]@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
DEV_DATABASE_URL=[same as DATABASE_URL]
SESSION_SECRET=[dev-session-secret]

# Optional Development Variables
API_BASE_URL_DEV=http://localhost:5000
```

## Verification Checklist

### 1. Environment Doctor Check
```bash
npm run env:doctor
# or directly:
tsx scripts/env-doctor.ts
```

**Expected output for development:**
```
[ENV_CONFIG] APP_ENV=development, DATABASE_URL host=ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech
{
  APP_ENV: 'development',
  DB_HOST: 'ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech',
  DEV_DB_HOST: 'ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech',
  PROD_DB_HOST: 'ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech',
  API_BASE_URL: '(relative client calls)'
}
✅ env:doctor OK
```

**Expected output for production:**
```
[ENV_CONFIG] APP_ENV=production, DATABASE_URL host=ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech
{
  APP_ENV: 'production',
  DB_HOST: 'ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech',
  DEV_DB_HOST: '(not set)',
  PROD_DB_HOST: 'ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech',
  API_BASE_URL: 'https://your-domain.replit.app'
}
✅ env:doctor OK
```

### 2. Boot Log Verification

**Development should show:**
```
[ENV_GUARD] APP_ENV=development DB_HOST=ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech
✅ ENV_GUARD: Environment isolation verified
[DEV] Using development DB host: ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech
```

**Production should show:**
```
[ENV_GUARD] APP_ENV=production DB_HOST=ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech
✅ ENV_GUARD: Environment isolation verified
[PRODUCTION] ✅ Using production DB host: ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech
```

### 3. Health Check Verification

Test the health endpoint:

```bash
# Development
curl http://localhost:5000/api/healthz

# Production  
curl https://your-domain.replit.app/api/healthz
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-18T04:18:36.000Z",
  "service": "clean-flip-api",
  "env": "production",
  "dbHost": "ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech"
}
```

## Database Hosts Reference

- **Development**: `ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech`
- **Production**: `ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech`

## Security Features

1. **Environment Isolation**: Prevents accidental cross-environment database access
2. **Host Validation**: Automatically validates database hosts match environment expectations
3. **Startup Guards**: Server refuses to start with invalid configurations
4. **Session Security**: Environment-aware cookie settings (secure, sameSite, domain)
5. **Zero Fallbacks**: No legacy DATABASE_URL dependencies for maximum security

## Troubleshooting

### Common Error: Environment Mismatch

**Error:**
```
ENV_GUARD: Refusing to start. APP_ENV=development but DATABASE_URL host=ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech != expected(development)=ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech
```

**Solution:**
1. Check `APP_ENV` matches your intended environment
2. Verify `DATABASE_URL` points to the correct database for that environment
3. Ensure no conflicting environment variables are set

### Common Error: Cross-Contamination

**Error:**
```
ENV_GUARD: production cannot use DEV host ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech
```

**Solution:**
1. Remove `DEV_DATABASE_URL` from production deployment secrets
2. Set `DATABASE_URL` to production database in deployment
3. Verify `APP_ENV=production` in deployment

## Migration Notes

- The new system replaces manual `EXPECTED_DB_HOST` configuration
- All existing functionality remains unchanged
- Session authentication has been improved with proper environment-aware settings
- Health checks now include environment and database host information

## Success Indicators

✅ Environment doctor passes
✅ Server starts without errors
✅ Health check returns correct environment and database host
✅ No cross-environment warnings in logs
✅ Authentication works across page refreshes