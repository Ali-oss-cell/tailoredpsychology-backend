import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { UserRole } from "../users/types/user-role.type";

import { CreateAnalyticsEventDto } from "./dto/create-analytics-event.dto";
import { AnalyticsEventRecord } from "./entities/analytics-event.record";

@Injectable()
export class AnalyticsService {
  private events: AnalyticsEventRecord[] = [];
  private idempotency = new Map<string, string>();
  private counter = 1;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private mapRow(row: {
    event_id: string;
    name: string;
    actor_user_id: string;
    actor_role: string;
    target_id: string;
    metadata: unknown;
    idempotency_key: string | null;
    occurred_at: Date;
  }): AnalyticsEventRecord {
    return {
      eventId: row.event_id,
      name: row.name as AnalyticsEventRecord["name"],
      actorUserId: row.actor_user_id,
      actorRole: row.actor_role as UserRole | "system",
      targetId: row.target_id,
      metadata: (row.metadata ?? {}) as AnalyticsEventRecord["metadata"],
      idempotencyKey: row.idempotency_key ?? undefined,
      occurredAt: row.occurred_at.toISOString(),
    };
  }

  async recordEvent(dto: CreateAnalyticsEventDto): Promise<AnalyticsEventRecord> {
    if (this.databaseService.isEnabled() && dto.idempotencyKey) {
      const existing = await this.prisma.analytics_events.findFirst({
        where: { idempotency_key: dto.idempotencyKey },
      });
      if (existing) {
        return this.mapRow(existing);
      }
    }

    if (dto.idempotencyKey) {
      const existingId = this.idempotency.get(dto.idempotencyKey);
      if (existingId) {
        const ev = this.events.find((item) => item.eventId === existingId);
        if (ev) {
          return ev;
        }
      }
    }

    const eventId = this.databaseService.isEnabled()
      ? `analytics_${randomUUID().replace(/-/g, "")}`
      : `analytics_${`${this.counter++}`.padStart(6, "0")}`;
    const event: AnalyticsEventRecord = {
      eventId,
      name: dto.name,
      actorUserId: dto.actorUserId ?? "anonymous",
      actorRole: dto.actorRole ?? "system",
      targetId: dto.targetId,
      occurredAt: new Date().toISOString(),
      metadata: dto.metadata ?? {},
      idempotencyKey: dto.idempotencyKey,
    };
    if (this.databaseService.isEnabled()) {
      try {
        await this.prisma.analytics_events.create({
          data: {
            event_id: event.eventId,
            name: event.name,
            actor_user_id: event.actorUserId,
            actor_role: event.actorRole,
            target_id: event.targetId,
            metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
            idempotency_key: event.idempotencyKey ?? null,
            occurred_at: new Date(event.occurredAt),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          event.idempotencyKey
        ) {
          const persisted = await this.prisma.analytics_events.findFirst({
            where: { idempotency_key: event.idempotencyKey },
          });
          if (persisted) {
            return this.mapRow(persisted);
          }
        }
        throw error;
      }
      if (event.idempotencyKey) {
        const persisted = await this.prisma.analytics_events.findFirst({
          where: { idempotency_key: event.idempotencyKey },
        });
        if (persisted) {
          return this.mapRow(persisted);
        }
      }
      return event;
    }
    this.events.push(event);
    if (dto.idempotencyKey) {
      this.idempotency.set(dto.idempotencyKey, event.eventId);
    }
    return event;
  }

  async listEvents(): Promise<AnalyticsEventRecord[]> {
    if (this.databaseService.isEnabled()) {
      const rows = await this.prisma.analytics_events.findMany({
        orderBy: { occurred_at: "desc" },
      });
      return rows.map((row) => this.mapRow(row));
    }
    return [...this.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }
}
