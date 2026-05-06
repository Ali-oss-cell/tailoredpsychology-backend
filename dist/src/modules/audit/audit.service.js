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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    databaseService;
    prisma;
    events = [];
    counter = 1;
    constructor(databaseService, prisma) {
        this.databaseService = databaseService;
        this.prisma = prisma;
    }
    nextEventId() {
        return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    async recordEvent(dto) {
        const record = {
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
                    metadata: (record.metadata ?? {}),
                    occurred_at: new Date(record.occurredAt),
                },
            });
            return record;
        }
        this.events.push(record);
        return record;
    }
    async listEvents(query) {
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
                actorRole: row.actor_role,
                action: row.action,
                targetType: row.target_type,
                targetId: row.target_id,
                metadata: (row.metadata ?? {}),
                occurredAt: row.occurred_at.toISOString(),
            }));
        }
        return this.events.filter((event) => {
            if (query.action && event.action !== query.action)
                return false;
            if (query.targetType && event.targetType !== query.targetType)
                return false;
            if (query.targetId && event.targetId !== query.targetId)
                return false;
            if (query.actorUserId && event.actorUserId !== query.actorUserId)
                return false;
            if (query.from && new Date(event.occurredAt) < new Date(query.from))
                return false;
            if (query.to && new Date(event.occurredAt) > new Date(query.to))
                return false;
            return true;
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map