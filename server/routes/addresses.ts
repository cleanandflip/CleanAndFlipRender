import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import { isLocalMiles } from '../lib/distance';

const router = Router();

// Address schema with SSOT fields - matching frontend names
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  streetAddress: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().default('US'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  isDefault: z.boolean().default(false)
});

// GET /api/addresses - list user addresses (default first)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const addresses = await storage.getUserAddresses(userId);
    
    // Sort with default first
    const sorted = addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    res.json(sorted);
  } catch (error) {
    console.error('GET /api/addresses error:', error);
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
});

// POST /api/addresses - create address
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = addressSchema.parse(req.body);
    
    // Check if user has zero addresses - if so, force this as default
    const existingAddresses = await storage.getUserAddresses(userId);
    if (existingAddresses.length === 0) {
      data.isDefault = true;
    }
    
    // Compute isLocal from coordinates
    const isLocal = isLocalMiles(data.lat || null, data.lng || null);
    
    const address = await storage.createAddress(userId, {
      ...data,
      line1: data.streetAddress,
      line2: data.apartment || null,
      postalCode: data.zipCode,
      isLocal
    });
    
    res.json(address);
  } catch (error) {
    console.error('POST /api/addresses error:', error);
    res.status(400).json({ 
      message: error instanceof z.ZodError ? 'Invalid address data' : 'Failed to create address'
    });
  }
});

// PATCH /api/addresses/:id - update address
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = addressSchema.partial().parse(req.body);
    
    // Recompute isLocal if coordinates changed
    if (data.lat !== undefined || data.lng !== undefined) {
      data.isLocal = isLocalMiles(data.lat || null, data.lng || null);
    }
    
    const address = await storage.updateAddress(userId, id, data);
    
    res.json(address);
  } catch (error) {
    console.error('PATCH /api/addresses/:id error:', error);
    res.status(400).json({ message: 'Failed to update address' });
  }
});

// POST /api/addresses/:id/default - set as default
router.post('/:id/default', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const address = await storage.setDefaultAddress(userId, id);
    
    res.json(address);
  } catch (error) {
    console.error('POST /api/addresses/:id/default error:', error);
    res.status(400).json({ message: 'Failed to set default address' });
  }
});

// DELETE /api/addresses/:id - delete address (forbid if default)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    // Check if this is the default address
    const address = await storage.getAddress(userId, id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    if (address.isDefault) {
      return res.status(400).json({ 
        message: 'Cannot delete default address. Set another address as default first.' 
      });
    }
    
    await storage.deleteAddress(userId, id);
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/addresses/:id error:', error);
    res.status(400).json({ message: 'Failed to delete address' });
  }
});

export default router;