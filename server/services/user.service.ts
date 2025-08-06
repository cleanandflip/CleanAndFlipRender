import { db } from '../db';
import { users, passwordResetTokens } from '../db/schema';
import { eq, sql, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import Logger from '../utils/logger';
import { EmailService } from './email.service';

export class UserService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async findUserByEmail(email: string) {
    Logger.info(`[UserService] Looking up user with email: ${email}`);
    
    if (!email) {
      Logger.warn('[UserService] Empty email provided');
      return null;
    }

    // Normalize email for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const queryStart = Date.now();
      
      // Method 1: Direct case-insensitive match using SQL
      const user = await db
        .select()
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = ${normalizedEmail}`)
        .limit(1);

      const queryTime = Date.now() - queryStart;
      
      if (user.length > 0) {
        Logger.info(`[UserService] User found: ${user[0].id} (${queryTime}ms)`);
        return user[0];
      }

      // Method 2: Try with ILIKE for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        const partialMatch = await db
          .select()
          .from(users)
          .where(sql`${users.email} ILIKE ${`%${normalizedEmail}%`}`)
          .limit(3);

        if (partialMatch.length > 0) {
          Logger.info(`[UserService] Partial matches found:`, partialMatch.map(u => u.email));
          
          // Check if any partial match is actually an exact match after normalization
          for (const match of partialMatch) {
            if (match.email.toLowerCase().trim() === normalizedEmail) {
              Logger.info(`[UserService] Exact match found via partial search: ${match.id}`);
              return match;
            }
          }
        } else {
          Logger.info(`[UserService] No partial matches found for: ${normalizedEmail}`);
        }
      }

      Logger.info(`[UserService] No user found for: ${normalizedEmail} (${queryTime}ms)`);
      return null;
      
    } catch (error) {
      Logger.error(`[UserService] Database error during user lookup:`, (error as Error).message);
      throw error;
    }
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    try {
      const token = this.emailService.generateResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      Logger.info(`[UserService] Creating password reset token for user: ${userId}`);

      // Invalidate any existing unused tokens for this user
      const invalidateResult = await db
        .update(passwordResetTokens)
        .set({ used: true, usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            eq(passwordResetTokens.used, false)
          )
        );

      Logger.info(`[UserService] Invalidated ${invalidateResult.rowCount || 0} existing tokens`);

      // Create new token
      await db.insert(passwordResetTokens).values({
        userId,
        token,
        expiresAt,
        used: false,
        ipAddress: null, // Will be set by the route handler
        userAgent: null, // Will be set by the route handler
      });

      Logger.info(`[UserService] Password reset token created successfully`);
      return token;

    } catch (error) {
      Logger.error(`[UserService] Error creating password reset token:`, (error as Error).message);
      throw error;
    }
  }

  async validateResetToken(token: string) {
    try {
      Logger.info(`[UserService] Validating reset token: ${token.substring(0, 10)}...`);

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

      const isValid = result.length > 0;
      Logger.info(`[UserService] Token validation result: ${isValid ? 'valid' : 'invalid'}`);

      return isValid ? result[0] : null;
      
    } catch (error) {
      Logger.error(`[UserService] Error validating reset token:`, (error as Error).message);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      Logger.info(`[UserService] Attempting to reset password with token: ${token.substring(0, 10)}...`);

      const tokenData = await this.validateResetToken(token);
      
      if (!tokenData) {
        Logger.warn(`[UserService] Invalid or expired token used`);
        throw new Error('Invalid or expired token');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      Logger.info(`[UserService] Password hashed successfully`);

      // Update password in database
      const updateResult = await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenData.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ 
          used: true, 
          usedAt: new Date() 
        })
        .where(eq(passwordResetTokens.id, tokenData.id));

      Logger.info(`[UserService] Password reset completed successfully for user: ${tokenData.userId}`);
      return true;

    } catch (error) {
      Logger.error(`[UserService] Error resetting password:`, (error as Error).message);
      throw error;
    }
  }

  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    message: string;
    debugInfo?: any;
  }> {
    try {
      Logger.info(`[UserService] Password reset request for: ${email}`);

      const user = await this.findUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      if (!user) {
        Logger.info(`[UserService] No user found for email: ${email}, returning success anyway`);
        return { 
          success: true, 
          message: 'If an account exists with that email, reset instructions have been sent.',
          debugInfo: { userFound: false }
        };
      }

      // Create reset token
      const token = await this.createPasswordResetToken(user.id);
      
      // Update token with request details
      if (ipAddress || userAgent) {
        await db
          .update(passwordResetTokens)
          .set({ 
            ipAddress: ipAddress || null,
            userAgent: userAgent || null
          })
          .where(eq(passwordResetTokens.token, token));
      }

      // Generate reset link
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      
      Logger.info(`[UserService] Generated reset link: ${resetLink}`);

      // Send email
      await this.emailService.sendPasswordResetEmail(user.email, resetLink);

      Logger.info(`[UserService] Password reset email sent successfully to: ${user.email}`);

      return { 
        success: true, 
        message: 'If an account exists with that email, reset instructions have been sent.',
        debugInfo: { 
          userFound: true, 
          emailSent: true,
          resetLink: resetLink // Remove in production
        }
      };

    } catch (error) {
      Logger.error(`[UserService] Error processing password reset request:`, (error as Error).message);
      return {
        success: false,
        message: 'An error occurred processing your request. Please try again.',
        debugInfo: { error: (error as Error).message }
      };
    }
  }
}