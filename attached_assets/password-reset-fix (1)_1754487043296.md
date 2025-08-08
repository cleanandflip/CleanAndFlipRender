# REPLIT FIX INSTRUCTIONS: Complete Password Reset System Overhaul

## 🎯 DIRECTIVE FOR REPLIT

**YOUR MISSION**: The password reset system exists but is COMPLETELY BROKEN. Fix the entire flow from user lookup to email sending. The user "cleanandflipyt@gmail.com" EXISTS in the database but the system can't find them.

---

## STEP 1: FIX DATABASE IMMEDIATELY

### A. Run These SQL Commands NOW
```sql
-- Fix missing columns that are breaking queries
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ensure password_reset_tokens table exists with correct structure
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create proper indexes for performance
CREATE INDEX idx_prt_token ON password_reset_tokens(token);
CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_expires ON password_reset_tokens(expires_at) WHERE used = false;

-- FIX USER EMAIL LOOKUPS - THIS IS CRITICAL
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_ci ON users(LOWER(TRIM(email)));
```

### B. Update Drizzle Schema Files
```typescript
// In server/db/schema.ts - ENSURE these match EXACTLY

// Fix products table
export const products = pgTable('products', {
  // ... existing columns ...
  subcategory: text('subcategory'), // ADD THIS if missing
  // ... rest of columns ...
});

// Fix categories table  
export const categories = pgTable('categories', {
  // ... existing columns ...
  imageUrl: text('image_url'), // ADD THIS if missing
  // ... rest of columns ...
});

// Ensure password reset tokens table exists
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});
```

---

## STEP 2: FIX USER LOOKUP SERVICE (THIS IS THE MAIN PROBLEM)

### Replace Your Broken User Lookup with This Working Version
```typescript
// ⚠️ DELETE ALL OLD PASSWORD RESET CODE FIRST
// Look for and DELETE these files/functions:
// - Any old password-reset.ts files
// - Any passwordReset functions scattered in auth controllers
// - Any duplicate user lookup functions
// - Remove any unused email service files (nodemailer, etc.)

---

## STEP 2A: DELETE OLD LEGACY CODE

### Files to DELETE or CLEAN:
```bash
# Run these commands to find and review old code:
grep -r "password.*reset" --include="*.ts" --include="*.tsx" .
grep -r "findUserByEmail" --include="*.ts" .
grep -r "nodemailer" --include="*.ts" .
grep -r "sendEmail" --include="*.ts" .
grep -r "resetToken" --include="*.ts" .

# DELETE these patterns if found:
# - Multiple versions of user lookup functions
# - Old email sending implementations
# - Duplicate password reset routes
# - Unused email templates
# - Old token generation functions
```

### Clean Your Package.json:
```json
// REMOVE these if not used elsewhere:
"nodemailer": "DELETE THIS LINE",
"@types/nodemailer": "DELETE THIS LINE",
"sendgrid": "DELETE THIS LINE",
"mailgun-js": "DELETE THIS LINE",
// KEEP only:
"resend": "^2.x.x",  // Keep this for email
```

---

## STEP 2B: CREATE CLEAN USER SERVICE

### server/services/user.service.ts (COMPLETE REPLACEMENT)
```typescript
// DELETE EVERYTHING IN THIS FILE AND REPLACE WITH:

import { db } from '../db';
import { users, passwordResetTokens } from '../db/schema';
import { eq, sql, and, gt, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export class UserService {
  /**
   * FIXED USER LOOKUP - GUARANTEED TO WORK
   */
  async findUserByEmail(email: string) {
    if (!email) {
      console.log('[UserService] ERROR: No email provided');
      return null;
    }

    // CRITICAL: Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[UserService] Starting lookup for: "${normalizedEmail}"`);

    try {
      // PRIMARY METHOD: Use PostgreSQL's lower() function
      const result = await db
        .select()
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = ${normalizedEmail}`)
        .limit(1);

      if (result.length > 0) {
        console.log(`[UserService] ✅ Found user: ID=${result[0].id}, Email="${result[0].email}"`);
        return result[0];
      }

      // FALLBACK: Debug mode - Show ALL emails in database
      console.log('[UserService] ⚠️ Primary lookup failed. Entering debug mode...');
      
      const allEmails = await db
        .select({
          id: users.id,
          email: users.email,
          created: users.createdAt,
        })
        .from(users);
      
      console.log('[UserService] 📊 Database contains these users:');
      allEmails.forEach((user, idx) => {
        const dbEmail = user.email;
        const matches = dbEmail.toLowerCase().trim() === normalizedEmail;
        console.log(`  ${idx + 1}. ID=${user.id}, Email="${dbEmail}", Matches=${matches}`);
        
        // Check for hidden characters
        if (dbEmail.includes(normalizedEmail.substring(0, 10))) {
          const bytes = Buffer.from(dbEmail, 'utf8');
          console.log(`     Raw bytes: ${bytes.toString('hex')}`);
        }
      });

      // LAST RESORT: Try to find partial match
      const partialMatch = allEmails.find(u => {
        const clean = u.email.toLowerCase().trim();
        return clean === normalizedEmail || 
               clean.replace(/\s+/g, '') === normalizedEmail.replace(/\s+/g, '');
      });

      if (partialMatch) {
        console.log(`[UserService] ✅ Found via fallback: ID=${partialMatch.id}`);
        const fullUser = await db
          .select()
          .from(users)
          .where(eq(users.id, partialMatch.id))
          .limit(1);
        return fullUser[0];
      }

      console.log(`[UserService] ❌ No user found for: "${normalizedEmail}"`);
      return null;

    } catch (error) {
      console.error('[UserService] 🔥 Database error:', error);
      throw error;
    }
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(
    userId: number, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    console.log(`[UserService] Creating reset token for user ${userId}`);

    try {
      // Invalidate ALL old tokens for this user
      const invalidated = await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(and(
          eq(passwordResetTokens.userId, userId),
          eq(passwordResetTokens.used, false)
        ))
        .returning();
      
      if (invalidated.length > 0) {
        console.log(`[UserService] Invalidated ${invalidated.length} old tokens`);
      }

      // Create new token
      const [newToken] = await db
        .insert(passwordResetTokens)
        .values({
          userId,
          token,
          expiresAt,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          used: false,
        })
        .returning();

      console.log(`[UserService] ✅ Token created: ${token.substring(0, 10)}...`);
      return token;

    } catch (error) {
      console.error('[UserService] ❌ Failed to create token:', error);
      throw error;
    }
  }

  /**
   * Validate reset token
   */
  async validateResetToken(token: string) {
    if (!token) return null;

    const result = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Reset user password
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validateResetToken(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Start transaction
    try {
      // Update password
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenData.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, tokenData.id));

      console.log(`[UserService] ✅ Password reset for user ${tokenData.userId}`);
      return true;
    } catch (error) {
      console.error('[UserService] ❌ Password reset failed:', error);
      throw error;
    }
  }
}
```

---

## STEP 3: IMPLEMENT RESEND EMAIL SERVICE

### server/services/email.service.ts (COMPLETE REPLACEMENT)
```typescript