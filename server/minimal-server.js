const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Simple in-memory session store
const sessions = new Map();

// Mock product data
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
  },
  {
    id: 4,
    name: 'Power Rack',
    price: 899.99,
    category: 'Racks',
    description: 'Heavy-duty power rack for home gym setup',
    image: '/images/rack.jpg',
    stock: 5,
    rating: 4.7,
    reviews: 12
  },
  {
    id: 5,
    name: 'Adjustable Bench',
    price: 249.99,
    category: 'Benches',
    description: 'Multi-position adjustable weight bench',
    image: '/images/bench.jpg',
    stock: 10,
    rating: 4.5,
    reviews: 20
  }
];

const categories = [
  { id: 1, name: 'Barbells', count: 12, slug: 'barbells' },
  { id: 2, name: 'Dumbbells', count: 18, slug: 'dumbbells' },
  { id: 3, name: 'Weights', count: 25, slug: 'weights' },
  { id: 4, name: 'Racks', count: 7, slug: 'racks' },
  { id: 5, name: 'Benches', count: 9, slug: 'benches' }
];

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Serve static files
function serveStatic(req, res) {
  const clientPath = path.resolve(process.cwd(), 'client');
  const indexPath = path.join(clientPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } else {
    sendJSON(res, {
      message: 'Clean & Flip API Server',
      status: 'development',
      note: 'Frontend will be served when built',
      api: 'operational',
      endpoints: ['/api/test', '/api/products', '/api/categories', '/api/login']
    });
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  setCORSHeaders(res);

  // Handle OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${pathname}`);

  // Health check
  if (pathname === '/health') {
    sendJSON(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    return;
  }

  // API test
  if (pathname === '/api/test') {
    sendJSON(res, {
      message: 'Clean & Flip API is working!',
      timestamp: new Date().toISOString(),
      server: 'Node.js HTTP',
      version: '1.0.0'
    });
    return;
  }

  // Products API
  if (pathname === '/api/products') {
    sendJSON(res, {
      products,
      total: products.length,
      success: true
    });
    return;
  }

  // Categories API
  if (pathname === '/api/categories') {
    sendJSON(res, {
      categories,
      success: true
    });
    return;
  }

  // User authentication
  if (pathname === '/api/user' && method === 'GET') {
    const sessionId = req.headers['x-session-id'] || 'default';
    const session = sessions.get(sessionId);
    
    if (!session || !session.userId) {
      sendJSON(res, { error: 'Not authenticated' }, 401);
      return;
    }

    sendJSON(res, {
      id: session.userId,
      email: session.userEmail,
      firstName: session.firstName,
      lastName: session.lastName,
      role: session.userRole
    });
    return;
  }

  // Login
  if (pathname === '/api/login' && method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;

    if (!email || !password) {
      sendJSON(res, { error: 'Email and password required' }, 400);
      return;
    }

    const sessionId = req.headers['x-session-id'] || 'default';

    if (email === 'admin@cleanandflip.com' && password === 'admin123') {
      sessions.set(sessionId, {
        userId: 1,
        userRole: 'admin',
        userEmail: email,
        firstName: 'Admin',
        lastName: 'User'
      });
      
      sendJSON(res, {
        id: 1,
        email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
    } else if (email === 'user@example.com' && password === 'user123') {
      sessions.set(sessionId, {
        userId: 2,
        userRole: 'user',
        userEmail: email,
        firstName: 'John',
        lastName: 'Doe'
      });
      
      sendJSON(res, {
        id: 2,
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      });
    } else {
      sendJSON(res, { error: 'Invalid credentials' }, 401);
    }
    return;
  }

  // Logout
  if (pathname === '/api/logout' && method === 'POST') {
    const sessionId = req.headers['x-session-id'] || 'default';
    sessions.delete(sessionId);
    sendJSON(res, { success: true, message: 'Logged out successfully' });
    return;
  }

  // 404 for API routes
  if (pathname.startsWith('/api/')) {
    sendJSON(res, { error: 'API endpoint not found' }, 404);
    return;
  }

  // Serve frontend
  serveStatic(req, res);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clean & Flip server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 API test: http://0.0.0.0:${PORT}/api/test`);
  console.log(`🔗 Products: http://0.0.0.0:${PORT}/api/products`);
});

module.exports = server;