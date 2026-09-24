import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envSchema } from './config/env.schema.js';
import { DrizzleModule } from './drizzle/drizzle.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ImporterModule } from './importer/importer.module.js';
import { AuditModule } from './audit/audit.module.js';
import { CatalogueModule } from './catalogue/catalogue.module.js';
import { ReadModule } from './read/read.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
          throw new Error(`Environment validation failed:\n${issues}`);
        }
        return result.data;
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DrizzleModule,
    AuditModule,
    AuthModule,
    ImporterModule,
    CatalogueModule,
    ReadModule,
  ],
})
export class AppModule {}
