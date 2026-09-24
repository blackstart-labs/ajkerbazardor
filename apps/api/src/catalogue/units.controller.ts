import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';

@ApiTags('Units')
@Controller('api/v1/units')
export class UnitsController {
  constructor(@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>) {}

  @Get()
  @ApiOperation({ summary: 'List all standard units' })
  @ApiResponse({ status: 200, description: 'List of units' })
  async getAll() {
    const data = await this.db.select().from(schema.units);
    return { ok: true, data };
  }
}
