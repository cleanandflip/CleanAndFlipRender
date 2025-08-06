import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;
  
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY!);
  }
  
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    userName?: string
  ): Promise<boolean> {
    try {
      console.log(`[EmailService] Sending email to: ${email}`);
      
      const { data, error } = await this.resend.emails.send({
        from: 'Clean & Flip <noreply@cleanandflip.com>',
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      
      if (error) {
        console.error('[EmailService] Error:', error);
        return false;
      }
      
      console.log('[EmailService] ✅ Email sent:', data?.id);
      return true;
      
    } catch (error) {
      console.error('[EmailService] Failed:', error);
      return false;
    }
  }
}