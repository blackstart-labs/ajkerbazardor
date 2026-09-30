import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createNestApp } from './setup.js';

let cachedApp: NestFastifyApplication | null = null;

async function getApp() {
  if (!cachedApp) {
    cachedApp = await createNestApp();
    await cachedApp.init();
    await cachedApp.getHttpAdapter().getInstance().ready();
  }

  return cachedApp;
}

const ALLOWED_ORIGINS = new Set([
  'https://ajkerbazardor.vercel.app',
  'https://ajkerbazardoor.vercel.app',
  'http://localhost:3001',
  'http://localhost:3002',
]);

function getCorsOrigin(origin: string | undefined): string {
  if (!origin) return '';
  const clean = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.has(clean) || /^https:\/\/ajkerbazardoor?(-[a-z0-9-]+)?\.vercel\.app$/.test(clean)) {
    return clean;
  }
  return '';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = getCorsOrigin(req.headers.origin);

  // Set CORS headers immediately
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Preflight OPTIONS fast exit
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const app = await getApp();
    const fastifyServer = app.getHttpAdapter().getInstance().server;

    // Await response completion before terminating serverless function
    await new Promise<void>((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('close', () => resolve());
      res.on('error', (err) => reject(err));
      fastifyServer.emit('request', req, res);
    });
  } catch (err) {
    console.error('Vercel handler error:', err);
    if (!res.headersSent) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
}
