import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';

const defaultOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'https://ajkerbazardor.vercel.app',
  'https://ajkerbazardoor.vercel.app',
];

function allowedOrigins() {
  const rawOrigins = process.env['CORS_ORIGIN']
    ? process.env['CORS_ORIGIN'].split(',').map((s) => s.trim().replace(/\/$/, ''))
    : defaultOrigins;

  const set = new Set(rawOrigins.filter(Boolean));
  set.add('https://ajkerbazardor.vercel.app');
  set.add('https://ajkerbazardoor.vercel.app');
  set.add('http://localhost:3001');
  set.add('http://localhost:3002');
  return set;
}

export async function createNestApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));

  await app.register(fastifyCookie as unknown as Parameters<typeof app.register>[0], {
    secret: process.env['JWT_SECRET'] ?? 'cookie-secret-key-at-least-32-chars',
  });

  await app.register(fastifyMultipart as unknown as Parameters<typeof app.register>[0], {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  const origins = allowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (origins.has(cleanOrigin) || /^https:\/\/ajkerbazardoor?(-[a-z0-9-]+)?\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, cleanOrigin);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health'],
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const doc = new DocumentBuilder()
    .setTitle('Ajker Bazar Dor API')
    .setDescription('Daily retail price data for Dhaka markets, sourced from TCB.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, doc);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}
