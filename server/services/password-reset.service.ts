import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, passwordResetTokens, activityLogs } from '../../shared/schema';
import { emailService } from './email.service';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '../config/logger';

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
      // Rate limiting check
      const recentAttempts = await this.getRecentResetAttempts(email);
      if (recentAttempts >= this.MAX_RESET_ATTEMPTS) {
        logger.warn(`Too many password reset attempts for email: ${email} from IP: ${ipAddress}`);
        throw new Error('Too many reset attempts. Please try again later.');
      }

      // Find user (case insensitive email lookup)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If an account exists, reset email sent' };
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

      // Send password reset email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      await emailService.sendPasswordResetEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
        resetLink,
        ipAddress,
        userAgent,
        expiresIn: '1 hour',
      });

      // Log security event
      await this.logSecurityEvent(user.id, 'password_reset_requested', ipAddress);

      logger.info(`Password reset email sent for user: ${user.id} from IP: ${ipAddress}`);
      return { message: 'If an account exists, reset email sent' };
      
    } catch (error) {
      logger.error('Error in password reset request:', error);
      throw error;
    }
  }

  static async validateToken(token: string) {
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
          // Get user email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, resetToken.userId))
            .limit(1);

          return { 
            valid: true, 
            email: user?.email,
            userId: resetToken.userId,
            tokenId: resetToken.id
          };
        }
      }

      return { valid: false };
      
    } catch (error) {
      logger.error('Error validating password reset token:', error);
      return { valid: false };
    }
  }

  static async resetPassword(
    token: string, 
    newPassword: string, 
    ipAddress: string
  ) {
    try {
      // Validate token
      const validation = await this.validateToken(token);
      if (!validation.valid || !validation.userId) {
        throw new Error('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
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
        .where(eq(passwordResetTokens.id, validation.tokenId!));

      // Send confirmation email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, validation.userId))
        .limit(1);

      if (user) {
        await emailService.sendPasswordResetSuccessEmail({
          to: user.email,
          userName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
          ipAddress,
          timestamp: new Date().toISOString()
        });
      }

      // Log security event
      await this.logSecurityEvent(
        validation.userId, 
        'password_reset_completed', 
        ipAddress
      );

      logger.info(`Password reset completed for user: ${validation.userId} from IP: ${ipAddress}`);
      return { message: 'Password reset successful' };
      
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  private static async getRecentResetAttempts(email: string): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - this.RESET_COOLDOWN_MINUTES);

      const [user] = await db
        .select()
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
        eventType: event,
        metadata: { ipAddress },
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}