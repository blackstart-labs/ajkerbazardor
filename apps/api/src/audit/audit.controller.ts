import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Admin / Audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List recent audit logs (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max records (default 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset records (default 0)' })
  @ApiQuery({ name: 'entity', required: false, type: String, description: 'Filter by entity type' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('entity') entity?: string,
  ) {
    const parsedLimit = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 100) : 50;
    const parsedOffset = offset ? Math.max(0, parseInt(offset, 10)) : 0;
    const data = await this.auditService.getLogs(parsedLimit, parsedOffset, entity);
    return { ok: true, data };
  }
}
