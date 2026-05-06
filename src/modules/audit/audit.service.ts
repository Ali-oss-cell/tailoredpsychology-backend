import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { UserRole } from "../users/types/user-role.type";

import { CreateAuditEventDto } from "./dto/create-audit-event.dto";
import { GetAuditEventsQueryDto } from "./dto/get-audit-events-query.dto";
import { AuditEventRecord } from "./entities/audit-event.record";

@Injectable()
export class AuditService {
  private events: AuditEventRecord[] = [];
  private counter = 1;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private nextEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  async recordEvent(dto: CreateAuditEventDto): Promise<AuditEventRecord> {
    const record: AuditEventRecord = {
      eventId: this.databaseService.isEnabled() ? this.nextEventId() : `audit_${`${this.counter++}`.padStart(6, "0")}`,
      actorUserId: dto.actorUserId,
      actorRole: dto.actorRole,
      action: dto.action,
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata ?? {},
      occurredAt: new Date().toISOString(),
    };
    if (this.databaseService.isEnabled()) {
      await this.prisma.audit_events.create({
        data: {
          event_id: record.eventId,
          actor_user_id: record.actorUserId,
          actor_role: record.actorRole,
          action: record.action,
          target_type: record.targetType,
          target_id: record.targetId,
          metadata: (record.metadata ?? {}) as Prisma.InputJsonValue,
          occurred_at: new Date(record.occurredAt),
        },
      });
      return record;
    }
    this.events.push(record);
    return record;
  }

  async listEvents(query: GetAuditEventsQueryDto): Promise<AuditEventRecord[]> {
    if (this.databaseService.isEnabled()) {
      const rows = await this.prisma.audit_events.findMany({
        where: {
          ...(query.action ? { action: query.action } : {}),
          ...(query.targetType ? { target_type: query.targetType } : {}),
          ...(query.targetId ? { target_id: query.targetId } : {}),
          ...(query.actorUserId ? { actor_user_id: query.actorUserId } : {}),
          ...(query.from || query.to
            ? {
                occurred_at: {
                  ...(query.from ? { gte: new Date(query.from) } : {}),
                  ...(query.to ? { lte: new Date(query.to) } : {}),
                },
              }
            : {}),
        },
        orderBy: { occurred_at: "desc" },
      });
      return rows.map((row) => ({
        eventId: row.event_id,
        actorUserId: row.actor_user_id,
        actorRole: row.actor_role as UserRole | "system",
        action: row.action,
        targetType: row.target_type as AuditEventRecord["targetType"],
        targetId: row.target_id,
        metadata: (row.metadata ?? {}) as AuditEventRecord["metadata"],
        occurredAt: row.occurred_at.toISOString(),
      }));
    }
    return this.events.filter((event) => {
      if (query.action && event.action !== query.action) return false;
      if (query.targetType && event.targetType !== query.targetType) return false;
      if (query.targetId && event.targetId !== query.targetId) return false;
      if (query.actorUserId && event.actorUserId !== query.actorUserId) return false;
      if (query.from && new Date(event.occurredAt) < new Date(query.from)) return false;
      if (query.to && new Date(event.occurredAt) > new Date(query.to)) return false;
      return true;
    });
  }
}
