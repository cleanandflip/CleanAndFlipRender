import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { isLocalMiles, milesBetween } from '../lib/distance';

const router = Router();

// GET /api/locality/status - Get user's locality status based on default address
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's default address
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    
    if (!defaultAddress) {
      return res.json({
        isLocal: false,
        distanceMiles: null,
        hasAddress: false,
        defaultAddressId: null
      });
    }
    
    const localityResult = isLocalMiles(defaultAddress.latitude, defaultAddress.longitude);
    
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