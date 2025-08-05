import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { emailService } from './email';
import { findUserByEmail } from '../utils/user-lookup';

export class PasswordResetService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY_HOURS = 1;
  private static readonly RATE_LIMIT_MINUTES = 2;
  
  // In-memory rate limiting (replace with Redis in production)
  private static rateLimitMap = new Map<string, Date>();
  
  /**
   * Request password reset with deduplication
   */
  static async requestPasswordReset(
    email: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{ success: boolean; message: string; debugInfo?: any }> {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      const rateLimitKey = `${email}:${ipAddress}`;
      const lastRequest = this.rateLimitMap.get(rateLimitKey);
      
      if (lastRequest) {
        const minutesSinceLastRequest = (Date.now() - lastRequest.getTime()) / 60000;
        if (minutesSinceLastRequest < this.RATE_LIMIT_MINUTES) {
          console.log(`[RATE_LIMIT] Too many requests for ${email} from ${ipAddress}`);
          return { 
            success: true, 
            message: 'If an account exists, reset email sent',
            debugInfo: { rateLimited: true }
          };
        }
      }
      
      // Update rate limit
      this.rateLimitMap.set(rateLimitKey, new Date());
      
      // Find user with improved lookup
      console.log(`[PASSWORD_RESET] Starting reset process for: ${email}`);
      const user = await findUserByEmail(email);
      
      if (!user) {
        console.log(`[PASSWORD_RESET] No user found for email: ${email}`);
        // Still return success to prevent email enumeration
        return { 
          success: true, 
          message: 'If an account exists, reset email sent',
          debugInfo: { userFound: false }
        };
      }
      
      console.log(`[PASSWORD_RESET] User found: ID ${user.id}, Email: ${user.email}`);
      
      // Check for existing valid token to prevent duplicates
      const existingTokenResult = await db.execute(sql`
        SELECT id, created_at 
        FROM password_reset_tokens
        WHERE user_id = ${user.id}
          AND used = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      if (existingTokenResult.rows.length > 0) {
        const tokenAge = (Date.now() - new Date(existingTokenResult.rows[0].created_at as string).getTime()) / 60000;
        if (tokenAge < 5) { // Token created less than 5 minutes ago
          console.log(`[PASSWORD_RESET] Recent token exists, skipping email`);
          return { 
            success: true, 
            message: 'If an account exists, reset email sent',
            debugInfo: { recentTokenExists: true, tokenAge }
          };
        }
      }
      
      // Invalidate all old tokens for this user
      await db.execute(sql`
        UPDATE password_reset_tokens
        SET used = true, used_at = NOW()
        WHERE user_id = ${user.id} AND used = false
      `);
      
      // Generate new token
      const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const hashedToken = await bcrypt.hash(rawToken, 10);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);
      
      // Insert new token
      await db.execute(sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
        VALUES (${user.id}, ${hashedToken}, ${expiresAt}, ${ipAddress}, ${userAgent})
      `);
      
      // Generate reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://cleanandflip.com'
        : process.env.FRONTEND_URL || 'http://localhost:5173';
        
      const resetLink = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
      
      console.log(`[PASSWORD_RESET] Generated reset link for user ${user.id}`);
      console.log(`Generated reset link: ${resetLink}`);
      
      // Send email immediately
      try {
        await emailService.sendPasswordReset(user.email, rawToken, resetLink);
        
        const elapsed = Date.now() - startTime;
        console.log(`[PASSWORD_RESET] Email sent successfully in ${elapsed}ms`);
        
      } catch (emailError) {
        console.error('[PASSWORD_RESET] Email send error:', emailError);
        // Don't expose email errors to user
      }
      
      // Log activity
      try {
        await db.execute(sql`
          INSERT INTO activity_logs (user_id, action, metadata, created_at)
          VALUES (${String(user.id)}, 'password_reset_requested', ${JSON.stringify({ email: String(user.email), ip: ipAddress })}, NOW())
        `);
      } catch (logError) {
        console.log('[DEBUG] Activity log failed, continuing without logging:', logError);
      }
      
      console.log(`[DEBUG] Password reset completed successfully for: ${user.email}`);
      
      return { 
        success: true, 
        message: 'If an account exists, reset email sent',
        debugInfo: { 
          userFound: true, 
          emailSent: true,
          elapsed: Date.now() - startTime 
        }
      };
      
    } catch (error) {
      console.error('[PASSWORD_RESET] Unexpected error:', error);
      // Still return success to prevent information leakage
      return { 
        success: true, 
        message: 'If an account exists, reset email sent',
        debugInfo: { error: (error as Error).message }
      };
    }
  }
  
  /**
   * Validate reset token
   */
  static async validateResetToken(token: string, email?: string): Promise<{
    valid: boolean;
    userId?: number;
    email?: string;
    error?: string;
  }> {
    try {
      if (!token) {
        return { valid: false, error: 'No token provided' };
      }
      
      // Get all non-expired, unused tokens
      const tokensResult = await db.execute(sql`
        SELECT 
          prt.id,
          prt.user_id,
          prt.token,
          prt.expires_at,
          u.email
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.used = false
          AND prt.expires_at > NOW()
      `);
      
      // Check each token
      for (const row of tokensResult.rows) {
        const isValid = await bcrypt.compare(token, row.token as string);
        
        if (isValid) {
          // If email provided, verify it matches
          if (email && (row.email as string).toLowerCase() !== email.toLowerCase()) {
            return { valid: false, error: 'Token and email mismatch' };
          }
          
          return {
            valid: true,
            userId: row.user_id as number,
            email: row.email as string
          };
        }
      }
      
      return { valid: false, error: 'Invalid or expired token' };
      
    } catch (error) {
      console.error('[TOKEN_VALIDATION] Error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }
  
  /**
   * Reset password
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    email: string,
    ipAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate token
      const validation = await this.validateResetToken(token, email);
      
      if (!validation.valid || !validation.userId) {
        return { 
          success: false, 
          message: validation.error || 'Invalid or expired token' 
        };
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      await db.execute(sql`
        UPDATE users
        SET password = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${validation.userId}
      `);
      
      // Mark token as used
      await db.execute(sql`
        UPDATE password_reset_tokens
        SET used = true, used_at = NOW()
        WHERE user_id = ${validation.userId} AND used = false
      `);
      
      console.log(`[PASSWORD_RESET] Password successfully reset for user ${validation.userId}`);
      
      // Send confirmation email
      try {
        // Note: Add this method to email service if needed
        console.log(`[PASSWORD_RESET] Password reset confirmed for ${validation.email}`);
        // await emailService.sendPasswordResetConfirmation(validation.email!, ipAddress);
      } catch (emailError) {
        console.error('[PASSWORD_RESET] Confirmation email error:', emailError);
      }
      
      return { 
        success: true, 
        message: 'Password successfully reset' 
      };
      
    } catch (error) {
      console.error('[PASSWORD_RESET] Reset error:', error);
      return { 
        success: false, 
        message: 'Failed to reset password' 
      };
    }
  }
  
  /**
   * Clean up expired tokens (run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await db.execute(sql`
        DELETE FROM password_reset_tokens
        WHERE expires_at < NOW() OR used = true
      `);
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('[PASSWORD_RESET] Cleanup error:', error);
      return 0;
    }
  }
}