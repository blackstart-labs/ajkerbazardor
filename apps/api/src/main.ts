import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

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
