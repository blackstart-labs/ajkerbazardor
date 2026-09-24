import { Module } from '@nestjs/common';
import { CachePurgerService } from './cache-purger.service.js';
import { HttpCacheInterceptor } from './http-cache.interceptor.js';
import { ReportsReadService } from './reports-read.service.js';
import { ReportsReadController } from './reports-read.controller.js';
import { ProductsReadService } from './products-read.service.js';
import { ProductsReadController } from './products-read.controller.js';
import { DashboardReadService } from './dashboard-read.service.js';
import { DashboardReadController } from './dashboard-read.controller.js';

@Module({
  controllers: [ReportsReadController, ProductsReadController, DashboardReadController],
  providers: [CachePurgerService, HttpCacheInterceptor, ReportsReadService, ProductsReadService, DashboardReadService],
  exports: [CachePurgerService, ReportsReadService, ProductsReadService, DashboardReadService],
})
export class ReadModule {}
