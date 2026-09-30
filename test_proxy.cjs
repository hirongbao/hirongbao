const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(['/api/user'], createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying:', req.method, req.originalUrl, '->', proxyReq.path);
  }
}));
app.listen(3002, () => console.log('Test server on 3002'));
