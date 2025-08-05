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
      // Rate limiting check (temporarily disabled for testing)
      // const recentAttempts = await this.getRecentResetAttempts(email);
      // if (recentAttempts >= this.MAX_RESET_ATTEMPTS) {
      //   logger.warn(`Too many password reset attempts for email: ${email} from IP: ${ipAddress}`);
      //   throw new Error('Too many reset attempts. Please try again later.');
      // }

      // Find user (case insensitive email lookup) - only select essential fields
      const normalizedEmail = normalizeEmail(email);
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      // Check if user exists - provide helpful feedback while maintaining security
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        // Provide clear feedback for non-existent accounts
        return { 
          error: 'No account found with this email address',
          message: 'Please check your email address or create a new account if you haven\'t registered yet.',
          suggestion: 'Make sure you\'re using the same email address you used to register.'
        };
      }

      // Cancel any existing tokens for this user
      await this.cancelUserTokens(user.id);

      // Generate secure token
      const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const hashedToken = await bcrypt.hash(token, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Save token to database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt,
        ipAddress,
        userAgent,
      });

      // Create reset link with production URL
      const baseUrl = process.env.FRONTEND_URL || 'https://cleanandflip.com';
        
      const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

      console.log('Generated reset link:', resetLink);

      // Send password reset email
      await emailService.sendPasswordReset(user.email, token, resetLink);

      // Log security event
      await this.logSecurityEvent(user.id, 'password_reset_requested', ipAddress);

      logger.info(`Password reset email sent for user: ${user.id} from IP: ${ipAddress}`);
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
        .where(eq(users.id, validation.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({
          used: true,
          usedAt: new Date()
        })
        .where(eq(passwordResetTokens.id, validation.tokenId));

      // Log security event
      await this.logSecurityEvent(validation.userId, 'password_reset_completed', ipAddress);

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