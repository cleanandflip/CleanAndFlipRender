# Replit Database Migration Guide

## 🎯 OBJECTIVE
Use Replit's official Neon database and delete all other databases for a clean setup.

## 📊 CURRENT SITUATION

**Your Data Location:**
- Currently in: `ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech`
- Contains: 8 users, 7 products, working password reset system

**Replit Official Database:**
- Location: `ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech` 
- Status: Empty, but this is what Replit manages
- Shown in your Replit secrets as official DATABASE_URL

## 🔄 MIGRATION STEPS

### Step 1: Update Environment Variable
```bash
# In your .env file, change DATABASE_URL to:
DATABASE_URL=postgresql://neondb_owner:***@ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Create Schema in Official Database
```bash
npm run db:push
```
This creates all tables in Replit's official database.

### Step 3: Export Current Data
We'll create a script to export your users and products.

### Step 4: Import Data to Official Database
Import your 8 users and 7 products into the official database.

### Step 5: Test Everything Works
- Login with cleanandflipyt@gmail.com
- Verify password reset functionality
- Check all products are visible

### Step 6: Delete Old Databases
Once migration is complete:
- Delete: `ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech`
- Delete: `ep-lucky-credit-afc4egyc-2.us-west-2.aws.neon.tech`
- Keep: `ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech` (official)

## ✅ FINAL RESULT

You'll have:
- ONE database managed by Replit
- All your users and products migrated
- Clean, organized database setup
- Ready for production deployment

## ⚠️ SAFETY

- I'll create backup scripts before migration
- We can always restore if something goes wrong
- Migration will be done step-by-step with verification

Ready to start the migration process?