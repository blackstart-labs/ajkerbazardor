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
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { CreateCategoryDto, UpdateCategoryDto } from './categories.service.js';

import { CategoriesService } from './categories.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories ordered by sortOrder' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getAll() {
    const data = await this.categoriesService.findAll();
    return { ok: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoriesService.findById(id);
    return { ok: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin/Editor)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: { id: number }) {
    const data = await this.categoriesService.create(dto, user.id);
    return { ok: true, data };
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder categories (Admin/Editor)' })
  @ApiResponse({ status: 200, description: 'Categories reordered' })
  async reorder(
    @Body() body: { orders: Array<{ id: number; sortOrder: number }> },
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.categoriesService.reorder(body.orders, user.id);
    return { ok: true, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (Admin/Editor)' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.categoriesService.update(id, dto, user.id);
    return { ok: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category if empty (Admin/Editor)' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'Category has products and cannot be deleted' })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    const data = await this.categoriesService.delete(id, user.id);
    return { ok: true, data };
  }
}
