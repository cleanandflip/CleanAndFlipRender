# Password Reset System & Database Complete Overhaul Instructions

## PHASE 1: Immediate Database Schema Fixes

### Step 1: Add Missing Columns
```sql
-- First, check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories';

-- Add missing columns if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Step 2: Update Drizzle Schema Files
In `server/db/schema.ts`, ensure these columns exist:

```typescript
// Products table should include:
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category_id: integer('category_id').references(() => categories.id),
  subcategory: text('subcategory'), // ADD THIS
  // ... other fields
});

// Categories table should include:
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  image_url: text('image_url'), // ADD THIS
  // ... other fields
});
```

## PHASE 2: Complete Password Reset System Overhaul

### Step 1: Add Password Reset Tokens Table
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### Step 2: Update Drizzle Schema
```typescript
// server/db/schema.ts
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tokenIdx: index('idx_token').on(table.token),
  userIdIdx: index('idx_user_id').on(table.userId),
  expiresAtIdx: index('idx_expires_at').on(table.expiresAt),
}));
```

## PHASE 3: Password Reset Implementation

### Step 1: Create Email Service Module
```typescript
// server/services/email.service.ts
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export class EmailService {
  private transporter;

  constructor() {
    // Use environment variables for production
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@cleanandflip.com',
      to: email,
      subject: 'Password Reset Request - Clean & Flip',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Clean & Flip account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
```

### Step 2: Implement Fixed User Lookup Service
```typescript
// server/services/user.service.ts
import { db } from '../db';
import { users, passwordResetTokens } from '../db/schema';
import { eq, sql, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export class UserService {
  async findUserByEmail(email: string) {
    console.log('[UserService] Looking up user with email:', email);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // Method 1: Direct case-insensitive match
      const user = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      if (user.length > 0) {
        console.log('[UserService] User found:', user[0].id);
        return user[0];
      }

      // Method 2: Check with ILIKE for partial matches (debugging)
      const partialMatch = await db
        .select()
        .from(users)
        .where(sql`${users.email} ILIKE ${`%${normalizedEmail}%`}`)
        .limit(1);

      if (partialMatch.length > 0) {
        console.log('[UserService] Partial match found:', partialMatch[0].email);
        // Only return if exact match after normalization
        if (partialMatch[0].email.toLowerCase().trim() === normalizedEmail) {
          return partialMatch[0];
        }
      }

      console.log('[UserService] No user found for:', normalizedEmail);
      return null;
    } catch (error) {
      console.error('[UserService] Database error:', error);
      throw error;
    }
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    const emailService = new EmailService();
    const token = emailService.generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Invalidate any existing tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.userId, userId));

    // Create new token
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });

    return token;
  }

  async validateResetToken(token: string) {
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validateResetToken(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

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

    return true;
  }
}
```

### Step 3: Implement API Routes
```typescript
// server/routes/auth.routes.ts
import { Router } from 'express';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { z } from 'zod';

const router = Router();
const userService = new UserService();
const emailService = new EmailService();

// Request password reset
router.post('/api/password-reset/request', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });

    const { email } = schema.parse(req.body);
    
    console.log('[Password Reset] Request for:', email);

    const user = await userService.findUserByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[Password Reset] No user found, returning success anyway');
      return res.json({ 
        success: true, 
        message: 'If an account exists, a reset link has been sent.' 
      });
    }

    const token = await userService.createPasswordResetToken(user.id);
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    
    await emailService.sendPasswordResetEmail(user.email, resetLink);
    
    console.log('[Password Reset] Email sent to:', user.email);

    res.json({ 
      success: true, 
      message: 'If an account exists, a reset link has been sent.' 
    });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred processing your request.' 
    });
  }
});

// Validate reset token
router.get('/api/password-reset/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const valid = await userService.validateResetToken(token);
    
    res.json({ 
      valid: !!valid,
      message: valid ? 'Token is valid' : 'Invalid or expired token'
    });
  } catch (error) {
    console.error('[Password Reset] Validation error:', error);
    res.status(400).json({ 
      valid: false, 
      message: 'Invalid token' 
    });
  }
});

// Reset password
router.post('/api/password-reset/reset', async (req, res) => {
  try {
    const schema = z.object({
      token: z.string(),
      password: z.string().min(8),
    });

    const { token, password } = schema.parse(req.body);
    
    await userService.resetPassword(token, password);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully.' 
    });
  } catch (error) {
    console.error('[Password Reset] Reset error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to reset password.' 
    });
  }
});

export default router;
```

### Step 4: Create Frontend Components
```tsx
// client/src/pages/RequestPasswordReset.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export function RequestPasswordReset() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      setSubmitted(true);
    } catch (error) {
      console.error('Error requesting reset:', error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Check Your Email</h2>
            <p className="mt-2 text-gray-600">
              If an account exists with that email, we've sent password reset instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Reset Your Password</h2>
          <p className="mt-2 text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-black hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

```tsx
// client/src/pages/ResetPassword.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [tokenValid, setTokenValid] = useState(null);
  const [resetComplete, setResetComplete] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) {
      navigate('/request-password-reset');
      return;
    }

    // Validate token
    fetch(`/api/password-reset/validate/${token}`)
      .then(res => res.json())
      .then(data => setTokenValid(data.valid))
      .catch(() => setTokenValid(false));
  }, [token, navigate]);

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResetComplete(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <h2 className="text-3xl font-bold">Invalid or Expired Link</h2>
          <p className="mt-2 text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/request-password-reset')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <h2 className="text-3xl font-bold">Password Reset Successful!</h2>
          <p className="mt-2 text-gray-600">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Set New Password</h2>
          <p className="mt-2 text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              New Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-black hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## PHASE 4: Testing & Verification

### Step 1: Database Verification Script
```typescript
// scripts/verify-database.ts
import { db } from '../server/db';
import { users, products, categories, passwordResetTokens } from '../server/db/schema';

async function verifyDatabase() {
  console.log('=== DATABASE VERIFICATION ===\n');

  // Check users table
  console.log('Checking users table...');
  const userCount = await db.select().from(users);
  console.log(`✓ Found ${userCount.length} users`);
  userCount.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`);
  });

  // Check for specific user
  const testEmail = 'cleanandflipyt@gmail.com';
  console.log(`\nLooking for user: ${testEmail}`);
  const testUser = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${testEmail.toLowerCase()}`);
  
  if (testUser.length > 0) {
    console.log(`✓ User found: ${testUser[0].email}`);
  } else {
    console.log(`✗ User not found`);
  }

  // Check products table schema
  console.log('\nChecking products table columns...');
  const productSample = await db.select().from(products).limit(1);
  if (productSample.length > 0) {
    console.log('Product columns:', Object.keys(productSample[0]));
  }

  // Check categories table schema
  console.log('\nChecking categories table columns...');
  const categorySample = await db.select().from(categories).limit(1);
  if (categorySample.length > 0) {
    console.log('Category columns:', Object.keys(categorySample[0]));
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verifyDatabase().catch(console.error);
```

### Step 2: Test Password Reset Flow
```typescript
// scripts/test-password-reset.ts
import { UserService } from '../server/services/user.service';

async function testPasswordReset() {
  const userService = new UserService();
  
  console.log('=== TESTING PASSWORD RESET ===\n');

  // Test 1: Find user
  const email = 'cleanandflipyt@gmail.com';
  console.log(`Test 1: Finding user ${email}`);
  const user = await userService.findUserByEmail(email);
  
  if (user) {
    console.log(`✓ User found: ID ${user.id}`);
    
    // Test 2: Create reset token
    console.log('\nTest 2: Creating reset token');
    const token = await userService.createPasswordResetToken(user.id);
    console.log(`✓ Token created: ${token.substring(0, 10)}...`);
    
    // Test 3: Validate token
    console.log('\nTest 3: Validating token');
    const valid = await userService.validateResetToken(token);
    console.log(`✓ Token is ${valid ? 'valid' : 'invalid'}`);
    
    // Test 4: Reset password (mock)
    console.log('\nTest 4: Resetting password');
    const newPassword = 'TestPassword123!';
    const success = await userService.resetPassword(token, newPassword);
    console.log(`✓ Password reset: ${success ? 'success' : 'failed'}`);
  } else {
    console.log('✗ User not found');
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

testPasswordReset().catch(console.error);
```

## PHASE 5: Environment Variables

Add to `.env`:
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@cleanandflip.com

# App Configuration
APP_URL=https://your-domain.com
```

## PHASE 6: Migration Commands

Run these in order:
```bash
# 1. Generate migrations for schema changes
npm run db:generate

# 2. Run migrations
npm run db:migrate

# 3. Verify database
npm run verify:db

# 4. Test password reset
npm run test:password-reset
```

## Troubleshooting Checklist

- [ ] Verify all database columns exist
- [ ] Check email is stored in lowercase
- [ ] Ensure SMTP credentials are correct
- [ ] Verify APP_URL is set correctly
- [ ] Check database connection string
- [ ] Ensure password_reset_tokens table exists
- [ ] Verify user lookup is case-insensitive
- [ ] Test with actual user emails from database
- [ ] Check server logs for detailed errors
- [ ] Ensure all migrations have run successfully

## Success Criteria

✅ Users can request password reset  
✅ Email is sent with valid reset link  
✅ Token validation works correctly  
✅ Password can be successfully reset  
✅ Old tokens are invalidated  
✅ Database queries don't fail  
✅ No missing column errors  
✅ Case-insensitive email lookup works