import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { isLocalMiles } from '../lib/locality';

const router = Router();

// GET /api/locality/status - Get user's locality status based on default address
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's default address
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    
    console.log('LOCALITY DEBUG - User ID:', userId);
    console.log('LOCALITY DEBUG - Found addresses:', addresses?.length || 0);
    console.log('LOCALITY DEBUG - Default address:', defaultAddress ? {
      id: defaultAddress.id,
      street: defaultAddress.street1,
      city: defaultAddress.city,
      latitude: defaultAddress.latitude,
      longitude: defaultAddress.longitude,
      isLocal: defaultAddress.isLocal
    } : 'NONE');
    
    if (!defaultAddress) {
      return res.json({
        isLocal: false,
        distanceMiles: null,
        hasAddress: false,
        defaultAddressId: null
      });
    }
    
    // Use the unified locality detection system
    const localityResult = isLocalMiles(defaultAddress.latitude, defaultAddress.longitude);
    
    console.log('LOCALITY DEBUG - Calculation result:', localityResult);
    
    res.json({
      isLocal: localityResult.isLocal,
      distanceMiles: localityResult.distanceMiles,
      hasAddress: true,
      defaultAddressId: defaultAddress.id
    });
  } catch (error) {
    console.error('Error checking locality status:', error);
    res.status(500).json({ error: 'Failed to check locality status' });
  }
});

export default router;