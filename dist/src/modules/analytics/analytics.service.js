"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    databaseService;
    prisma;
    events = [];
    idempotency = new Map();
    counter = 1;
    constructor(databaseService, prisma) {
        this.databaseService = databaseService;
        this.prisma = prisma;
    }
    mapRow(row) {
        return {
            eventId: row.event_id,
            name: row.name,
            actorUserId: row.actor_user_id,
            actorRole: row.actor_role,
            targetId: row.target_id,
            metadata: (row.metadata ?? {}),
            idempotencyKey: row.idempotency_key ?? undefined,
            occurredAt: row.occurred_at.toISOString(),
        };
    }
    async recordEvent(dto) {
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
            ? `analytics_${(0, node_crypto_1.randomUUID)().replace(/-/g, "")}`
            : `analytics_${`${this.counter++}`.padStart(6, "0")}`;
        const event = {
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
                        metadata: (event.metadata ?? {}),
                        idempotency_key: event.idempotencyKey ?? null,
                        occurred_at: new Date(event.occurredAt),
                    },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002" &&
                    event.idempotencyKey) {
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
    async listEvents() {
        if (this.databaseService.isEnabled()) {
            const rows = await this.prisma.analytics_events.findMany({
                orderBy: { occurred_at: "desc" },
            });
            return rows.map((row) => this.mapRow(row));
        }
        return [...this.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map