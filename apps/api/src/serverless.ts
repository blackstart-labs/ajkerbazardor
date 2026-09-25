import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createNestApp } from './setup.js';

let cachedApp: NestFastifyApplication | null = null;

async function getApp(): Promise<NestFastifyApplication> {
  if (!cachedApp) {
    cachedApp = await createNestApp();
    await cachedApp.init();
    await cachedApp.getHttpAdapter().getInstance().ready();
  }
  return cachedApp;
}

const ALLOWED_ORIGINS = [
  'https://ajkerbazardor.vercel.app',
  'https://ajkerbazardoor.vercel.app',
  'http://localhost:3001',
  'http://localhost:3002',
];

function matchOrigin(origin: string | undefined): string {
  if (!origin) return '';
  const clean = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(clean) || /\.vercel\.app$/.test(clean)) return clean;
  return '';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = matchOrigin(req.headers.origin);

  if (req.method === 'OPTIONS') {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  // Restore original request URL if rewritten by Vercel
  if (
    req.url === '/api' ||
    req.url === '/api/index.js' ||
    req.url?.startsWith('/api?') ||
    req.url?.startsWith('/api/index.js?')
  ) {
    const forwarded = req.headers['x-forwarded-url'] || req.headers['x-matched-path'];
    if (typeof forwarded === 'string' && forwarded) {
      req.url = forwarded;
    }
  }

  try {
    const app = await getApp();
    app.getHttpAdapter().getInstance().server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error', message: String(err) }));
  }
}
