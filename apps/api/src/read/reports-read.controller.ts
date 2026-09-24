import { Controller, Get, Param, UseInterceptors, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { ReportsReadService } from './reports-read.service.js';
import { HttpCacheInterceptor } from './http-cache.interceptor.js';

@ApiTags('Public / Reports')
@Controller('reports')
@UseInterceptors(HttpCacheInterceptor)
export class ReportsReadController {
  constructor(@Inject(ReportsReadService) private readonly reportsService: ReportsReadService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Get latest published report with summary stats' })
  @ApiResponse({ status: 200, description: 'Latest published report details' })
  @ApiResponse({ status: 404, description: 'No published reports found' })
  async getLatest() {
    const data = await this.reportsService.getLatestReport();
    return { ok: true, data };
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get published report by date (YYYY-MM-DD)' })
  @ApiParam({ name: 'date', example: '2026-09-23' })
  @ApiResponse({ status: 200, description: 'Published report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getByDate(@Param('date') date: string) {
    const data = await this.reportsService.getReportByDate(date);
    return { ok: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List all published report dates' })
  @ApiResponse({ status: 200, description: 'Array of date strings' })
  async getDates() {
    const data = await this.reportsService.getPublishedDates();
    return { ok: true, data };
  }
}
