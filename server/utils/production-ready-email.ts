import { emailService } from '../services/email';
import { storage } from '../storage';
import { Logger } from './logger';

// Production email helper functions that integrate with storage and admin functions
export const productionEmailHelpers = {
  async sendOrderConfirmationWithData(orderId: string) {
    try {
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      const user = await storage.getUser(order.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      
      const emailData = {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        totalAmount: order.totalAmount,
        user: {
          email: user.email!,
          firstName: user.firstName || undefined
        },
        items: orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: order.shippingAddressId ? {
          street: user.street || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || ''
        } : undefined
      };
      
      await emailService.sendOrderConfirmation(emailData);
      Logger.info(`Order confirmation email sent for order ${orderId}`);
      
    } catch (error: any) {
      Logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  },

  async sendShippingNotificationWithData(orderId: string, trackingNumber: string, carrier: string) {
    try {
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      const user = await storage.getUser(order.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      
      const emailData = {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        totalAmount: order.totalAmount,
        user: {
          email: user.email!,
          firstName: user.firstName || undefined
        },
        items: orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: order.shippingAddressId ? {
          street: user.street || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || ''
        } : undefined,
        trackingNumber,
        carrier
      };
      
      await emailService.sendShippingNotification(emailData);
      Logger.info(`Shipping notification sent for order ${orderId} with tracking ${trackingNumber}`);
      
    } catch (error: any) {
      Logger.error('Failed to send shipping notification:', error);
      throw error;
    }
  }
};