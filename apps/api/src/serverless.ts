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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    app.getHttpAdapter().getInstance().server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
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
