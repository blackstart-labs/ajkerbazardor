import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { ProductsService } from './products.service.js';
import type { CreateProductDto, UpdateProductDto, ApproveProductDto } from './products.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Admin / Products')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@ApiBearerAuth()
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get(['admin/products', 'catalogue/products'])
  @ApiOperation({ summary: 'List products for admin with filters and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'needsReview', required: false, type: Boolean })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of products' })
  async getProducts(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('needsReview') needsReview?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.productsService.findAdmin({
      search: search ?? q,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      needsReview: needsReview !== undefined ? needsReview === 'true' || needsReview === '1' : undefined,
      includeArchived: includeArchived === 'true' || includeArchived === '1',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return { ok: true, data };
  }

  @Get(['admin/review-queue', 'catalogue/review-queue'])
  @ApiOperation({ summary: 'List products that require admin review' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products needing review' })
  async getReviewQueue(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const data = await this.productsService.getReviewQueue(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return { ok: true, data };
  }

  @Put(['admin/review-queue/:id/approve', 'catalogue/review-queue/:id/approve'])
  @ApiOperation({ summary: 'Approve an auto-created product from the review queue' })
  @ApiResponse({ status: 200, description: 'Product approved' })
  async approveProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveProductDto,
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.productsService.approve(id, dto, user.id);
    return { ok: true, data };
  }

  @Get(['admin/products/:id', 'catalogue/products/:id'])
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productsService.findById(id);
    return { ok: true, data };
  }

  @Post(['admin/products', 'catalogue/products'])
  @ApiOperation({ summary: 'Create a new product manually' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Duplicate or invalid data' })
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: { id: number }) {
    const data = await this.productsService.create(dto, user.id);
    return { ok: true, data };
  }

  @Put(['admin/products/:id', 'catalogue/products/:id'])
  @Patch(['admin/products/:id', 'catalogue/products/:id'])
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: number },
  ) {
    const data = await this.productsService.update(id, dto, user.id);
    return { ok: true, data };
  }

  @Put(['admin/products/:id/archive', 'catalogue/products/:id/archive'])
  @ApiOperation({ summary: 'Soft-archive a product' })
  @ApiResponse({ status: 200, description: 'Product archived' })
  async archiveProduct(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    const data = await this.productsService.archive(id, user.id);
    return { ok: true, data };
  }

  @Put(['admin/products/:id/unarchive', 'catalogue/products/:id/unarchive'])
  @ApiOperation({ summary: 'Restore an archived product' })
  @ApiResponse({ status: 200, description: 'Product unarchived' })
  async unarchiveProduct(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    const data = await this.productsService.unarchive(id, user.id);
    return { ok: true, data };
  }

  @Delete(['admin/products/:id', 'catalogue/products/:id'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete a product (only allowed if no price history exists)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 400, description: 'Product has price history and cannot be hard deleted' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    const data = await this.productsService.delete(id, user.id);
    return { ok: true, data };
  }
}
