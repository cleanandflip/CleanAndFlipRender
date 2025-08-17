import { Router } from 'express';
import Stripe from 'stripe';
import express from 'express';
import { storage } from '../storage';
import { Logger } from '../utils/logger';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

// CRITICAL: Stripe webhook with proper signature verification
router.post('/webhook', 
  express.raw({ type: 'application/json' }), // CRITICAL: Use raw body for signature verification
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    if (!sig) {
      return res.status(400).send('Missing Stripe signature');
    }
    
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body as any, // Must be raw body
        sig as string,
        webhookSecret as string
      );
      
      Logger.info(`[STRIPE] Webhook received: ${event.type}`, {
        id: event.id,
        created: event.created
      });
      
    } catch (err: any) {
      Logger.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.canceled':
          await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        default:
          Logger.debug(`[STRIPE] Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
      
    } catch (error: any) {
      Logger.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = ((paymentIntent.metadata as any)?.orderId ?? null) as string | null;
  
  if (!orderId) {
    Logger.error('No orderId in payment intent metadata');
    return;
  }
  
  Logger.info(`[STRIPE] Payment succeeded for order: ${orderId}`);
  
  // Update order status to confirmed
  await storage.updateOrderStatus(orderId || '', 'confirmed');
  
  // Get order details for confirmation email
  const order = await storage.getOrder(orderId as string);
  if (order) {
    // Send order confirmation email (implement when email service is ready)
    Logger.info(`[STRIPE] Order ${orderId} confirmed, email sent to ${order.userId}`);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = ((paymentIntent.metadata as any)?.orderId ?? null) as string | null;
  
  if (!orderId) {
    Logger.error('No orderId in payment intent metadata');
    return;
  }
  
  Logger.warn(`[STRIPE] Payment failed for order: ${orderId}`);
  
  // Update order status to payment failed
  await storage.updateOrderStatus(orderId || '', 'payment_failed');
  
  // Restore inventory for failed payment
  await restoreInventoryForOrder(orderId as string);
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = ((paymentIntent.metadata as any)?.orderId ?? null) as string | null;
  
  if (!orderId) {
    Logger.error('No orderId in payment intent metadata');
    return;
  }
  
  Logger.info(`[STRIPE] Payment canceled for order: ${orderId}`);
  
  // Update order status to cancelled
  await storage.updateOrderStatus(orderId || '', 'cancelled');
  
  // Restore inventory for cancelled payment
  await restoreInventoryForOrder(orderId as string);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  
  if (!orderId) {
    Logger.error('No orderId in checkout session metadata');
    return;
  }
  
  Logger.info(`[STRIPE] Checkout completed for order: ${orderId}`);
  
  // Additional processing if needed
}

async function restoreInventoryForOrder(orderId: string) {
  try {
    const orderItems = await storage.getOrderItems(orderId as string);
    
    for (const item of orderItems) {
      const product = await storage.getProduct(item.productId as string);
      if (product) {
        await storage.updateProduct(item.productId as string, {
          stockQuantity: (product.stockQuantity || 0) + item.quantity
        });
        Logger.debug(`[INVENTORY] Restored ${item.quantity} units for product ${item.productId}`);
      }
    }
    
    Logger.info(`[INVENTORY] Inventory restored for cancelled/failed order: ${orderId}`);
  } catch (error) {
    Logger.error('Error restoring inventory:', error);
  }
}

export default router;