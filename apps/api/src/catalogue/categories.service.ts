import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, asc, count } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';

import { AuditService } from '../audit/audit.service.js';

export interface CreateCategoryDto {
  slug: string;
  nameBn: string;
  sortOrder?: number | undefined;
  illustration?: string | null | undefined;
}

export interface UpdateCategoryDto {
  slug?: string | undefined;
  nameBn?: string | undefined;
  sortOrder?: number | undefined;
  illustration?: string | null | undefined;
}

const categorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/);
const createCategorySchema = z.object({
  slug: categorySlugSchema,
  nameBn: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
  illustration: z.string().trim().min(1).nullable().optional(),
});
const updateCategorySchema = createCategorySchema.partial().refine((dto) => Object.keys(dto).length > 0, {
  message: 'At least one category field must be provided',
});
const reorderSchema = z.array(
  z.object({
    id: z.coerce.number().int().positive(),
    sortOrder: z.coerce.number().int().min(0),
  }),
);

function parseAdminDto<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(result.error.issues.map((issue) => issue.message).join('; '));
  }
  return result.data;
}

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
  }

  async findById(id: number) {
    const [category] = await this.db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, userId?: number) {
    dto = parseAdminDto(createCategorySchema, dto);
    const sortOrder = dto.sortOrder ?? 0;
    const [inserted] = await this.db
      .insert(schema.categories)
      .values({
        slug: dto.slug,
        nameBn: dto.nameBn,
        sortOrder,
        illustration: dto.illustration ?? null,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create category');
    }

    await this.auditService.log({
      userId,
      action: 'create',
      entity: 'category',
      entityId: inserted.id,
      diff: { created: inserted },
    });

    return inserted;
  }

  async update(id: number, dto: UpdateCategoryDto, userId?: number) {
    dto = parseAdminDto(updateCategorySchema, dto);
    const existing = await this.findById(id);

    const valuesToUpdate: Record<string, unknown> = {};
    if (dto.slug !== undefined) valuesToUpdate.slug = dto.slug;
    if (dto.nameBn !== undefined) valuesToUpdate.nameBn = dto.nameBn;
    if (dto.sortOrder !== undefined) valuesToUpdate.sortOrder = dto.sortOrder;
    if (dto.illustration !== undefined) valuesToUpdate.illustration = dto.illustration;

    if (Object.keys(valuesToUpdate).length === 0) {
      return existing;
    }

    const [updated] = await this.db
      .update(schema.categories)
      .set(valuesToUpdate)
      .where(eq(schema.categories.id, id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update category');
    }

    await this.auditService.log({
      userId,
      action: 'update',
      entity: 'category',
      entityId: id,
      diff: { before: existing, after: updated },
    });

    return updated;
  }

  async reorder(orders: Array<{ id: number; sortOrder: number }>, userId?: number) {
    orders = parseAdminDto(reorderSchema, orders);
    for (const item of orders) {
      await this.db
        .update(schema.categories)
        .set({ sortOrder: item.sortOrder })
        .where(eq(schema.categories.id, item.id));
    }

    await this.auditService.log({
      userId,
      action: 'reorder',
      entity: 'category',
      diff: { orders },
    });

    return this.findAll();
  }

  async delete(id: number, userId?: number) {
    const existing = await this.findById(id);

    // Check if products exist in category
    const [productCount] = await this.db
      .select({ val: count() })
      .from(schema.products)
      .where(eq(schema.products.categoryId, id));

    if (productCount && productCount.val > 0) {
      throw new BadRequestException(
        `Cannot delete category "${existing.nameBn}" because it has ${productCount.val} products associated with it.`,
      );
    }

    await this.db.delete(schema.categories).where(eq(schema.categories.id, id));

    await this.auditService.log({
      userId,
      action: 'delete',
      entity: 'category',
      entityId: id,
      diff: { deleted: existing },
    });

    return { success: true };
  }
}
