import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { isLocalMiles } from '../lib/locality';

const router = Router();

// GET /api/locality/status - Get locality status (unauthenticated users get default state)
router.get('/status', async (req, res) => {
  try {
    const user = req.user;
    const { zip } = req.query;
    let isLocal = false;
    let zoneName = undefined;
    let distanceMiles = null;
    
    // If ZIP provided, check against that location
    if (zip && typeof zip === 'string') {
      try {
        // Enhanced ZIP-based locality check for Asheville area
        const ashevilleZips = ['28801', '28802', '28803', '28804', '28805', '28806', '28810', '28813', '28815'];
        isLocal = ashevilleZips.some(validZip => zip.startsWith(validZip.substring(0, 3)));
        if (isLocal) {
          zoneName = 'Greater Asheville Area';
          distanceMiles = 25; // Approximate for ZIP-based checks
        }
      } catch (error) {
        console.error('Error checking ZIP:', error);
      }
    } else if (user) {
      // Check user's default address
      const userId = user.id;
      const addresses = await storage.getUserAddresses(userId);
      const defaultAddress = addresses.find(addr => addr.isDefault);
      
      if (defaultAddress?.latitude && defaultAddress?.longitude) {
        const localityResult = isLocalMiles(Number(defaultAddress.latitude), Number(defaultAddress.longitude));
        isLocal = localityResult.isLocal;
        distanceMiles = localityResult.distanceMiles;
        if (isLocal) {
          zoneName = 'Greater Asheville Area';
        }
      }
    }
    
    res.json({
      isLocal,
      zoneName,
      freeDelivery: isLocal,
      etaHours: [24, 48] as [number, number],
      distanceMiles,
      hasAddress: !!user,
      authenticated: !!user,
      message: isLocal ? 'You are in our local delivery zone!' : 'You are outside our local delivery zone.'
    });
  } catch (error) {
    console.error('Error checking locality status:', error);
    res.status(500).json({ 
      isLocal: false,
      freeDelivery: false,
      etaHours: [24, 48] as [number, number],
      distanceMiles: null,
      hasAddress: false,
      authenticated: false,
      error: 'Failed to check locality status'
    });
  }
});

export default router;