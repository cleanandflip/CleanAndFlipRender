import { Router } from 'express';
import { StripeProductSync } from '../services/stripe-sync.js';
import { createTestProducts } from '../scripts/create-test-products.js';

const router = Router();

// Sync all products to Stripe
router.post('/sync-all', async (req, res) => {
  try {
    console.log('API: Starting sync-all request...');
    await StripeProductSync.syncAllProducts();
    console.log('API: Sync-all completed successfully');
    res.json({ success: true, message: 'All products synced to Stripe' });
  } catch (error) {
    console.error('Sync all products error:', error);
    res.status(500).json({ error: 'Failed to sync products', details: (error as any).message });
  }
});

// Sync single product to Stripe
router.post('/sync/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await StripeProductSync.syncProduct(productId);
    res.json({ success: true, message: 'Product synced to Stripe' });
  } catch (error) {
    console.error('Sync product error:', error);
    res.status(500).json({ error: 'Failed to sync product' });
  }
});

// Create test products
router.post('/create-test-products', async (req, res) => {
  try {
    await createTestProducts();
    res.json({ success: true, message: 'Test products created and synced' });
  } catch (error) {
    console.error('Create test products error:', error);
    res.status(500).json({ error: 'Failed to create test products' });
  }
});

// Webhook for Stripe events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    switch (event.type) {
      case 'product.updated':
        await StripeProductSync.syncFromStripeWebhook(event.data.object.id);
        break;
      case 'product.deleted':
        // Handle product deletion if needed
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

export { router as stripeSync };