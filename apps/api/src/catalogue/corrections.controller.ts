import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { SaveCorrectionsDto } from './corrections.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CorrectionsService } from './corrections.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Admin / Price Corrections')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@ApiBearerAuth()
export class CorrectionsController {
  constructor(private readonly correctionsService: CorrectionsService) {}

  @Post(':date/corrections')
  @ApiOperation({ summary: 'Save manual price corrections for a specific date' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Corrections applied and new revision created' })
  async applyCorrections(
    @Param('date') date: string,
    @Body() dto: SaveCorrectionsDto,
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.correctionsService.applyCorrections(date, dto, user.id);
    return { ok: true, data };
  }
}
