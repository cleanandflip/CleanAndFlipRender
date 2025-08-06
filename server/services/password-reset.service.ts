import { UserService } from '../utils/user-lookup';
import { emailService } from './email';

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_HOURS = 1;
  private static readonly RATE_LIMIT_MINUTES = 1;
  
  // In-memory rate limiting (replace with Redis in production)
  private static rateLimitMap = new Map<string, Date>();

  /**
   * Request password reset with the new UserService
   */
  static async requestPasswordReset(
    email: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{ success: boolean; message: string; debugInfo?: any }> {
    console.log(`[PasswordResetService] Starting reset process for: ${email}`);
    
    try {
      // Rate limiting check
      const rateLimitKey = `${email}:${ipAddress}`;
      const lastRequest = this.rateLimitMap.get(rateLimitKey);
      
      if (lastRequest) {
        const minutesSinceLastRequest = (Date.now() - lastRequest.getTime()) / 60000;
        if (minutesSinceLastRequest < this.RATE_LIMIT_MINUTES) {
          console.log(`[PasswordResetService] Rate limited: ${email} from ${ipAddress}`);
          return { 
            success: true, 
            message: 'If an account exists, reset email sent',
            debugInfo: { rateLimited: true }
          };
        }
      }
      
      // Update rate limit
      this.rateLimitMap.set(rateLimitKey, new Date());
      
      // Find user with the new UserService
      const user = await UserService.findUserByEmail(email);
      
      if (!user) {
        console.log(`[PasswordResetService] No user found for email: ${email}`);
        return { 
          success: true, 
          message: 'If an account exists, reset email sent',
          debugInfo: { userFound: false }
        };
      }
      
      console.log(`[PasswordResetService] User found: ID ${user.id}, Email: ${user.email}`);
      
      // Create password reset token
      const token = await UserService.createPasswordResetToken(
        user.id, 
        ipAddress, 
        userAgent
      );
      
      // Generate reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://cleanandflip.com'
        : process.env.FRONTEND_URL || 'http://localhost:5173';
        
      const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      
      // Send email using the existing email service
      try {
        await emailService.sendPasswordResetEmail({
          to: user.email,
          firstName: user.firstName || 'User',
          resetLink,
          expiresIn: '1 hour',
          ipAddress,
          userAgent
        });
        
        console.log(`[PasswordResetService] ✅ Reset email sent successfully to ${user.email}`);
        
        return { 
          success: true, 
          message: 'If an account exists, reset email sent',
          debugInfo: { 
            emailSent: true, 
            userId: user.id,
            tokenCreated: true 
          }
        };
      } catch (emailError) {
        console.error('[PasswordResetService] ❌ Email sending failed:', emailError);
        
        return { 
          success: true, 
          message: 'If an account exists, reset email sent',
          debugInfo: { 
            emailError: true, 
            errorMessage: (emailError as Error).message 
          }
        };
      }
      
    } catch (error) {
      console.error('[PasswordResetService] 🔥 Reset process error:', error);
      return { 
        success: true, 
        message: 'If an account exists, reset email sent',
        debugInfo: { 
          systemError: true, 
          errorMessage: (error as Error).message 
        }
      };
    }
  }

  /**
   * Validate reset token using UserService
   */
  static async validateResetToken(token: string, email?: string): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
    error?: string;
  }> {
    try {
      if (!token) {
        return { valid: false, error: 'No token provided' };
      }
      
      const tokenData = await UserService.validateResetToken(token);
      
      if (!tokenData) {
        return { valid: false, error: 'Invalid or expired token' };
      }
      
      // If email provided, find user and verify it matches
      if (email) {
        const user = await UserService.findUserByEmail(email);
        if (!user || user.id !== tokenData.userId) {
          return { valid: false, error: 'Token and email mismatch' };
        }
        
        return {
          valid: true,
          userId: tokenData.userId,
          email: user.email
        };
      }
      
      return {
        valid: true,
        userId: tokenData.userId
      };
      
    } catch (error) {
      console.error('[PasswordResetService] Token validation error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Reset password using UserService
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    email: string,
    ipAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[PasswordResetService] Attempting password reset for email: ${email}`);
      
      // Validate token
      const validation = await this.validateResetToken(token, email);
      
      if (!validation.valid || !validation.userId) {
        console.log(`[PasswordResetService] Token validation failed: ${validation.error}`);
        return { 
          success: false, 
          message: validation.error || 'Invalid or expired token' 
        };
      }
      
      // Reset password using UserService
      const resetSuccess = await UserService.resetPassword(token, newPassword);
      
      if (resetSuccess) {
        console.log(`[PasswordResetService] ✅ Password successfully reset for user ${validation.userId}`);
        
        // Send confirmation email
        try {
          const user = await UserService.findUserByEmail(email);
          if (user) {
            await emailService.sendPasswordResetConfirmationEmail({
              to: user.email,
              firstName: user.firstName || 'User',
              ipAddress
            });
          }
        } catch (emailError) {
          console.error('[PasswordResetService] Confirmation email error:', emailError);
        }
        
        return { 
          success: true, 
          message: 'Password successfully reset' 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to reset password' 
        };
      }
      
    } catch (error) {
      console.error('[PasswordResetService] Reset error:', error);
      return { 
        success: false, 
        message: 'Failed to reset password' 
      };
    }
  }
}