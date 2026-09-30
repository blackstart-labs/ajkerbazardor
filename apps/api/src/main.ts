import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createNestApp } from './setup.js';
import handler from './serverless.js';

export { NestFactory, createNestApp, handler };

async function bootstrap() {
  const app = await createNestApp();
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.warn(`API listening on port ${port} — docs at http://localhost:${port}/api/docs`);
  return app;
}

if (!process.env['VERCEL']) {
  bootstrap().catch(async (err: unknown) => {
    console.error('Failed to start API:', err);
    const http = await import('node:http');
    const server = http.createServer((req, res) => {
      const origin = req.headers.origin || '*';
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      });
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      res.end(
        JSON.stringify({
          error: 'API Initialization Failed',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        }),
      );
    });
    const port = Number(process.env['PORT'] ?? 3000);
    server.listen(port, '0.0.0.0');
  });
}

export default handler;
