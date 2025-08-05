import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, passwordResetTokens, activityLogs } from '../../shared/schema';
import { emailService } from './email';
import { eq, and, gt, sql } from 'drizzle-orm';
import { logger } from '../config/logger';
import { normalizeEmail } from '../utils/email';

export class PasswordResetService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY_HOURS = 1;
  private static readonly MAX_RESET_ATTEMPTS = 3;
  private static readonly RESET_COOLDOWN_MINUTES = 15;

  static async requestPasswordReset(
    email: string, 
    ipAddress: string, 
    userAgent: string
  ) {
    try {
      // Add detailed logging
      console.log(`[DEBUG] Password reset requested for email: "${email}"`);
      console.log(`[DEBUG] Email length: ${email.length}`);
      
      const normalizedEmail = normalizeEmail(email);
      console.log(`[DEBUG] Normalized email: "${normalizedEmail}"`);
      
      // Try raw SQL query first to isolate any schema issues
      try {
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE LOWER(email) = ${normalizedEmail}
        `);
        console.log(`[DEBUG] User count for email: ${countResult.rows[0]?.count || 0}`);
        
        const simpleResult = await db.execute(sql`
          SELECT id, email, first_name, last_name
          FROM users 
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1
        `);
        console.log(`[DEBUG] Simple query result:`, simpleResult.rows[0] || 'No user found');
        
      } catch (debugError) {
        console.error('[DEBUG] Query debug error:', debugError);
      }

      // Use simplified query to avoid schema issues
      const result = await db.execute(sql`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE LOWER(email) = ${normalizedEmail}
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        console.log(`[DEBUG] No user found for normalized email: ${normalizedEmail}`);
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If an account exists, reset email sent' };
      }

      const user = result.rows[0];
      console.log(`[DEBUG] User found - ID: ${user.id}, Email: ${user.email}`);

      // Cancel any existing tokens for this user using raw SQL
      await db.execute(sql`
        UPDATE password_reset_tokens
        SET used = true
        WHERE user_id = ${user.id} AND used = false
      `);

      // Generate secure token
      const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const hashedToken = await bcrypt.hash(token, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Save token to database using raw SQL
      await db.execute(sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent, created_at)
        VALUES (${String(user.id)}, ${hashedToken}, ${expiresAt.toISOString()}, ${ipAddress}, ${userAgent}, NOW())
      `);

      // Create reset link with production URL
      const baseUrl = process.env.FRONTEND_URL || 'https://cleanandflip.com';
        
      const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

      console.log('Generated reset link:', resetLink);

      // Send password reset email
      await emailService.sendPasswordReset(user.email, token, resetLink);

      // Log security event using correct activity_logs schema
      try {
        await db.execute(sql`
          INSERT INTO activity_logs (user_id, action, metadata, created_at)
          VALUES (${String(user.id)}, 'password_reset_requested', ${JSON.stringify({ email: String(user.email), ip: ipAddress })}, NOW())
        `);
      } catch (logError) {
        console.log('[DEBUG] Activity log failed, continuing without logging:', logError);
      }

      logger.info(`Password reset email sent for user: ${user.id} from IP: ${ipAddress}`);
      console.log(`[DEBUG] Password reset completed successfully for: ${user.email}`);
      return { message: 'If an account exists, reset email sent' };
      
    } catch (error) {
      logger.error('Error in password reset request:', error);
      throw error;
    }
  }

  static async validateToken(token: string, email?: string) {
    try {
      const now = new Date();
      
      // Find all non-expired, unused tokens
      const tokens = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        );

      // Check each token hash
      for (const resetToken of tokens) {
        const isValid = await bcrypt.compare(token, resetToken.token);
        if (isValid) {
          // Get user details
          const [user] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName
            })
            .from(users)
            .where(eq(users.id, resetToken.userId))
            .limit(1);

          // Verify email matches if provided
          if (email && user.email !== email.toLowerCase()) {
            return { valid: false, error: 'Invalid token or email combination' };
          }

          return {
            valid: true,
            tokenId: resetToken.id,
            userId: user.id,
            email: user.email,
            expiresAt: resetToken.expiresAt
          };
        }
      }

      return { valid: false, error: 'Invalid or expired token' };
      
    } catch (error) {
      logger.error('Error validating password reset token:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  static async resetPassword(
    token: string, 
    newPassword: string, 
    email: string,
    ipAddress: string
  ) {
    try {
      // Validate token with email
      const validation = await this.validateToken(token, email);
      
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, validation.userId!));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({
          used: true,
          usedAt: new Date()
        })
        .where(eq(passwordResetTokens.id, validation.tokenId!));

      // Log security event
      await this.logSecurityEvent(validation.userId!, 'password_reset_completed', ipAddress);

      logger.info(`Password reset completed for user: ${validation.userId} from IP: ${ipAddress}`);
      return { success: true, message: 'Password successfully reset' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  private static async getRecentResetAttempts(email: string): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - this.RESET_COOLDOWN_MINUTES);

      // Find user first - only select essential fields
      const [user] = await db
        .select({
          id: users.id,
          email: users.email
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) return 0;

      const attempts = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            gt(passwordResetTokens.createdAt, cutoff)
          )
        );

      return attempts.length;
    } catch (error) {
      logger.error('Error checking recent reset attempts:', error);
      return 0;
    }
  }

  private static async cancelUserTokens(userId: string): Promise<void> {
    try {
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            eq(passwordResetTokens.used, false)
          )
        );
    } catch (error) {
      logger.error('Error canceling user tokens:', error);
    }
  }

  private static async logSecurityEvent(
    userId: string, 
    event: string, 
    ipAddress: string
  ): Promise<void> {
    try {
      await db.insert(activityLogs).values({
        userId,
        eventType: 'security',  // Required field
        action: event,  // The specific action performed
        metadata: { ipAddress, event, timestamp: new Date().toISOString() },
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }
}