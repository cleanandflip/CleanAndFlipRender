import { Resend } from 'resend';
import { logger } from '../config/logger';
import { db } from '../db';
import { emailLogs } from '../../shared/schema';

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

// Email routing configuration
const EMAIL_ROUTING = {
  // Support emails (from support@cleanandflip.com)
  password_reset: {
    from: 'Clean & Flip Support <support@cleanandflip.com>',
    replyTo: 'support@cleanandflip.com',
    category: 'support'
  },
  password_reset_success: {
    from: 'Clean & Flip Support <support@cleanandflip.com>',
    replyTo: 'support@cleanandflip.com',
    category: 'support'
  },
  welcome: {
    from: 'Clean & Flip Support <support@cleanandflip.com>',
    replyTo: 'support@cleanandflip.com',
    category: 'support'
  },
  equipment_submission: {
    from: 'Clean & Flip Support <support@cleanandflip.com>',
    replyTo: 'support@cleanandflip.com',
    category: 'support'
  },
  abandoned_cart: {
    from: 'Clean & Flip Support <support@cleanandflip.com>',
    replyTo: 'support@cleanandflip.com',
    category: 'marketing'
  },

  // Order emails (from orders@cleanandflip.com)
  order_confirmation: {
    from: 'Clean & Flip Orders <orders@cleanandflip.com>',
    replyTo: 'orders@cleanandflip.com',
    bcc: 'admin@cleanandflip.com',
    category: 'transactional'
  },
  order_status_update: {
    from: 'Clean & Flip Orders <orders@cleanandflip.com>',
    replyTo: 'orders@cleanandflip.com',
    category: 'transactional'
  },
  shipping_notification: {
    from: 'Clean & Flip Orders <orders@cleanandflip.com>',
    replyTo: 'orders@cleanandflip.com',
    category: 'transactional'
  },

  // Admin emails (from admin@cleanandflip.com)
  admin_notification: {
    from: 'Clean & Flip Admin <admin@cleanandflip.com>',
    to: 'admin@cleanandflip.com',
    replyTo: 'admin@cleanandflip.com',
    category: 'admin'
  },
  low_stock_alert: {
    from: 'Clean & Flip Admin <admin@cleanandflip.com>',
    to: 'admin@cleanandflip.com',
    replyTo: 'admin@cleanandflip.com',
    category: 'admin'
  }
};

export class EmailService {
  private resend!: Resend;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    try {
      // Get API key from environment
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.error('RESEND_API_KEY is not set in environment variables');
        return;
      }
      
      this.resend = new Resend(apiKey);
      this.isInitialized = true;
      
      logger.info('Resend email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resend email service:', error);
    }
  }

  async sendOrderConfirmation(orderData: OrderEmailData): Promise<boolean> {
    return this.send('order_confirmation', {
      to: orderData.customerEmail,
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      ...orderData
    });
  }

  // Generic send method that uses routing configuration
  async send(templateType: string, data: any): Promise<boolean> {
    const routing = EMAIL_ROUTING[templateType];
    
    if (!routing) {
      logger.error(`Unknown email template type: ${templateType}`);
      return false;
    }

    if (!this.isInitialized) {
      logger.warn('Email service not available');
      return false;
    }

    try {
      // Use domain-verified cleanandflip.com addresses
      const fromEmail = routing.from;

      logger.info(`Sending ${templateType} email:`, {
        from: fromEmail,
        to: data.to || routing.to,
        category: routing.category
      });

      const emailOptions = {
        from: fromEmail,
        to: data.to || routing.to,
        replyTo: routing.replyTo,
        bcc: routing.bcc,
        subject: data.subject || this.getDefaultSubject(templateType),
        html: this.getEmailTemplate(templateType, data),
        tags: [
          { name: 'category', value: routing.category },
          { name: 'type', value: templateType }
        ]
      };

      // Send via Resend
      const { data: result, error } = await this.resend.emails.send(emailOptions);

      if (error) {
        logger.error(`Failed to send ${templateType} email via Resend:`, error);
        await this.logEmail({
          toEmail: emailOptions.to,
          fromEmail: emailOptions.from,
          subject: emailOptions.subject,
          templateType,
          status: 'failed',
          error: error.message || JSON.stringify(error),
          metadata: { category: routing.category }
        });
        return false;
      }

      // Log success
      await this.logEmail({
        toEmail: emailOptions.to,
        fromEmail: emailOptions.from,
        subject: emailOptions.subject,
        templateType,
        status: 'sent',
        sentAt: new Date(),
        metadata: { 
          resendId: result?.id,
          category: routing.category 
        }
      });

      logger.info(`${templateType} email sent successfully. Email ID: ${result?.id}`);
      return true;
    } catch (error) {
      logger.error(`Error sending ${templateType} email:`, error);
      
      // Log failure
      await this.logEmail({
        toEmail: data.to || routing.to,
        fromEmail: routing.from,
        subject: data.subject || this.getDefaultSubject(templateType),
        templateType,
        status: 'failed',
        error: error.message,
        metadata: { category: routing.category }
      });

      return false;
    }
  }

  // Specific methods for each email type
  async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    return this.send('password_reset', {
      to: email,
      subject: 'Reset Your Clean & Flip Password',
      resetUrl,
      resetToken
    });
  }

  async sendShippingNotification(orderData: OrderEmailData, trackingNumber: string, carrier: string = 'USPS'): Promise<boolean> {
    return this.send('shipping_notification', {
      to: orderData.customerEmail,
      subject: `Your Order Has Shipped - #${orderData.orderNumber}`,
      trackingNumber,
      carrier,
      ...orderData
    });
  }

  async sendWelcomeEmail(data: { to: string; userName: string; discountCode?: string }): Promise<boolean> {
    return this.send('welcome', {
      ...data,
      subject: 'Welcome to Clean & Flip!'
    });
  }

  async sendAdminNotification(data: { type: string; message: string; metadata?: any }): Promise<boolean> {
    return this.send('admin_notification', {
      ...data,
      subject: `Admin Alert: ${data.type}`
    });
  }

  async sendAbandonedCartReminder(email: string, cartItems: any[]): Promise<boolean> {
    return this.send('abandoned_cart', {
      to: email,
      subject: 'Complete Your Purchase - Clean & Flip',
      cartItems
    });
  }

  // Helper methods
  private getEmailTemplate(templateType: string, data: any): string {
    switch (templateType) {
      case 'password_reset':
        return this.getPasswordResetTemplate(data.resetUrl);
      case 'order_confirmation':
        return this.generateOrderConfirmationHTML(data);
      case 'shipping_notification':
        return this.getShippingNotificationTemplate(data, data.trackingNumber, data.carrier);
      case 'welcome':
        return this.getWelcomeEmailTemplate(data.userName);
      case 'admin_notification':
        return this.getAdminNotificationTemplate(data.type, data.message, data.metadata);
      case 'abandoned_cart':
        return this.getAbandonedCartTemplate(data.cartItems);
      default:
        return this.getDefaultTemplate(templateType, data);
    }
  }

  private getDefaultSubject(templateType: string): string {
    const subjects = {
      password_reset: 'Reset Your Password - Clean & Flip',
      welcome: 'Welcome to Clean & Flip!',
      order_confirmation: 'Order Confirmation - Clean & Flip',
      shipping_notification: 'Your Order Has Shipped - Clean & Flip',
      admin_notification: 'Admin Notification - Clean & Flip',
      abandoned_cart: 'Complete Your Purchase - Clean & Flip'
    };

    return subjects[templateType] || 'Clean & Flip Notification';
  }

  private async logEmail(logData: any): Promise<void> {
    try {
      await db.insert(emailLogs).values({
        toEmail: logData.toEmail,
        fromEmail: logData.fromEmail,
        subject: logData.subject,
        templateType: logData.templateType,
        status: logData.status,
        sentAt: logData.sentAt || null,
        error: logData.error || null,
        metadata: logData.metadata || {}
      });
    } catch (error) {
      logger.error('Failed to log email:', error);
    }
  }

  private getDefaultTemplate(templateType: string, data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">${templateType.replace('_', ' ').toUpperCase()}</h2>
          </div>
          <p>This is a ${templateType} notification from Clean & Flip.</p>
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
          </div>
        </div>
      </div>
    `;
  }

  private getAdminNotificationTemplate(type: string, message: string, metadata?: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <div style="margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 18px;">🚨 ADMIN ALERT</h1>
            <h2 style="color: #333; margin: 10px 0;">${type}</h2>
          </div>
          <p style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0;">${message}</p>
          ${metadata ? `<pre style="background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px;">${JSON.stringify(metadata, null, 2)}</pre>` : ''}
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Clean & Flip Admin System</p>
          </div>
        </div>
      </div>
    `;
  }



  async sendReturnStatusUpdate(userEmail: string, returnRequest: any, status: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const emailHtml = this.getReturnStatusTemplate(returnRequest, status);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: `Return Request Update - #${returnRequest.returnNumber}`,
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send return status update via Resend:', error);
        this.handleEmailError(error, 'return status update');
        return false;
      }

      logger.info(`Return status update sent to ${userEmail}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send return status update:', error);
      return false;
    }
  }

  private handleEmailError(error: any, emailType: string) {
    if (error.name === 'validation_error') {
      logger.error(`Email validation error for ${emailType}:`, error.message);
    } else if (error.name === 'rate_limit_error') {
      logger.error(`Rate limit exceeded for ${emailType}`);
    } else {
      logger.error(`Unknown error sending ${emailType}:`, error);
    }
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - Clean & Flip</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .support-header { color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="support-header">Support Team</div>
              <h1 style="margin: 0;">Clean & Flip</h1>
              <p style="margin: 10px 0;">Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password for your Clean & Flip account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
              </p>
              <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Clean & Flip. All rights reserved.</p>
              <p>Asheville, NC | <a href="mailto:support@cleanandflip.com">support@cleanandflip.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getShippingNotificationTemplate(orderData: OrderEmailData, trackingNumber: string, carrier: string): string {
    const trackingUrl = `${process.env.APP_URL || 'http://localhost:5000'}/track/${orderData.orderNumber}`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Your Order Has Shipped!</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">Shipping Details</h3>
            <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Carrier:</strong> ${carrier}</p>
          </div>
          
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Track Your Order</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Your order will arrive at the shipping address provided during checkout.</p>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
          </div>
        </div>
      </div>
    `;
  }

  private getAbandonedCartTemplate(cartItems: any[]): string {
    const cartUrl = `${process.env.APP_URL || 'http://localhost:5000'}/cart`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Don't Forget Your Items!</h2>
          </div>
          
          <p>You left some great items in your cart. Complete your purchase before they're gone!</p>
          
          <div style="margin: 20px 0;">
            ${cartItems.map(item => `
              <div style="border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between;">
                <strong>${item.product?.name || item.name}</strong>
                <span>$${item.product?.price || item.price}</span>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${cartUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Complete Purchase</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
          </div>
        </div>
      </div>
    `;
  }

  private getWelcomeEmailTemplate(userName: string): string {
    const shopUrl = `${process.env.APP_URL || 'http://localhost:5000'}/products`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Welcome to Clean & Flip!</h2>
          </div>
          
          <p>Hi ${userName},</p>
          <p>Welcome to Clean & Flip - your trusted marketplace for premium weightlifting and fitness equipment!</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">What you can do:</h3>
            <ul>
              <li>Browse our extensive collection of verified equipment</li>
              <li>Sell your used gear and get cash offers</li>
              <li>Read reviews from real customers</li>
              <li>Track your orders in real-time</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${shopUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Start Shopping</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for joining Clean & Flip!</p>
            <p>Happy lifting! 🏋️</p>
          </div>
        </div>
      </div>
    `;
  }

  private getReturnStatusTemplate(returnRequest: any, status: string): string {
    const statusMessages: Record<string, string> = {
      approved: 'Your return request has been approved! We\'ll send you return instructions shortly.',
      rejected: 'Unfortunately, your return request could not be approved at this time.',
      completed: 'Your return has been processed and your refund is on the way!'
    };
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Return Request Update</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">Return Details</h3>
            <p><strong>Return Number:</strong> #${returnRequest.returnNumber}</p>
            <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
            <p><strong>Order:</strong> #${returnRequest.orderId}</p>
          </div>
          
          <p>${statusMessages[status] || 'Your return request has been updated.'}</p>
          
          ${returnRequest.adminNotes ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">Additional Notes:</h4>
              <p style="margin-bottom: 0;">${returnRequest.adminNotes}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
          </div>
        </div>
      </div>
    `;
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