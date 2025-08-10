# Deployment Guide - Clean & Flip

This guide provides step-by-step instructions for deploying Clean & Flip to production with proper database synchronization.

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Run the automated deployment workflow
./scripts/quick-deploy.sh
```

This script will:
1. Sync the production database with development changes
2. Provide clear deployment instructions
3. List post-deployment verification steps

### Option 2: Manual Step-by-Step

```bash
# 1. Preview database changes first (recommended)
./scripts/sync-prod-db.sh --dry-run

# 2. Apply database changes to production
./scripts/sync-prod-db.sh

# 3. Deploy via Replit UI (click Deploy button)

# 4. Test the deployment
```

## Available Commands

### Database Sync Commands

```bash
# Preview what changes would be made
./scripts/sync-prod-db.sh --dry-run

# Sync database with confirmation prompt
./scripts/sync-prod-db.sh

# Sync database without prompts (for CI/CD)
./scripts/sync-prod-db.sh --force

# Show detailed output for debugging
./scripts/sync-prod-db.sh --verbose

# Get help and see all options
./scripts/sync-prod-db.sh --help
```

### Quick Deploy

```bash
# Complete deployment workflow
./scripts/quick-deploy.sh
```

## Prerequisites

Before deploying, ensure you have:

### 1. Environment Variables (Replit Secrets)

Production database secrets:
- `DATABASE_URL_PROD` - Full production database URL
- `PGHOST` - Production database host
- `PGPORT` - Production database port  
- `PGUSER` - Production database username
- `PGPASSWORD` - Production database password
- `PGDATABASE` - Production database name

OAuth secrets:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

Other services:
- `STRIPE_SECRET_KEY` - Stripe payments
- `CLOUDINARY_CLOUD_NAME` - Image storage
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `RESEND_API_KEY` - Email delivery

### 2. Database Configuration

The project uses the main `drizzle.config.ts` with environment variable overrides for production deployments.

### 3. Tools Installed

The sync script requires:
- `psql` (PostgreSQL client)
- `npm` (Node.js package manager)
- `drizzle-kit` (Database migrations)

## Deployment Process

### Step 1: Test Locally

```bash
# Ensure development environment works
npm run dev

# Test all features:
# - User registration/login
# - Google OAuth sign-in
# - Product browsing
# - Cart functionality
# - Admin dashboard (if applicable)
```

### Step 2: Sync Database

```bash
# Preview changes first
./scripts/sync-prod-db.sh --dry-run

# Review the output, then apply changes
./scripts/sync-prod-db.sh
```

The script will:
- Create a backup of the current production schema
- Compare development and production schemas
- Apply necessary changes
- Run manual fixes for specific issues
- Verify the sync was successful

### Step 3: Deploy Application

1. **Click the Deploy button** in Replit's interface
2. **Wait for build completion** (usually 2-5 minutes)
3. **Note the deployment URL** (typically `your-repl.replit.app`)

### Step 4: Post-Deployment Verification

Test these critical features in production:

#### Google OAuth Flow
1. Visit your production site
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify new users are redirected to onboarding
5. Complete onboarding process
6. Confirm user can access the application

#### Core Functionality
- [ ] Homepage loads correctly
- [ ] Product catalog displays
- [ ] Search functionality works
- [ ] User registration/login works
- [ ] Cart operations work
- [ ] Google OAuth sign-in works
- [ ] New user onboarding works
- [ ] Admin dashboard accessible (if applicable)

#### Database Connectivity
- [ ] User data persists
- [ ] Product data displays correctly
- [ ] Orders can be created
- [ ] Session management works

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Symptom**: "Connection refused" or "Database not found"

**Solution**: 
1. Verify `DATABASE_URL_PROD` in Replit secrets
2. Check database is accessible from Replit
3. Confirm database credentials are correct

#### Google OAuth Errors

**Symptom**: "Invalid client ID" or OAuth flow fails

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in secrets
2. Check Google Console authorized domains include your production URL
3. Ensure redirect URLs are properly configured

#### Schema Sync Failures

**Symptom**: Drizzle push command fails with permission errors

**Solution**:
```bash
# Run the command manually with interactive mode
DATABASE_URL=$DATABASE_URL_PROD npx drizzle-kit push
```

#### Missing Environment Variables

**Symptom**: Application starts but features don't work

**Solution**:
1. Check Replit secrets are properly set
2. Verify variable names match exactly
3. Redeploy after adding missing secrets

### Getting Help

If deployment fails:

1. **Check the logs** in Replit's deployment interface
2. **Run database sync in dry-run mode** to see what's different
3. **Verify all prerequisites** are met
4. **Test locally first** to ensure changes work in development

### Rollback Procedure

If something goes wrong:

1. **Database**: Restore from the automatic backup created by sync script
2. **Application**: Deploy the previous working version
3. **Secrets**: Revert any environment variable changes

## Security Considerations

### Production Secrets
- Never commit secrets to version control
- Use Replit's secure secret management
- Rotate secrets regularly
- Use different secrets for development and production

### Database Security
- Production database should have restricted access
- Use SSL connections (enabled by default with Neon)
- Regular backups are essential
- Monitor for suspicious activity

### OAuth Security
- Keep client secrets secure
- Regularly review authorized domains
- Monitor OAuth usage and errors
- Use HTTPS for all OAuth redirects

## Performance Optimization

### After Deployment
- Monitor response times
- Check database query performance
- Verify CDN/caching is working
- Test under load if possible

### Monitoring
- Set up error tracking
- Monitor user sign-ups and OAuth success rates
- Track key business metrics
- Watch for database performance issues

## Maintenance

### Regular Tasks
- **Weekly**: Check application health and error logs
- **Monthly**: Review and rotate secrets as needed
- **Quarterly**: Update dependencies and security patches
- **As needed**: Scale database resources based on usage

### Updates
When making changes:
1. Test thoroughly in development
2. Run database sync with --dry-run first
3. Deploy during low-traffic periods
4. Monitor closely after deployment
5. Have rollback plan ready

## Support

For deployment issues:
1. Check this guide for common solutions
2. Review Replit's deployment documentation
3. Check database provider documentation (Neon)
4. Verify third-party service status (Google, Stripe, etc.)

Remember: Always test changes in development before deploying to production!