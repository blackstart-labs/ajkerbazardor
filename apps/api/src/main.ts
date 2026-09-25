import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));

  // Register cookie plugin for fastify
  await app.register(fastifyCookie as unknown as Parameters<typeof app.register>[0], {
    secret: process.env['JWT_SECRET'] ?? 'cookie-secret-key-at-least-32-chars',
  });

  // Register multipart plugin for file uploads
  await app.register(fastifyMultipart as unknown as Parameters<typeof app.register>[0], {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // Dynamic CORS: allow localhost, production Vercel domains, and *.vercel.app previews
  const defaultOrigins = [
    'http://localhost:3001',
    'http://localhost:3002',
    'https://ajkerbazardor.vercel.app',
    'https://ajkerbazardoor.vercel.app',
  ];
  const rawOrigins = process.env['CORS_ORIGIN']
    ? process.env['CORS_ORIGIN'].split(',').map((s) => s.trim().replace(/\/$/, ''))
    : defaultOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (rawOrigins.includes(origin) || rawOrigins.includes(cleanOrigin) || /\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health'],
  });

  // Global validation pipe (zod-based)
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filter — consistent error shape
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI / Swagger
  const doc = new DocumentBuilder()
    .setTitle('Ajker Bazar Dor API')
    .setDescription('Daily retail price data for Dhaka markets, sourced from TCB.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, doc);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.warn(`API listening on port ${port} — docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
