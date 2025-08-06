// Minimal server without vite dependency for emergency startup
import express from 'express';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await db.execute('SELECT current_database(), COUNT(*) as user_count FROM users');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Clean & Flip Server running on port ${PORT}`);
  console.log(`✅ Database connected`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
});