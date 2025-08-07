const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Clean & Flip server is running!',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Clean & Flip</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>🏋️ Clean & Flip</h1>
        <p>E-Commerce Marketplace for Weightlifting Equipment</p>
        <p>Server is running successfully!</p>
        <a href="/health">Health Check</a>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clean & Flip server running on port ${PORT}`);
  console.log(`🔗 Visit: http://localhost:${PORT}`);
});