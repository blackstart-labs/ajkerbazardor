import { Controller, Post, Get, Param, Req, UseGuards, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ImportService } from './import.service.js';
import type { User } from '../drizzle/schema.js';

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload TCB daily retail price spreadsheet (.xlsx)' })
  async upload(@Req() req: FastifyRequest, @CurrentUser() user: Omit<User, 'passwordHash'>) {
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
    const result = await this.importService.importTcbFile(buffer, part.filename, user.id);

    return {
      ok: true,
      data: result,
    };
  }

  @Post('undo/:reportId')
  @ApiOperation({ summary: 'Undo the last revision for a report' })
  async undo(@Param('reportId', ParseIntPipe) reportId: number, @CurrentUser('id') userId: number) {
    const result = await this.importService.undoRevision(reportId, userId);
    return {
      ok: true,
      data: result,
    };
  }

  @Get('revisions/:reportId')
  @ApiOperation({ summary: 'List all revisions for a report' })
  async getRevisions(@Param('reportId', ParseIntPipe) reportId: number) {
    const revisions = await this.importService.getRevisions(reportId);
    return {
      ok: true,
      data: revisions,
    };
  }
}
