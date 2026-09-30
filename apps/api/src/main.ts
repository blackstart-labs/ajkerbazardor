import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createNestApp } from './setup.js';
import handler from './serverless.js';

export async function bootstrap(): Promise<void> {
  const app = await createNestApp();
  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.warn(`API listening on port ${port} — docs at http://localhost:${port}/api/docs`);
}

// Start application for local server and Vercel Fluid compute execution
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

export { NestFactory, createNestApp, handler };
export default handler;

// CommonJS interoperability for @vercel/node and serverless runtimes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.default = handler;
  module.exports.handler = handler;
  module.exports.bootstrap = bootstrap;
  module.exports.createNestApp = createNestApp;
  module.exports.NestFactory = NestFactory;
}
