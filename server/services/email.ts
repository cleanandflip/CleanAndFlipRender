import { Resend } from 'resend';
import { logger } from '../config/logger';

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
  private resend!: Resend;
  private fromEmail!: string;
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
      // For now, use onboarding@resend.dev until domain is verified
      this.fromEmail = 'Clean & Flip <onboarding@resend.dev>';
      this.isInitialized = true;
      
      logger.info('Resend email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resend email service:', error);
    }
  }

  async sendOrderConfirmation(orderData: OrderEmailData): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Email service not available - order confirmation not sent');
      return false;
    }

    try {
      const emailHtml = this.generateOrderConfirmationHTML(orderData);
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: orderData.customerEmail,
        subject: `Order Confirmation - #${orderData.orderNumber}`,
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send order confirmation via Resend:', error);
        this.handleEmailError(error, 'order confirmation');
        return false;
      }

      logger.info(`Order confirmation email sent for order ${orderData.orderId}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
    if (!this.isInitialized) {
      logger.warn('Email service not available - password reset not sent');
      return false;
    }

    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const emailHtml = this.getPasswordResetTemplate(resetUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Password - Clean & Flip',
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send password reset via Resend:', error);
        this.handleEmailError(error, 'password reset');
        return false;
      }

      logger.info(`Password reset email sent to ${email}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendShippingNotification(orderData: OrderEmailData, trackingNumber: string, carrier: string = 'USPS'): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const emailHtml = this.getShippingNotificationTemplate(orderData, trackingNumber, carrier);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: orderData.customerEmail,
        subject: `Your Order Has Shipped - #${orderData.orderNumber}`,
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send shipping notification via Resend:', error);
        this.handleEmailError(error, 'shipping notification');
        return false;
      }

      logger.info(`Shipping notification sent for order ${orderData.orderId}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send shipping notification:', error);
      return false;
    }
  }

  async sendAbandonedCartReminder(email: string, cartItems: any[]): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const emailHtml = this.getAbandonedCartTemplate(cartItems);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Complete Your Purchase - Clean & Flip',
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send abandoned cart email via Resend:', error);
        this.handleEmailError(error, 'abandoned cart reminder');
        return false;
      }

      logger.info(`Abandoned cart email sent to ${email}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send abandoned cart email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const emailHtml = this.getWelcomeEmailTemplate(userName);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: 'Welcome to Clean & Flip!',
        html: emailHtml,
      });

      if (error) {
        logger.error('Failed to send welcome email via Resend:', error);
        this.handleEmailError(error, 'welcome email');
        return false;
      }

      logger.info(`Welcome email sent to ${userEmail}. Email ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return false;
    }
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Clean & Flip</h1>
            <h2 style="color: #333; margin: 10px 0;">Password Reset Request</h2>
          </div>
          
          <p>You requested a password reset for your Clean & Flip account.</p>
          <p>Click the link below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Thank you for choosing Clean & Flip!</p>
          </div>
        </div>
      </div>
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