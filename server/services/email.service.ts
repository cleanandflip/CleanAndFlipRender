import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import Logger from '../utils/logger';

export class EmailService {
  private transporter;

  constructor() {
    // Use environment variables for production
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    Logger.info('[EmailService] Nodemailer email service initialized');
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@cleanandflip.com',
      to: email,
      subject: 'Password Reset Request - Clean & Flip',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🏋️ Clean & Flip</h1>
            </div>
            
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your Clean & Flip account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
              <strong>⏰ This link will expire in 1 hour</strong>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${resetLink}</span>
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      Logger.info(`[EmailService] Password reset email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
      Logger.error(`[EmailService] Failed to send password reset email to ${email}:`, (error as Error).message);
      throw error;
    }
  }
}