// Cart Locality Enforcement Middleware
// Blocks LOCAL_ONLY items for non-local customers with structured 403 responses

import type { Request, Response, NextFunction } from 'express';
import { getLocalityForRequest } from '../locality/getLocalityForRequest';
import { getUserIdFromReq } from '../utils/auth';
import { modeFromProduct } from '../../shared/fulfillment';

export async function enforceLocalityForCart(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    // Get product to check fulfillment mode
    const { storage } = await import('../storage');
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const status = await getLocalityForRequest(req);
    const mode = modeFromProduct(product);
    
    // Enhanced logging for debugging
    console.log('[CART ENFORCE]', {
      user: getUserIdFromReq(req) || 'guest',
      productId,
      mode,
      eligible: status.eligible,
      source: status.source,
      zip: status.zipUsed || 'none'
    });
    
    // Block LOCAL_ONLY items for non-local customers
    if (mode === 'LOCAL_ONLY' && !status.eligible) {
      return res.status(403).json({
        code: 'LOCAL_ONLY_NOT_ELIGIBLE',
        message: 'This item is local delivery only and not available in your area.',
        resolution: 'Set a default local address or enter a local ZIP.',
        productId,
        localityStatus: status
      });
    }
    
    // Allow LOCAL_AND_SHIPPING items for everyone
    next();
  } catch (error) {
    console.error('Cart locality enforcement error:', error);
    next(error);
  }
}