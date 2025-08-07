const express = require('express');
const { createServer } = require('http');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

async function registerRoutes(app) {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));

  // Compression
  app.use(compression());

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'clean-and-flip-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API Routes
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Clean & Flip API is working!',
      timestamp: new Date().toISOString()
    });
  });

  // Products API
  app.get('/api/products', (req, res) => {
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
  });

  // Categories API
  app.get('/api/categories', (req, res) => {
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
  });

  // User authentication
  app.get('/api/user', (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = req.session as any;
    const user = {
      id: session.userId,
      email: session.userEmail || 'user@example.com',
      firstName: session.firstName || 'John',
      lastName: session.lastName || 'Doe',
      role: session.userRole || 'user'
    };

    res.json(user);
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const session = req.session as any;

    // Mock authentication
    if (email === 'admin@cleanandflip.com' && password === 'admin123') {
      session.userId = 1;
      session.userRole = 'admin';
      session.userEmail = email;
      session.firstName = 'Admin';
      session.lastName = 'User';
      
      res.json({
        id: 1,
        email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
    } else if (email === 'user@example.com' && password === 'user123') {
      session.userId = 2;
      session.userRole = 'user';
      session.userEmail = email;
      session.firstName = 'John';
      session.lastName = 'Doe';
      
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
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  const port = process.env.PORT || 5000;

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Clean & Flip server running on port ${port}`);
  });

  return httpServer;
}

module.exports = { registerRoutes };