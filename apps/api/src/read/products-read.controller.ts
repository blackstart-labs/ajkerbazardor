import { Controller, Get, Param, Query, UseInterceptors, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

import { ProductsReadService } from './products-read.service.js';
import { HttpCacheInterceptor } from './http-cache.interceptor.js';

@ApiTags('Public / Products')
@Controller('products')
@UseInterceptors(HttpCacheInterceptor)
export class ProductsReadController {
  constructor(@Inject(ProductsReadService) private readonly productsService: ProductsReadService) {}

  @Get()
  @ApiOperation({ summary: 'List public products with storefront cards, filters, and sparklines' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug or ID' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term in Bangla or Latin' })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['price_asc', 'price_desc', 'change_asc', 'change_desc', 'name', 'sort_order'],
  })
  @ApiQuery({ name: 'direction', required: false, enum: ['up', 'down', 'same'] })
  @ApiQuery({ name: 'min', required: false, type: Number })
  @ApiQuery({ name: 'max', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'date', required: false, description: 'Optional report date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Paginated list of storefront product cards' })
  async list(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'price_asc' | 'price_desc' | 'change_asc' | 'change_desc' | 'name' | 'sort_order',
    @Query('direction') direction?: 'up' | 'down' | 'same',
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.productsService.listProducts({
      category,
      q,
      sort,
      direction,
      min: min !== undefined ? parseFloat(min) : undefined,
      max: max !== undefined ? parseFloat(max) : undefined,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      date,
    });
    return { ok: true, data };
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare up to 4 products over time (absolute price or rebased index)' })
  @ApiQuery({ name: 'slugs', required: true, description: 'Comma-separated product slugs' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d', '1y', 'all'], example: '30d' })
  @ApiResponse({ status: 200, description: 'Comparison series and metadata' })
  async compare(@Query('slugs') slugs: string, @Query('range') range?: string) {
    const slugList = (slugs || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const data = await this.productsService.compareProducts(slugList, range);
    return { ok: true, data };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single product details with 4 context points (today, week, month, year)' })
  @ApiParam({ name: 'slug', example: 'alu-deshi' })
  @ApiResponse({ status: 200, description: 'Product PDP data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.productsService.getProductBySlug(slug);
    return { ok: true, data };
  }

  @Get(':slug/history')
  @ApiOperation({ summary: 'Get price history time series for PDP line chart' })
  @ApiParam({ name: 'slug', example: 'alu-deshi' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d', '1y', 'all'], example: '30d' })
  @ApiResponse({ status: 200, description: 'History points array' })
  async getHistory(@Param('slug') slug: string, @Query('range') range?: string) {
    const data = await this.productsService.getProductHistory(slug, range);
    return { ok: true, data };
  }
}
