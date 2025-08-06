// Temporary server to test if basic Express works without Vite
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Clean & Flip API Server',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[TEMP] Server running on port ${port}`);
  console.log(`[TEMP] Health check: http://localhost:${port}/health`);
});