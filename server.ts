import fs from 'node:fs/promises';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;
const base = process.env.BASE || '/';

const app = express();
let vite;

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      base,
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import('compression')).default;
    const sirv = (await import('sirv')).default;
    app.use(compression());
    app.use(base, sirv(path.resolve('dist/client'), { extensions: [] }));
  }

  app.use(
    ['/api', '/s'],
    createProxyMiddleware({
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
      secure: false
    })
  );

  app.use('*', async (req, res) => {
    try {
      let url = req.originalUrl.replace(base, '');
      let template;
      
      if (!isProduction) {
        template = await fs.readFile('./index.html', 'utf-8');
        template = await vite.transformIndexHtml(url, template);
      } else {
        template = await fs.readFile(path.resolve('dist/client/index.html'), 'utf-8');
      }
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      !isProduction && vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

startServer();
