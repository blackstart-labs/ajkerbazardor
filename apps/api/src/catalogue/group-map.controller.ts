import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { CreateGroupMapDto, UpdateGroupMapDto } from './group-map.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { GroupMapService } from './group-map.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Admin / Group Map')
@Controller('admin/group-maps')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@ApiBearerAuth()
export class GroupMapController {
  constructor(private readonly groupMapService: GroupMapService) {}

  @Get()
  @ApiOperation({ summary: 'List all TCB group-to-category mappings' })
  @ApiResponse({ status: 200, description: 'List of group mappings' })
  async getAll() {
    const data = await this.groupMapService.findAll();
    return { ok: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group mapping by ID' })
  @ApiResponse({ status: 200, description: 'Group mapping details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.groupMapService.findById(id);
    return { ok: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new TCB group-to-category mapping' })
  @ApiResponse({ status: 201, description: 'Mapping created' })
  async create(@Body() dto: CreateGroupMapDto, @CurrentUser() user: { id: number }) {
    const data = await this.groupMapService.create(dto, user.id);
    return { ok: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a TCB group-to-category mapping' })
  @ApiResponse({ status: 200, description: 'Mapping updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupMapDto,
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.groupMapService.update(id, dto, user.id);
    return { ok: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a group mapping' })
  @ApiResponse({ status: 200, description: 'Mapping deleted' })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    const data = await this.groupMapService.delete(id, user.id);
    return { ok: true, data };
  }
}
