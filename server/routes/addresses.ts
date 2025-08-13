import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import { isLocalMiles } from '../lib/distance';

const router = Router();

// Address schema matching database schema exactly
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().default('US'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  geoapifyPlaceId: z.string().optional().nullable(),
  setDefault: z.boolean().default(false)
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
      return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    });
    
    res.json({ ok: true, data: sorted });
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
    const isDefault = data.setDefault || existingAddresses.length === 0;
    
    // Compute isLocal from coordinates
    const isLocal = isLocalMiles(data.latitude || null, data.longitude || null);
    
    const address = await storage.createAddress(userId, {
      ...data,
      isDefault,
      isLocal
    });
    
    res.json({ ok: true, data: address });
  } catch (error) {
    console.error('POST /api/addresses error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        ok: false,
        error: 'VALIDATION_ERROR',
        fieldErrors: error.flatten().fieldErrors
      });
    } else {
      res.status(500).json({ 
        ok: false,
        error: 'CREATION_FAILED',
        message: 'Failed to create address'
      });
    }
  }
});

// PATCH /api/addresses/:id - update address
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = addressSchema.partial().parse(req.body);
    
    // Recompute isLocal if coordinates changed
    let updateData = { ...data };
    if (data.latitude !== undefined || data.longitude !== undefined) {
      updateData = {
        ...updateData,
        isLocal: isLocalMiles(data.latitude || null, data.longitude || null)
      };
    }
    
    const address = await storage.updateAddress(userId, id, updateData);
    
    res.json({ ok: true, data: address });
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
    
    await storage.setDefaultAddress(userId, id);
    
    res.json({ ok: true });
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
      return res.status(404).json({ ok: false, error: 'Address not found' });
    }
    
    if (address.isDefault) {
      return res.status(409).json({ 
        ok: false, 
        error: 'DEFAULT_ADDRESS_CANNOT_BE_DELETED',
        message: 'Cannot delete default address. Set another address as default first.' 
      });
    }
    
    await storage.deleteAddress(userId, id);
    
    res.json({ ok: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/addresses/:id error:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete address' });
  }
});

export default router;