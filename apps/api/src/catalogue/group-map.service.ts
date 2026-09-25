import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';

import { AuditService } from '../audit/audit.service.js';

export interface CreateGroupMapDto {
  sourceGroupKey: string;
  categoryId: number;
}

export interface UpdateGroupMapDto {
  categoryId: number;
}

@Injectable()
export class GroupMapService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.db
      .select({
        id: schema.groupMaps.id,
        sourceGroupKey: schema.groupMaps.sourceGroupKey,
        categoryId: schema.groupMaps.categoryId,
        categorySlug: schema.categories.slug,
        categoryNameBn: schema.categories.nameBn,
      })
      .from(schema.groupMaps)
      .leftJoin(schema.categories, eq(schema.groupMaps.categoryId, schema.categories.id));
  }

  async findById(id: number) {
    const [row] = await this.db
      .select({
        id: schema.groupMaps.id,
        sourceGroupKey: schema.groupMaps.sourceGroupKey,
        categoryId: schema.groupMaps.categoryId,
        categorySlug: schema.categories.slug,
        categoryNameBn: schema.categories.nameBn,
      })
      .from(schema.groupMaps)
      .leftJoin(schema.categories, eq(schema.groupMaps.categoryId, schema.categories.id))
      .where(eq(schema.groupMaps.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Group map with ID ${id} not found`);
    }
    return row;
  }

  async create(dto: CreateGroupMapDto, userId?: number) {
    const [inserted] = await this.db
      .insert(schema.groupMaps)
      .values({
        sourceGroupKey: dto.sourceGroupKey,
        categoryId: dto.categoryId,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create group map');
    }

    await this.auditService.log({
      userId,
      action: 'create',
      entity: 'group_map',
      entityId: inserted.id,
      diff: { created: inserted },
    });

    return inserted;
  }

  async update(id: number, dto: UpdateGroupMapDto, userId?: number) {
    const existing = await this.findById(id);

    const [updated] = await this.db
      .update(schema.groupMaps)
      .set({ categoryId: dto.categoryId })
      .where(eq(schema.groupMaps.id, id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update group map');
    }

    await this.auditService.log({
      userId,
      action: 'update',
      entity: 'group_map',
      entityId: id,
      diff: { before: existing, after: updated },
    });

    return updated;
  }

  async delete(id: number, userId?: number) {
    const existing = await this.findById(id);

    await this.db.delete(schema.groupMaps).where(eq(schema.groupMaps.id, id));

    await this.auditService.log({
      userId,
      action: 'delete',
      entity: 'group_map',
      entityId: id,
      diff: { deleted: existing },
    });

    return { success: true };
  }
}
