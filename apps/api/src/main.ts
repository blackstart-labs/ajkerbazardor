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

// Only bootstrap standalone HTTP server when not in Vercel serverless environment
if (!process.env['VERCEL']) {
  bootstrap().catch((err: unknown) => {
    console.error('Failed to start API:', err);
  });
}

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
