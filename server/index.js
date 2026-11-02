// Local server for the Luny Turtle demo store.
// - Dev (`npm run dev`): Express + Vite in middleware mode, one port, hot reload.
// - Prod (`npm start` after `npm run build`): Express serves the built files from /dist.
// Both bind to localhost only. Nothing is deployed anywhere.
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiRouter, UPLOADS_DIR } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const port = Number(process.env.PORT) || 5173;
const host = process.env.HOST || '127.0.0.1';

const app = express();
const httpServer = http.createServer(app);
app.disable('x-powered-by');
app.use('/api', express.json({ limit: '40mb' }), createApiRouter());
// Body-parser failures (malformed JSON, too large) happen before the API router, so answer them as JSON here.
// eslint-disable-next-line no-unused-vars
app.use('/api', (err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.status || 400;
  const error =
    status === 413 ? 'That upload is too large. Try fewer or smaller reference photos.' : 'The request could not be read.';
  res.status(status).json({ error });
});
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR, { fallthrough: false }));

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    // HMR rides on the same HTTP server/port, so several instances can run side by side.
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('No build found. Run `npm run build` first, or use `npm run dev`.');
    process.exit(1);
  }
  app.use(express.static(dist, { index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

httpServer.listen(port, host, () => {
  console.log(`\n  🐢 Luny Turtle demo store running at http://localhost:${port}\n`);
  console.log(`     Artist studio (demo): http://localhost:${port}/studio\n`);
});
