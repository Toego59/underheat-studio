const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const FRONTEND_DIR = path.join(__dirname);

// Serve static frontend files
app.use(express.static(FRONTEND_DIR));

// Proxy /api to local backend on port 3000
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:3000',
  changeOrigin: true,
  secure: false,
  logLevel: 'warn'
}));

// Safe fallback: only serve index.html for GET requests that accept HTML
app.use((req, res, next) => {
  if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  }
  next();
});

// Start on port 5500
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log('Proxy server listening on port', PORT));
