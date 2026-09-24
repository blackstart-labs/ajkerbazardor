import { Injectable, Inject } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';

export interface CreateAuditLogParams {
  userId?: number | null | undefined;
  action: string;
  entity: string;
  entityId?: number | null | undefined;
  diff?: Record<string, unknown> | null | undefined;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    await this.db.insert(schema.auditLogs).values({
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      diff: params.diff ? JSON.stringify(params.diff) : null,
      at: new Date().toISOString(),
    });
  }

  async getLogs(limit = 50, offset = 0, entity?: string) {
    let query = this.db
      .select({
        id: schema.auditLogs.id,
        userId: schema.auditLogs.userId,
        action: schema.auditLogs.action,
        entity: schema.auditLogs.entity,
        entityId: schema.auditLogs.entityId,
        diff: schema.auditLogs.diff,
        at: schema.auditLogs.at,
      })
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.at))
      .limit(limit)
      .offset(offset);

    if (entity) {
      // @ts-expect-error Drizzle query building
      query = query.where(eq(schema.auditLogs.entity, entity));
    }

    const items = await query;
    return items.map((item) => ({
      ...item,
      diff: item.diff ? JSON.parse(item.diff) : null,
    }));
  }
}
