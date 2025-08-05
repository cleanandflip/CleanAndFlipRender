import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
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
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Use environment variables for email configuration
      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      };

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email service not configured - missing EMAIL_USER or EMAIL_PASSWORD');
        return;
      }

      this.transporter = nodemailer.createTransporter(emailConfig);
      
      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendOrderConfirmation(orderData: OrderEmailData): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not available - order confirmation not sent');
      return false;
    }

    try {
      const emailHtml = this.generateOrderConfirmationHTML(orderData);
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@cleanandflip.com',
        to: orderData.customerEmail,
        subject: `Order Confirmation - #${orderData.orderNumber}`,
        html: emailHtml,
      });

      logger.info(`Order confirmation email sent for order ${orderData.orderId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not available - password reset not sent');
      return false;
    }

    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Password Reset Request</h2>
          <p>You requested a password reset for your Clean & Flip account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@cleanandflip.com',
        to: email,
        subject: 'Password Reset - Clean & Flip',
        html: emailHtml,
      });

      logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendShippingNotification(orderData: OrderEmailData, trackingNumber: string): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      const trackingUrl = `${process.env.APP_URL || 'http://localhost:5000'}/track/${orderData.orderNumber}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Your Order Has Shipped!</h2>
          <p>Great news! Your order #${orderData.orderNumber} has been shipped.</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <a href="${trackingUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Your Order</a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Your order will arrive at the shipping address provided during checkout.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@cleanandflip.com',
        to: orderData.customerEmail,
        subject: `Your Order Has Shipped - #${orderData.orderNumber}`,
        html: emailHtml,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send shipping notification:', error);
      return false;
    }
  }

  async sendAbandonedCartReminder(email: string, cartItems: any[]): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      const cartUrl = `${process.env.APP_URL || 'http://localhost:5000'}/cart`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Don't Forget Your Items!</h2>
          <p>You left some great items in your cart. Complete your purchase before they're gone!</p>
          <div style="margin: 20px 0;">
            ${cartItems.map(item => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong>${item.product.name}</strong> - $${item.product.price}
              </div>
            `).join('')}
          </div>
          <a href="${cartUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Purchase</a>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@cleanandflip.com',
        to: email,
        subject: 'Complete Your Purchase - Clean & Flip',
        html: emailHtml,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send abandoned cart email:', error);
      return false;
    }
  }

  private generateOrderConfirmationHTML(orderData: OrderEmailData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Order Confirmation</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">Order Details</h3>
            <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
            <p><strong>Customer:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${orderData.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0;">${item.name}</td>
                  <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px 0; text-align: right;">$${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div style="border-top: 2px solid #1e40af; padding-top: 20px;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td>Subtotal:</td><td style="text-align: right;">$${orderData.subtotal.toFixed(2)}</td></tr>
              <tr><td>Tax:</td><td style="text-align: right;">$${orderData.tax.toFixed(2)}</td></tr>
              <tr><td>Shipping:</td><td style="text-align: right;">$${orderData.shipping.toFixed(2)}</td></tr>
              <tr style="font-weight: bold; font-size: 16px; border-top: 1px solid #ddd;">
                <td style="padding-top: 10px;">Total:</td>
                <td style="text-align: right; padding-top: 10px;">$${orderData.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">Shipping Address</h3>
            <p style="margin: 5px 0;">${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}</p>
            <p style="margin: 5px 0;">${orderData.shippingAddress.street}</p>
            <p style="margin: 5px 0;">${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
            <p>You'll receive another email when your order ships.</p>
          </div>
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailService();