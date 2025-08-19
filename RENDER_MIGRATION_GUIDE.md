# Clean & Flip - Render Migration Guide

## Overview
This guide helps you deploy Clean & Flip to Render with zero-downtime database migrations and full production capabilities.

## 🚀 Quick Deployment Steps

### 1. Environment Variables (Add to Render Dashboard)

**Required for API Service:**
```bash
# Core Application
NODE_ENV=production
DATABASE_URL=your_neon_production_database_url
SESSION_SECRET=your_secure_session_secret

# Neon Database Management
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id
PROD_BRANCH_ID=br-your-prod-branch-id
DEV_BRANCH_ID=br-your-dev-branch-id
PROD_ENDPOINT_ID=ep-your-prod-endpoint-id
DEV_ENDPOINT_ID=ep-your-dev-endpoint-id

# External Services
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RESEND_API_KEY=re_your_resend_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Render Service Configuration

**API Service Settings:**
- **Root Directory:** `server`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start`
- **Pre-Deploy Command:** `npm run migrate`
- **Health Check Path:** `/healthz`
- **Node.js Version:** 20.x (auto-detected from engines)

**Static Site Settings (if using separate frontend service):**
- **Root Directory:** `client`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `./dist`

### 3. Database Migration Features

The setup includes powerful database management scripts:

#### Zero-Downtime Migrations
```bash
# Run migrations (automatically runs on each deploy)
npm run migrate
```

#### Neon Snapshot Management
```bash
# Create a checkpoint/snapshot
npm run checkpoint --name=pre-deploy-backup

# Sync databases (dev → prod or prod → dev)
npm run sync-db --from=dev  # syncs dev to prod
npm run sync-db --from=prod # syncs prod to dev
```

## 🏗️ Project Structure for Render

```
your-repo/
├── client/                 # Frontend (Vite/React)
│   ├── package.json       # Client dependencies
│   └── dist/              # Built frontend assets
├── server/                 # Backend (Node.js/Express)
│   ├── package.json       # Server-only dependencies 
│   ├── index.ts           # Entry point
│   ├── scripts/           # Migration & DB scripts
│   │   ├── migrate.cjs    # Zero-downtime migrations
│   │   ├── neon-checkpoint.cjs
│   │   └── sync-db.cjs    # Database sync tools
│   └── dist/              # Built server bundle
├── migrations/            # SQL migration files
└── render.yaml           # Optional: Infrastructure as code
```

## 🔧 Build Process

### What Happens on Deploy:

1. **Pre-Deploy:** `npm run migrate` runs all pending SQL migrations
2. **Build:** `npm run build` creates optimized server bundle with esbuild
3. **Start:** `npm run start` runs the bundled application
4. **Health Check:** Render monitors `/healthz` endpoint

### Why This Fixes "vite: not found"

The original error occurred because the root `package.json` tried to run `vite build` but Vite wasn't available in the server environment. 

Our solution:
- Server builds with `esbuild` (fast, Node.js focused)
- No Vite dependency in server environment
- Clean separation of concerns

## 🔒 Security Features

✅ **Database Security:** Transactional migrations with advisory locks  
✅ **Session Management:** PostgreSQL-backed sessions  
✅ **Environment Isolation:** Separate dev/prod database branches  
✅ **Health Monitoring:** Comprehensive health checks  
✅ **SSL/TLS:** Automatic HTTPS via Render  

## 🛠️ Development Workflow

### Local Development
```bash
# Run full stack locally (from root)
npm run dev

# Run server only
cd server && npm run dev
```

### Database Operations
```bash
# Create backup before major changes
npm run checkpoint --name=before-feature-x

# Sync latest prod data to dev environment  
npm run sync-db --from=prod

# Apply new migrations
npm run migrate
```

### Deployment
1. Push to your main branch
2. Render automatically builds and deploys
3. Migrations run automatically before the new version goes live
4. Health checks ensure successful deployment

## 🚨 Troubleshooting

### Build Issues
- **"vite: not found"** → Fixed by separate server/client builds
- **"Cannot find module"** → Check dependencies in correct package.json
- **"Build timeout"** → Optimize build process or upgrade Render plan

### Database Issues  
- **Migration failed** → Check SQL syntax and rollback via snapshots
- **Connection timeout** → Verify DATABASE_URL and Neon settings
- **Lock timeout** → Migration already running, wait or check locks

### Runtime Issues
- **500 errors** → Check logs in Render dashboard  
- **Session issues** → Verify SESSION_SECRET is set
- **CORS errors** → Update allowed origins for your Render domain

## 📊 Monitoring

### Health Endpoints
- `/healthz` - Main health check (includes DB connectivity)
- `/health` - Alias to `/healthz`  
- `/api/healthz` - API-specific health data

### Logs
View real-time logs in Render dashboard or via CLI:
```bash
render logs -f --service=cleanandflip-api
```

## 🎯 Next Steps After Deployment

1. **Domain Setup:** Point cleanandflip.com to your Render service
2. **SSL Certificate:** Render provides free SSL automatically  
3. **Monitoring:** Set up log alerts and performance monitoring
4. **Backups:** Schedule regular database snapshots
5. **CI/CD:** Configure automatic deployments from your main branch

Your Clean & Flip application will be production-ready on Render with enterprise-grade features!