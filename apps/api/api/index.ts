import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createNestApp } from '../src/setup.js';

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
  const app = await getApp();
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.server.emit('request', req, res);
}
