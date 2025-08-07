const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'clean-and-flip-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    message: 'Clean & Flip API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Clean & Flip API endpoint working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// Serve static files in development
if (process.env.NODE_ENV !== 'production') {
  // Serve client build files
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // SPA fallback for client-side routing
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clean & Flip server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 API test: http://0.0.0.0:${PORT}/api/test`);
});

module.exports = app;