import { db } from '../db';
import { sql, eq, ilike } from 'drizzle-orm';
import { users, passwordResetTokens } from '@shared/schema';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export class UserService {
  // SIMPLE, WORKING USER LOOKUP
  async findUserByEmail(email: string): Promise<any> {
    if (!email) {
      console.log('[UserService] No email provided');
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[UserService] Looking for email: "${normalizedEmail}"`);

    try {
      console.log('[UserService] Executing user lookup...');
      
      // Use proper Drizzle ORM query with case-insensitive search
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          first_name: users.firstName,
          last_name: users.lastName,
          role: users.role,
          created_at: users.createdAt
        })
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = ${normalizedEmail}`)
        .limit(1);
      
      if (result.length > 0) {
        console.log(`[UserService] ✅ FOUND USER: ${result[0].email} (ID: ${result[0].id})`);
        return result[0];
      }
      
      // DEBUG: Show what's actually in the database
      console.log('[UserService] User not found. Checking database...');
      const debugResult = await db
        .select({ email: users.email })
        .from(users)
        .orderBy(users.createdAt)
        .limit(5);
      
      if (debugResult.length > 0) {
        console.log('[UserService] Sample emails in database:');
        debugResult.forEach(row => {
          console.log(`  - "${row.email}"`);
        });
      } else {
        console.log('[UserService] WARNING: Users table appears to be empty!');
      }
      
      console.log(`[UserService] ❌ No user found for: "${normalizedEmail}"`);
      return null;
      
    } catch (error) {
      console.error('[UserService] Database error:', error);
      throw error;
    }
  }

  // CREATE PASSWORD RESET TOKEN
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    console.log(`[UserService] Creating token for user: ${userId}`);
    
    try {
      // Clear old tokens using Drizzle ORM
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.userId, userId));
      
      // Create new token using Drizzle ORM
      await db.insert(passwordResetTokens).values({
        userId: userId,
        token: token,
        expiresAt: expiresAt,
        used: false
      });
      
      console.log(`[UserService] ✅ Token created: ${token.substring(0, 10)}...`);
      return token;
      
    } catch (error) {
      console.error('[UserService] Failed to create token:', error);
      throw error;
    }
  }

  // VALIDATE TOKEN
  async validateResetToken(token: string): Promise<any> {
    if (!token) return null;
    
    const result = await db
      .select({
        id: passwordResetTokens.id,
        user_id: passwordResetTokens.userId,
        expires_at: passwordResetTokens.expiresAt
      })
      .from(passwordResetTokens)
      .where(
        sql`${passwordResetTokens.token} = ${token} AND ${passwordResetTokens.used} = false AND ${passwordResetTokens.expiresAt} > NOW()`
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  // RESET PASSWORD
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validateResetToken(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password using Drizzle ORM
    await db
      .update(users)
      .set({ 
        password: hashedPassword, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, tokenData.user_id));
    
    // Mark token as used using Drizzle ORM
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenData.id));
    
    console.log(`[UserService] ✅ Password reset for user: ${tokenData.user_id}`);
    return true;
  }
}