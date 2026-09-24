import { Controller, Post, Get, Param, Req, Query, UseGuards, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ImportService } from './import.service.js';
import type { User } from '../drizzle/schema.js';

@ApiTags('Admin / Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('admin/imports')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload TCB daily retail price spreadsheet (.xlsx)' })
  async uploadAdmin(@Req() req: FastifyRequest, @CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.handleUpload(req, user.id);
  }

  @Post('import/upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload TCB daily spreadsheet (alias)' })
  async upload(@Req() req: FastifyRequest, @CurrentUser() user: Omit<User, 'passwordHash'>) {
    return this.handleUpload(req, user.id);
  }

  private async handleUpload(req: FastifyRequest, userId: number) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('No file uploaded');
    }

    if (!part.filename.endsWith('.xlsx')) {
      throw new BadRequestException('Only .xlsx files are supported');
    }

    const buffer = await part.toBuffer();
    const result = await this.importService.importTcbFile(buffer, part.filename, userId);

    return {
      ok: true,
      data: result,
    };
  }

  @Get('admin/imports')
  @ApiOperation({ summary: 'List recent imports across all dates' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAllImports(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const data = await this.importService.getAllImports(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return { ok: true, data };
  }

  @Post('admin/imports/:revisionId/undo')
  @ApiOperation({ summary: 'Undo revision by revision ID' })
  async undoByRevision(@Param('revisionId', ParseIntPipe) revisionId: number, @CurrentUser('id') userId: number) {
    const result = await this.importService.undoRevisionById(revisionId, userId);
    return { ok: true, data: result };
  }

  @Post('import/undo/:reportId')
  @ApiOperation({ summary: 'Undo the last revision for a report (alias)' })
  async undo(@Param('reportId', ParseIntPipe) reportId: number, @CurrentUser('id') userId: number) {
    const result = await this.importService.undoRevision(reportId, userId);
    return { ok: true, data: result };
  }

  @Get('import/revisions/:reportId')
  @ApiOperation({ summary: 'List all revisions for a report' })
  async getRevisions(@Param('reportId', ParseIntPipe) reportId: number) {
    const revisions = await this.importService.getRevisions(reportId);
    return { ok: true, data: revisions };
  }
}
