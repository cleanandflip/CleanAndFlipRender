import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { isLocalMiles } from '../lib/locality';

const router = Router();

// GET /api/locality/status - Get locality status (unauthenticated users get default state)
router.get('/status', async (req, res) => {
  try {
    const user = req.user;
    
    // If not authenticated, return safe default state
    if (!user) {
      return res.status(200).json({
        isLocal: false,
        hasAddress: false,
        distanceMiles: null,
        defaultAddressId: null,
        authenticated: false
      });
    }
    
    const userId = user.id;
    
    // Get user's default address
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    
    if (!defaultAddress) {
      return res.json({
        isLocal: false,
        distanceMiles: null,
        hasAddress: false,
        defaultAddressId: null,
        authenticated: true
      });
    }
    
    // Use the unified locality detection system
    const localityResult = isLocalMiles(Number(defaultAddress.latitude), Number(defaultAddress.longitude));
    
    res.json({
      isLocal: localityResult.isLocal,
      distanceMiles: localityResult.distanceMiles,
      hasAddress: true,
      defaultAddressId: defaultAddress.id,
      authenticated: true
    });
  } catch (error) {
    console.error('Error checking locality status:', error);
    res.status(500).json({ error: 'Failed to check locality status' });
  }
});

export default router;