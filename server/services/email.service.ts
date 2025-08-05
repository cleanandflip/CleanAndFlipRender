import { Resend } from 'resend';
import { db } from '../db';
import { emailLogs } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../config/logger';

// Email configuration based on type
const EMAIL_CONFIG = {
  admin: {
    from: 'Clean & Flip Admin <onboarding@resend.dev>',
    replyTo: 'admin@cleanandflip.com'
  },
  support: {
    from: 'Clean & Flip Support <onboarding@resend.dev>',
    replyTo: 'support@cleanandflip.com'
  },
  orders: {
    from: 'Clean & Flip Orders <onboarding@resend.dev>',
    replyTo: 'orders@cleanandflip.com'
  }
};

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  templateType: string;
  metadata?: Record<string, any>;
  replyTo?: string;
  bcc?: string;
}

interface PasswordResetEmailData {
  to: string;
  userName: string;
  resetLink: string;
  ipAddress: string;
  userAgent: string;
  expiresIn: string;
}

interface PasswordResetSuccessEmailData {
  to: string;
  userName: string;
  ipAddress: string;
  timestamp: string;
}

interface WelcomeEmailData {
  to: string;
  userName: string;
  loginLink?: string;
}

interface OrderConfirmationEmailData {
  to: string;
  userName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export class EmailService {
  private resend!: Resend;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.error('RESEND_API_KEY is not set in environment variables');
        return;
      }
      
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      logger.info('Enhanced email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize enhanced email service:', error);
    }
  }

  // Core send method with logging
  async send(options: EmailOptions): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    let logEntryId: string | null = null;

    try {
      // Log email attempt
      const [logEntry] = await db.insert(emailLogs).values({
        toEmail: options.to,
        fromEmail: options.from,
        subject: options.subject,
        templateType: options.templateType,
        status: 'pending',
        metadata: options.metadata || {}
      }).returning();

      logEntryId = logEntry.id;

      // Send via Resend
      const result = await this.resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
        bcc: options.bcc
      });

      // Update log with success
      await db.update(emailLogs)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(emailLogs.id, logEntry.id));

      logger.info(`Email sent successfully to ${options.to} with template ${options.templateType}`);
      return result;

    } catch (error: any) {
      // Log failure
      if (logEntryId) {
        await db.update(emailLogs)
          .set({ 
            status: 'failed', 
            error: error.message 
          })
          .where(eq(emailLogs.id, logEntryId));
      }
      
      logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  // Password reset email
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<any> {
    const html = this.generatePasswordResetHTML(data);
    
    return this.send({
      to: data.to,
      from: EMAIL_CONFIG.support.from,
      replyTo: EMAIL_CONFIG.support.replyTo,
      subject: 'Reset Your Clean & Flip Password',
      html,
      templateType: 'password_reset',
      metadata: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresIn: data.expiresIn
      }
    });
  }

  // Password reset success email
  async sendPasswordResetSuccessEmail(data: PasswordResetSuccessEmailData): Promise<any> {
    const html = this.generatePasswordResetSuccessHTML(data);
    
    return this.send({
      to: data.to,
      from: EMAIL_CONFIG.support.from,
      replyTo: EMAIL_CONFIG.support.replyTo,
      subject: 'Password Changed Successfully',
      html,
      templateType: 'password_reset_success',
      metadata: {
        ipAddress: data.ipAddress,
        timestamp: data.timestamp
      }
    });
  }

  // Welcome email
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<any> {
    const html = this.generateWelcomeHTML(data);
    
    return this.send({
      to: data.to,
      from: EMAIL_CONFIG.admin.from,
      replyTo: EMAIL_CONFIG.admin.replyTo,
      subject: 'Welcome to Clean & Flip!',
      html,
      templateType: 'welcome',
      metadata: {
        userName: data.userName
      }
    });
  }

  // Order confirmation email
  async sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<any> {
    const html = this.generateOrderConfirmationHTML(data);
    
    return this.send({
      to: data.to,
      from: EMAIL_CONFIG.orders.from,
      replyTo: EMAIL_CONFIG.orders.replyTo,
      bcc: 'onboarding@resend.dev', // Admin gets copy
      subject: `Order Confirmation - #${data.orderNumber}`,
      html,
      templateType: 'order_confirmation',
      metadata: {
        orderNumber: data.orderNumber,
        total: data.total
      }
    });
  }

  // HTML template generators
  private generatePasswordResetHTML(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .security-info { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; margin-top: 24px; font-size: 14px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Clean & Flip</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName},</h2>
              <p>We received a request to reset your password for your Clean & Flip account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${data.resetLink}" class="button">Reset Password</a>
              </div>
              
              <p>This link will expire in ${data.expiresIn}. If you didn't request this password reset, you can safely ignore this email.</p>
              
              <div class="security-info">
                <strong>Security Information:</strong><br>
                Request made from IP: ${data.ipAddress}<br>
                User Agent: ${data.userAgent}<br>
                Time: ${new Date().toLocaleString()}
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${data.resetLink}</p>
            </div>
            <div class="footer">
              <p>Clean & Flip - Premium Weightlifting Equipment</p>
              <p>If you have questions, contact us at support@cleanandflip.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetSuccessHTML(data: PasswordResetSuccessEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Changed Successfully</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .security-info { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; margin-top: 24px; font-size: 14px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Clean & Flip</h1>
              <p>✅ Password Changed Successfully</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName},</h2>
              <p>Your password has been successfully changed. Your account is now secure with your new password.</p>
              
              <p>If you did not make this change, please contact our support team immediately at support@cleanandflip.com.</p>
              
              <div class="security-info">
                <strong>Security Information:</strong><br>
                Changed from IP: ${data.ipAddress}<br>
                Time: ${new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
            <div class="footer">
              <p>Clean & Flip - Premium Weightlifting Equipment</p>
              <p>If you have questions, contact us at support@cleanandflip.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateWelcomeHTML(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Clean & Flip</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { text-align: center; padding: 20px; background: #f8fafc; border-radius: 6px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Welcome to Clean & Flip!</h1>
              <p>Premium Weightlifting Equipment Marketplace</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName},</h2>
              <p>Welcome to Clean & Flip! We're excited to have you join our community of fitness enthusiasts.</p>
              
              <div class="features">
                <div class="feature">
                  <h3>🛒 Shop Premium Equipment</h3>
                  <p>Browse our curated selection of quality weightlifting gear</p>
                </div>
                <div class="feature">
                  <h3>💰 Sell Your Equipment</h3>
                  <p>Get top dollar for equipment you no longer need</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.loginLink || process.env.FRONTEND_URL || 'http://localhost:5000'}" class="button">Start Shopping</a>
              </div>
              
              <p>Questions? Our support team is here to help at support@cleanandflip.com</p>
            </div>
            <div class="footer">
              <p>Clean & Flip - Premium Weightlifting Equipment</p>
              <p>Asheville, NC | support@cleanandflip.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderConfirmationHTML(data: OrderConfirmationEmailData): string {
    const itemsHTML = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            .total-row { background: #f8fafc; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ Clean & Flip</h1>
              <p>✅ Order Confirmed!</p>
            </div>
            <div class="content">
              <h2>Thanks for your order, ${data.userName}!</h2>
              <p>Your order <strong>#${data.orderNumber}</strong> has been confirmed and will be processed shortly.</p>
              <p><strong>Order Date:</strong> ${data.orderDate}</p>
              
              <h3>Order Items:</h3>
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr class="total-row">
                    <td style="padding: 10px;">Subtotal</td>
                    <td style="padding: 10px;"></td>
                    <td style="padding: 10px; text-align: right;">$${data.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td style="padding: 10px;">Tax</td>
                    <td style="padding: 10px;"></td>
                    <td style="padding: 10px; text-align: right;">$${data.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td style="padding: 10px;">Shipping</td>
                    <td style="padding: 10px;"></td>
                    <td style="padding: 10px; text-align: right;">$${data.shipping.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row" style="background: #1e3a8a; color: white;">
                    <td style="padding: 15px; font-size: 18px;"><strong>Total</strong></td>
                    <td style="padding: 15px;"></td>
                    <td style="padding: 15px; text-align: right; font-size: 18px;"><strong>$${data.total.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <h3>Shipping Address:</h3>
              <p>
                ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                ${data.shippingAddress.street}<br>
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}
              </p>
              
              <p>We'll send you another email when your order ships. Questions? Contact us at orders@cleanandflip.com</p>
            </div>
            <div class="footer">
              <p>Clean & Flip - Premium Weightlifting Equipment</p>
              <p>Asheville, NC | orders@cleanandflip.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();