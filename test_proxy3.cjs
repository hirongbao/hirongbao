const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(createProxyMiddleware({
  pathFilter: ['/api/user/**', '/api/guestbook/**'],
  target: 'http://localhost:8080',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Intercepted:', req.originalUrl);
  }
}));
app.listen(3004, () => console.log('Test server on 3004'));
