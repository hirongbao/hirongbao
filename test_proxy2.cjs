const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(createProxyMiddleware({
  pathFilter: ['/api/user', '/api/guestbook'],
  target: 'http://localhost:8080',
  changeOrigin: true
}));
app.listen(3003, () => console.log('Test server on 3003'));
