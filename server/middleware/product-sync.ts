import { StripeProductSync } from '../services/stripe-sync.js';

// Middleware to auto-sync on product changes
export const autoSyncProducts = async (req: any, res: any, next: any) => {
  // Intercept product create/update responses
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Check if this is a product operation
    if (req.path.includes('/api/products') || req.path.includes('/api/admin/products')) {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        // Sync product after successful create/update
        if (data.id) {
          StripeProductSync.syncProduct(data.id).catch(console.error);
        } else if (data.products && Array.isArray(data.products)) {
          // Bulk operations
          data.products.forEach((product: any) => {
            if (product.id) {
              StripeProductSync.syncProduct(product.id).catch(console.error);
            }
          });
        }
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};