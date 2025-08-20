import { sql } from 'drizzle-orm';
import { users } from '../../shared/schema';
import { Resend } from 'resend';
import { Logger } from './logger';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Normalize email to lowercase and trim whitespace
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim();
}

/**
 * Create case-insensitive email condition for database queries
 */
export function createEmailCondition(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return sql`LOWER(${users.email}) = ${normalizedEmail}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.indexOf('@');
  return atIndex !== -1 ? normalized.substring(atIndex + 1) : '';
}
// [MERGED FROM] /home/runner/workspace/server/services/email.ts
export interface OrderEmailData {
  id: string;
  orderNumber: string;
  totalAmount: number;
  user: {
    email: string;
    firstName?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingNumber?: string;
  carrier?: string;
}

// [MERGED FROM] /home/runner/workspace/server/services/email.ts
export interface SubmissionEmailData {
  id: string;
  name: string;
  brand?: string;
  condition: string;
  offerAmount?: number;
  user: {
    email: string;
    firstName?: string;
  };
}

// Email service using support@cleanandflip.com for all communications
export const emailService = {
  async sendOrderConfirmation(order: OrderEmailData) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: order.user.email,
        subject: `Order Confirmed #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Order Confirmed! 🏋️</h1>
              
              <p>Hi ${order.user.firstName || 'there'},</p>
              <p>Thank you for your order! We've received your payment and are preparing your items.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
                
                <h4>Items:</h4>
                <ul>
                  ${order.items.map(item => 
                    `<li>${item.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)}</li>`
                  ).join('')}
                </ul>
                
                ${order.shippingAddress ? `
                  <h4>Shipping Address:</h4>
                  <p>
                    ${order.shippingAddress.street}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </p>
                ` : ''}
              </div>
              
              <p>We'll notify you when your order ships. You can track your order status in your account dashboard.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
      });
      
      if (error) {
        Logger.error('Order confirmation email error:', error);
        throw error;
      }
      
      Logger.info(`Order confirmation email sent for order ${order.orderNumber}`);
      return data;
      
    } catch (error: any) {
      Logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  },
  
  async sendShippingNotification(order: OrderEmailData) {
    if (!order.trackingNumber || !order.carrier) {
      throw new Error('Tracking information required for shipping notification');
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: order.user.email,
        subject: `Your Order Has Shipped! #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Your Order Has Shipped! 📦</h1>
              
              <p>Hi ${order.user.firstName || 'there'},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Tracking Information</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Carrier:</strong> ${order.carrier}</p>
                <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                
                ${order.shippingAddress ? `
                  <h4>Shipping To:</h4>
                  <p>
                    ${order.shippingAddress.street}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </p>
                ` : ''}
              </div>
              
              <p>You can track your package using the tracking number above on the ${order.carrier} website.</p>
              
              <p style="margin-top: 30px;">
                Thanks for choosing Clean & Flip!<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
      });
      
      if (error) {
        Logger.error('Shipping notification email error:', error);
        throw error;
      }
      
      Logger.info(`Shipping notification sent for order ${order.orderNumber}`);
      return data;
      
    } catch (error: any) {
      Logger.error('Failed to send shipping notification:', error);
      throw error;
    }
  },
  
  async sendEquipmentOfferEmail(submission: SubmissionEmailData) {
    if (!submission.offerAmount) {
      throw new Error('Offer amount required for equipment offer email');
    }
    
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: submission.user.email,
        subject: `Equipment Offer for Your ${submission.brand ? submission.brand + ' ' : ''}${submission.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Equipment Offer 💰</h1>
              
              <p>Hi ${submission.user.firstName || 'there'},</p>
              <p>We've reviewed your equipment submission and would like to make you an offer!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Equipment Details</h3>
                <p><strong>Item:</strong> ${submission.brand ? submission.brand + ' ' : ''}${submission.name}</p>
                <p><strong>Condition:</strong> ${submission.condition}</p>
                
                <h3 style="color: #28a745; margin-top: 20px;">Our Offer: $${submission.offerAmount.toFixed(2)}</h3>
              </div>
              
              <p>If you're interested in accepting this offer, please reply to this email or contact us through your dashboard.</p>
              <p>This offer is valid for 7 days from the date of this email.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
      });
      
      if (error) {
        Logger.error('Equipment offer email error:', error);
        throw error;
      }
      
      Logger.info(`Equipment offer email sent for submission ${submission.id}`);
      return data;
      
    } catch (error: any) {
      Logger.error('Failed to send equipment offer email:', error);
      throw error;
    }
  },
  
  async sendContactEmail(contactData: {
    name: string;
    email: string;
    topic: string;
    subject: string;
    message: string;
  }) {
    try {
      const fromEmail = process.env.RESEND_FROM!;
      Logger.info(`Sending email from: "${fromEmail}"`);
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: process.env.SUPPORT_TO!,
        replyTo: contactData.email,
        subject: `Contact Form: ${contactData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h1>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${contactData.name}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Topic:</strong> ${contactData.topic}</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                
                <h3 style="margin-top: 20px;">Message:</h3>
                <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                  ${contactData.message.replace(/\n/g, '<br>')}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This message was sent from the Clean & Flip contact form.
                You can reply directly to this email to respond to ${contactData.name}.
              </p>
            </div>
          </div>
        `
      });
      
      if (error) {
        Logger.error('Contact form email error:', error);
        throw error;
      }
      
      Logger.info(`Contact form email sent from ${contactData.email}`);
      return data;
      
    } catch (error: any) {
      Logger.error('Failed to send contact form email:', error);
      throw error;
    }
  }
}
