import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Basic middleware
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new globalThis.Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes placeholder - will be replaced with actual routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Clean & Flip API is running!', timestamp: new globalThis.Date().toISOString() });
});

// Serve static files from client build
const clientBuild = join(__dirname, '..', 'dist', 'client');
app.use(express.static(clientBuild));

// Development: Proxy to Vite dev server
if (process.env.NODE_ENV !== 'production') {
  try {
    const viteProxy = createProxyMiddleware({
      target: 'http://localhost:5173',
      changeOrigin: true,
      ws: true,
      pathRewrite: {
        '^/(?!api)': '/'
      }
    });
    
    app.use('/', viteProxy);
  } catch (error) {
    console.warn('Vite proxy not available, serving static files');
    
    // Fallback: serve index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(join(clientBuild, 'index.html'));
    });
  }
} else {
  // Production: serve built client
  app.get('*', (req, res) => {
    res.sendFile(join(clientBuild, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
});

export default app;