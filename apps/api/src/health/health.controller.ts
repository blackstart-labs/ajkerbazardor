import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';

@ApiTags('System / Health')
@Controller()
export class HealthController {
  constructor(
    @Optional()
    @Inject(DRIZZLE)
    private readonly db?: LibSQLDatabase<typeof schema>,
  ) {}

  @Get(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'System health and readiness check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    let dbStatus = 'ok';
    if (this.db) {
      try {
        await this.db.run(sql`SELECT 1`);
      } catch (err) {
        dbStatus = `unhealthy: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks: {
        database: dbStatus,
      },
    };
  }
}
