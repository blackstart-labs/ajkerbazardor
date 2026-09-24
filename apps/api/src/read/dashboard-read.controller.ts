import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { DashboardReadService } from './dashboard-read.service.js';
import { HttpCacheInterceptor } from './http-cache.interceptor.js';

@ApiTags('Public / Dashboard')
@Controller('dashboard')
@UseInterceptors(HttpCacheInterceptor)
export class DashboardReadController {
  constructor(private readonly dashboardService: DashboardReadService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get daily market overview summary, counts, shares, top movers' })
  @ApiQuery({ name: 'date', required: false, description: 'Optional report date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Daily dashboard summary' })
  async getSummary(@Query('date') date?: string) {
    const data = await this.dashboardService.getSummary(date);
    return { ok: true, data };
  }

  @Get('movers')
  @ApiOperation({ summary: 'Get top risers and fallers for day, week, or month' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'], example: 'day' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'date', required: false, description: 'Optional report date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Top risers and fallers' })
  async getMovers(
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('limit') limit?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.dashboardService.getMovers(period, limit !== undefined ? parseInt(limit, 10) : 10, date);
    return { ok: true, data };
  }

  @Get('index')
  @ApiOperation({ summary: 'Get Bazar Price Index per category rebased to 100 at start of range' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d', '1y', 'all'], example: '30d' })
  @ApiResponse({ status: 200, description: 'Bazar index time series' })
  async getIndex(@Query('category') category?: string, @Query('range') range?: '7d' | '30d' | '90d' | '1y' | 'all') {
    const data = await this.dashboardService.getBazarIndex(category, range);
    return { ok: true, data };
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get product market heatmap matrix across 14-30 days' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 14 })
  @ApiQuery({ name: 'date', required: false, description: 'Optional end date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Heatmap rows and dates' })
  async getHeatmap(@Query('days') days?: string, @Query('date') date?: string) {
    const data = await this.dashboardService.getHeatmap(days !== undefined ? parseInt(days, 10) : 14, date);
    return { ok: true, data };
  }
}
