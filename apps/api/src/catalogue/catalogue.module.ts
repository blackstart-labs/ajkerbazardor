import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { GroupMapService } from './group-map.service.js';
import { GroupMapController } from './group-map.controller.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { UnitsController } from './units.controller.js';
import { CorrectionsService } from './corrections.service.js';
import { CorrectionsController } from './corrections.controller.js';

@Module({
  controllers: [CategoriesController, GroupMapController, ProductsController, UnitsController, CorrectionsController],
  providers: [CategoriesService, GroupMapService, ProductsService, CorrectionsService],
  exports: [CategoriesService, GroupMapService, ProductsService, CorrectionsService],
})
export class CatalogueModule {}
