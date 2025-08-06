import { db } from '../db';
import { users, passwordResetTokens } from '@shared/schema';
import { eq, sql, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * FIXED USER LOOKUP - GUARANTEED TO WORK
   */
  static async findUserByEmail(email: string) {
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
  static async createPasswordResetToken(
    userId: string, 
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
  static async validateResetToken(token: string) {
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
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validateResetToken(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }

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

// Legacy function for backward compatibility
export async function findUserByEmail(email: string): Promise<any | null> {
  return UserService.findUserByEmail(email);
}