import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, like, sql, desc, count } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { normaliseName } from '@ajkerbazardor/shared';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AuditService } from '../audit/audit.service.js';

export interface AdminProductFilter {
  search?: string | undefined;
  categoryId?: number | undefined;
  needsReview?: boolean | undefined;
  includeArchived?: boolean | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface CreateProductDto {
  nameBn: string;
  slug?: string | undefined;
  categoryId: number;
  unitId: number;
  image?: string | null | undefined;
  aliases?: string[] | undefined;
  sortOrder?: number | undefined;
  needsReview?: boolean | undefined;
}

export interface UpdateProductDto {
  nameBn?: string | undefined;
  slug?: string | undefined;
  categoryId?: number | undefined;
  unitId?: number | undefined;
  image?: string | null | undefined;
  aliases?: string[] | undefined;
  sortOrder?: number | undefined;
  needsReview?: boolean | undefined;
}

export interface ApproveProductDto {
  categoryId?: number | undefined;
  unitId?: number | undefined;
  nameBn?: string | undefined;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly auditService: AuditService,
  ) {}

  async findAdmin(filter: AdminProductFilter) {
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    const conditions = [];

    if (!filter.includeArchived) {
      conditions.push(isNull(schema.products.archivedAt));
    }

    if (filter.categoryId !== undefined) {
      conditions.push(eq(schema.products.categoryId, filter.categoryId));
    }

    if (filter.needsReview !== undefined) {
      conditions.push(eq(schema.products.needsReview, filter.needsReview));
    }

    if (filter.search) {
      conditions.push(like(schema.products.nameBn, `%${filter.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await this.db.select({ count: count() }).from(schema.products).where(whereClause);

    const items = await this.db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        nameBn: schema.products.nameBn,
        nameKey: schema.products.nameKey,
        categoryId: schema.products.categoryId,
        categoryNameBn: schema.categories.nameBn,
        categorySlug: schema.categories.slug,
        unitId: schema.products.unitId,
        unitCode: schema.units.code,
        unitLabelBn: schema.units.labelBn,
        image: schema.products.image,
        aliases: schema.products.aliases,
        needsReview: schema.products.needsReview,
        sortOrder: schema.products.sortOrder,
        archivedAt: schema.products.archivedAt,
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.units, eq(schema.products.unitId, schema.units.id))
      .where(whereClause)
      .orderBy(desc(schema.products.id))
      .limit(limit)
      .offset(offset);

    return {
      items: items.map((i) => ({
        ...i,
        aliases: typeof i.aliases === 'string' ? JSON.parse(i.aliases) : (i.aliases ?? []),
      })),
      total: totalRow?.count ?? 0,
      limit,
      offset,
    };
  }

  async findById(id: number) {
    const [item] = await this.db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        nameBn: schema.products.nameBn,
        nameKey: schema.products.nameKey,
        categoryId: schema.products.categoryId,
        categoryNameBn: schema.categories.nameBn,
        categorySlug: schema.categories.slug,
        unitId: schema.products.unitId,
        unitCode: schema.units.code,
        unitLabelBn: schema.units.labelBn,
        image: schema.products.image,
        aliases: schema.products.aliases,
        needsReview: schema.products.needsReview,
        sortOrder: schema.products.sortOrder,
        archivedAt: schema.products.archivedAt,
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.units, eq(schema.products.unitId, schema.units.id))
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      ...item,
      aliases: typeof item.aliases === 'string' ? JSON.parse(item.aliases) : (item.aliases ?? []),
    };
  }

  async create(dto: CreateProductDto, userId?: number) {
    const nameKey = normaliseName(dto.nameBn);

    // Verify unit exists
    const [unit] = await this.db.select().from(schema.units).where(eq(schema.units.id, dto.unitId)).limit(1);
    if (!unit) {
      throw new BadRequestException(`Unit with ID ${dto.unitId} does not exist`);
    }

    // Verify category exists
    const [cat] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, dto.categoryId))
      .limit(1);
    if (!cat) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} does not exist`);
    }

    // Check duplicate (nameKey, unitId)
    const [existing] = await this.db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.nameKey, nameKey), eq(schema.products.unitId, dto.unitId)))
      .limit(1);

    if (existing) {
      throw new BadRequestException(
        `A product with normalised name "${nameKey}" and unit "${unit.labelBn}" already exists (ID: ${existing.id}).`,
      );
    }

    const slug = dto.slug || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [inserted] = await this.db
      .insert(schema.products)
      .values({
        slug,
        nameBn: dto.nameBn,
        nameKey,
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        image: dto.image ?? null,
        aliases: JSON.stringify(dto.aliases ?? []),
        needsReview: dto.needsReview ?? false,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create product');
    }

    await this.auditService.log({
      userId,
      action: 'create',
      entity: 'product',
      entityId: inserted.id,
      diff: { created: inserted },
    });

    return this.findById(inserted.id);
  }

  async update(id: number, dto: UpdateProductDto, userId?: number) {
    const existing = await this.findById(id);

    const valuesToUpdate: Record<string, unknown> = {};

    if (dto.nameBn !== undefined) {
      valuesToUpdate.nameBn = dto.nameBn;
      valuesToUpdate.nameKey = normaliseName(dto.nameBn);
    }

    if (dto.slug !== undefined) valuesToUpdate.slug = dto.slug;
    if (dto.categoryId !== undefined) valuesToUpdate.categoryId = dto.categoryId;
    if (dto.unitId !== undefined) valuesToUpdate.unitId = dto.unitId;
    if (dto.image !== undefined) valuesToUpdate.image = dto.image;
    if (dto.aliases !== undefined) valuesToUpdate.aliases = JSON.stringify(dto.aliases);
    if (dto.sortOrder !== undefined) valuesToUpdate.sortOrder = dto.sortOrder;
    if (dto.needsReview !== undefined) valuesToUpdate.needsReview = dto.needsReview;

    if (Object.keys(valuesToUpdate).length === 0) {
      return existing;
    }

    // Check duplicate if nameKey or unitId changed
    const targetNameKey = (valuesToUpdate.nameKey as string) ?? existing.nameKey;
    const targetUnitId = (valuesToUpdate.unitId as number) ?? existing.unitId;

    if (targetNameKey !== existing.nameKey || targetUnitId !== existing.unitId) {
      const [duplicate] = await this.db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.nameKey, targetNameKey),
            eq(schema.products.unitId, targetUnitId),
            sql`${schema.products.id} != ${id}`,
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new BadRequestException(
          `Another product already has normalised name "${targetNameKey}" and unit ${targetUnitId}.`,
        );
      }
    }

    const [updated] = await this.db
      .update(schema.products)
      .set(valuesToUpdate)
      .where(eq(schema.products.id, id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update product');
    }

    await this.auditService.log({
      userId,
      action: 'update',
      entity: 'product',
      entityId: id,
      diff: { before: existing, after: updated },
    });

    return this.findById(id);
  }

  async archive(id: number, userId?: number) {
    await this.findById(id);
    const now = new Date().toISOString();

    await this.db.update(schema.products).set({ archivedAt: now }).where(eq(schema.products.id, id));

    await this.auditService.log({
      userId,
      action: 'archive',
      entity: 'product',
      entityId: id,
      diff: { archivedAt: now },
    });

    return { success: true, archivedAt: now };
  }

  async unarchive(id: number, userId?: number) {
    await this.findById(id);

    await this.db.update(schema.products).set({ archivedAt: null }).where(eq(schema.products.id, id));

    await this.auditService.log({
      userId,
      action: 'unarchive',
      entity: 'product',
      entityId: id,
      diff: { archivedAt: null },
    });

    return { success: true };
  }

  async delete(id: number, userId?: number) {
    const existing = await this.findById(id);

    // Hard delete is ONLY permitted if product has no price entries
    const [priceRow] = await this.db
      .select({ count: count() })
      .from(schema.priceEntries)
      .where(eq(schema.priceEntries.productId, id));

    if (priceRow && priceRow.count > 0) {
      throw new BadRequestException(
        `Cannot delete product "${existing.nameBn}" because it has ${priceRow.count} recorded price entries. Please archive it instead.`,
      );
    }

    await this.db.delete(schema.products).where(eq(schema.products.id, id));

    await this.auditService.log({
      userId,
      action: 'delete',
      entity: 'product',
      entityId: id,
      diff: { deleted: existing },
    });

    return { success: true };
  }

  async getReviewQueue(limit = 50, offset = 0) {
    return this.findAdmin({
      needsReview: true,
      includeArchived: false,
      limit,
      offset,
    });
  }

  async approve(id: number, dto: ApproveProductDto, userId?: number) {
    await this.findById(id);

    const updatePayload: UpdateProductDto = {
      needsReview: false,
    };
    if (dto.categoryId !== undefined) updatePayload.categoryId = dto.categoryId;
    if (dto.unitId !== undefined) updatePayload.unitId = dto.unitId;
    if (dto.nameBn !== undefined) updatePayload.nameBn = dto.nameBn;

    const updated = await this.update(id, updatePayload, userId);

    await this.auditService.log({
      userId,
      action: 'approve',
      entity: 'product',
      entityId: id,
      diff: { approved: true, ...dto },
    });

    return updated;
  }
}
