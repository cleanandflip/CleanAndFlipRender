const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { createServer } = require('http');
const path = require('path');
const fs = require('fs');

// Prevent multiple server instances
if (global.serverInstance) {
  console.log("[MAIN] Server already running, exiting...");
  process.exit(0);
}
global.serverInstance = true;

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

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
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = {
    id: req.session.userId,
    email: req.session.userEmail || 'user@example.com',
    firstName: req.session.firstName || 'John',
    lastName: req.session.lastName || 'Doe',
    role: req.session.userRole || 'user'
  };

  res.json(user);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Mock authentication
  if (email === 'admin@cleanandflip.com' && password === 'admin123') {
    req.session.userId = 1;
    req.session.userRole = 'admin';
    req.session.userEmail = email;
    req.session.firstName = 'Admin';
    req.session.lastName = 'User';
    
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
    req.session.userEmail = email;
    req.session.firstName = 'John';
    req.session.lastName = 'Doe';
    
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

// Frontend serving
const publicPath = path.resolve(process.cwd(), 'dist/public');
const clientPath = path.resolve(process.cwd(), 'client');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
  console.log(`[MAIN] Serving files from ${publicPath}`);
} else if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  const indexPath = path.join(clientPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(indexPath);
      }
    });
  }
  console.log(`[MAIN] Serving files from ${clientPath}`);
} else {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.json({
        message: 'Clean & Flip API Server',
        status: 'development',
        note: 'Run npm run build to build the frontend',
        api: 'operational'
      });
    }
  });
  console.log('[MAIN] No frontend files found - API only mode');
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`[SHUTDOWN] ${signal} received, shutting down gracefully...`);
  global.serverInstance = false;
  
  httpServer.close((err) => {
    if (err) {
      console.error('[SHUTDOWN] Error closing server:', err);
      process.exit(1);
    } else {
      console.log('[SHUTDOWN] Server closed successfully');
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clean & Flip server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 API test: http://0.0.0.0:${PORT}/api/test`);
});

module.exports = app;