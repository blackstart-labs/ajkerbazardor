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
  if (!origin) return '*';
  const clean = origin.replace(/\/$/, '');
  if (
    ALLOWED_ORIGINS.has(clean) ||
    clean.includes('vercel.app') ||
    clean.includes('localhost') ||
    clean.includes('127.0.0.1')
  ) {
    return clean;
  }
  return clean;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const reqOrigin = req.headers.origin;
  const origin = getCorsOrigin(reqOrigin);

  // Set CORS headers immediately on every request
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Date,X-Api-Version,X-CSRF-Token',
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight OPTIONS fast exit (returns HTTP 204 OK immediately)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Restore original request URL if rewritten by Vercel catch-all or proxy
  const rawUrl = req.url || '/';
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  const forwardedUri = req.headers['x-forwarded-uri'] as string | undefined;

  if (rawUrl.includes('[...all]') || rawUrl === '/api' || rawUrl === '/api/index') {
    if (matchedPath && !matchedPath.includes('[...all]')) {
      req.url = matchedPath;
    } else if (forwardedUri && !forwardedUri.includes('[...all]')) {
      req.url = forwardedUri;
    }
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
