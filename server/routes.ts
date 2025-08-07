import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Clean & Flip API is working!',
    timestamp: new Date().toISOString()
  });
});

// Products endpoints
router.get('/products', async (req, res) => {
  try {
    // Mock data for now - will be replaced with database
    const products = [
      {
        id: 1,
        name: 'Olympic Barbell',
        price: 299.99,
        category: 'Barbells',
        description: 'Professional grade Olympic barbell for serious lifters',
        image: '/images/barbell.jpg',
        stock: 15,
        rating: 4.8,
        reviews: 24
      },
      {
        id: 2,
        name: 'Rubber Weight Plates Set',
        price: 199.99,
        category: 'Weights',
        description: 'Complete set of rubber weight plates (45lb pair)',
        image: '/images/plates.jpg',
        stock: 8,
        rating: 4.6,
        reviews: 18
      },
      {
        id: 3,
        name: 'Adjustable Dumbbells',
        price: 399.99,
        category: 'Dumbbells',
        description: 'Space-saving adjustable dumbbells 5-50lbs',
        image: '/images/dumbbells.jpg',
        stock: 12,
        rating: 4.9,
        reviews: 35
      }
    ];

    res.json({
      products,
      total: products.length,
      success: true
    });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Categories endpoint
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Barbells', count: 12, slug: 'barbells' },
      { id: 2, name: 'Dumbbells', count: 18, slug: 'dumbbells' },
      { id: 3, name: 'Weights', count: 25, slug: 'weights' },
      { id: 4, name: 'Racks', count: 7, slug: 'racks' },
      { id: 5, name: 'Benches', count: 9, slug: 'benches' }
    ];

    res.json({
      categories,
      success: true
    });
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// User authentication endpoints
router.get('/user', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Mock user data - will be replaced with database lookup
    const user = {
      id: req.session.userId,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user'
    };

    res.json(user);
  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Mock authentication - will be replaced with real auth
    if (email === 'admin@cleanandflip.com' && password === 'admin123') {
      req.session.userId = 1;
      req.session.userRole = 'admin';
      
      res.json({
        id: 1,
        email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
    } else if (email === 'user@example.com' && password === 'user123') {
      req.session.userId = 2;
      req.session.userRole = 'user';
      
      res.json({
        id: 2,
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout API error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;