import { UserService } from './user.service';
import { EmailService } from './email.service';

export class PasswordResetService {
  private userService: UserService;
  private emailService: EmailService;
  
  constructor() {
    this.userService = new UserService();
    this.emailService = new EmailService();
  }
  
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    console.log(`[PasswordResetService] Starting reset for: ${email}`);
    
    try {
      // Find user
      const user = await this.userService.findUserByEmail(email);
      
      // ALWAYS return success (security)
      if (!user) {
        console.log('[PasswordResetService] No user found, returning success anyway');
        return {
          success: true,
          message: 'If an account exists, a reset link has been sent.'
        };
      }
      
      console.log(`[PasswordResetService] User found: ${user.id}`);
      
      // Create token
      const token = await this.userService.createPasswordResetToken(user.id);
      
      // Send email
      const resetLink = `${process.env.APP_URL || 'https://cleanandflip.com'}/reset-password?token=${token}`;
      await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.first_name);
      
      console.log('[PasswordResetService] ✅ Reset email sent');
      
      return {
        success: true,
        message: 'If an account exists, a reset link has been sent.'
      };
      
    } catch (error) {
      console.error('[PasswordResetService] Error:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again.'
      };
    }
  }
  
  async validateToken(token: string): Promise<any> {
    return await this.userService.validateResetToken(token);
  }
  
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    return await this.userService.resetPassword(token, newPassword);
  }
}