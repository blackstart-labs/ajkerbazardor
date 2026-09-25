import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
// Import from the COMPILED dist output, not raw source
import { createNestApp } from '../dist/setup.js';

let cachedApp: NestFastifyApplication | null = null;

async function getApp(): Promise<NestFastifyApplication> {
  if (!cachedApp) {
    cachedApp = await createNestApp();
    await cachedApp.init();
    await cachedApp.getHttpAdapter().getInstance().ready();
  }
  return cachedApp;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    // Always send CORS headers even on crash so the browser can read the error
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
