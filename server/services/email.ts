import { Resend } from 'resend';
import { Logger } from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export const emailService = {
  async sendOrderConfirmation(order: OrderEmailData) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Clean & Flip <orders@cleanandflip.com>',
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
        from: 'Clean & Flip <orders@cleanandflip.com>',
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
        from: 'Clean & Flip <offers@cleanandflip.com>',
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
  }
};