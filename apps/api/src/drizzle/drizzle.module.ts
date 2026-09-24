import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import type { Env } from '../config/env.schema.js';

export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = config.get('TURSO_DATABASE_URL');
        const token = config.get('TURSO_AUTH_TOKEN');
        const client = createClient(token ? { url, authToken: token } : { url });

        const db = drizzle(client, { schema });

        // Enforce foreign keys — libSQL disables them by default
        client.execute('PRAGMA foreign_keys = ON').catch((err: unknown) => {
          console.error('Failed to enable foreign keys:', err);
        });

        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
