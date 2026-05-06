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
exports.SecurityIncidentsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SecurityIncidentsService = class SecurityIncidentsService {
    db;
    prisma;
    auditService;
    counter = 1;
    incidents = new Map();
    constructor(db, prisma, auditService) {
        this.db = db;
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(user, dto) {
        this.assertAdmin(user);
        const now = new Date().toISOString();
        const incident = {
            incidentId: `sec_${`${this.counter++}`.padStart(4, "0")}`,
            title: dto.title.trim(),
            summary: dto.summary.trim(),
            severity: dto.severity,
            impact: dto.impact,
            status: "reported",
            ndbAssessment: dto.containsPersonalData ? "assessment_in_progress" : "not_required",
            containsPersonalData: dto.containsPersonalData,
            detectedAt: dto.detectedAt ?? now,
            createdAt: now,
            updatedAt: now,
        };
        await this.save(incident);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "security_incident_created",
            targetType: "system",
            targetId: incident.incidentId,
            metadata: { severity: incident.severity, status: incident.status },
        });
        return incident;
    }
    async list(user) {
        this.assertAdmin(user);
        if (!this.db.isEnabled()) {
            return [...this.incidents.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        }
        const rows = await this.prisma.security_incidents.findMany({
            orderBy: { updated_at: "desc" },
        });
        return rows.map((row) => this.mapPrisma(row));
    }
    async update(user, incidentId, dto) {
        this.assertAdmin(user);
        const current = await this.getById(incidentId);
        if (dto.status && dto.status !== current.status) {
            this.assertTransitionable(current.status, dto.status);
        }
        const now = new Date().toISOString();
        const nextStatus = dto.status ?? current.status;
        const updated = {
            ...current,
            status: nextStatus,
            impact: dto.impact ?? current.impact,
            ndbAssessment: dto.ndbAssessment ?? current.ndbAssessment,
            assignedOwnerUserId: dto.assignedOwnerUserId ?? current.assignedOwnerUserId,
            resolutionNotes: dto.resolutionNotes ?? current.resolutionNotes,
            closedAt: nextStatus === "closed" ? current.closedAt ?? now : undefined,
            updatedAt: now,
        };
        await this.save(updated);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "security_incident_updated",
            targetType: "system",
            targetId: updated.incidentId,
            metadata: { fromStatus: current.status, toStatus: updated.status, ndbAssessment: updated.ndbAssessment },
        });
        return updated;
    }
    assertTransitionable(current, next) {
        const transitions = {
            reported: ["triage"],
            triage: ["investigating", "closed"],
            investigating: ["notification_assessment", "closed"],
            notification_assessment: ["notification_ready", "closed"],
            notification_ready: ["closed"],
            closed: [],
        };
        if (!transitions[current].includes(next)) {
            throw new common_1.ConflictException(`Invalid incident transition from ${current} to ${next}`);
        }
    }
    assertAdmin(user) {
        if (user.role !== "admin") {
            throw new common_1.ForbiddenException("Only admin can manage security incidents");
        }
    }
    async getById(incidentId) {
        if (!this.db.isEnabled()) {
            const found = this.incidents.get(incidentId);
            if (!found)
                throw new common_1.NotFoundException("Security incident not found");
            return found;
        }
        const row = await this.prisma.security_incidents.findUnique({
            where: { incident_id: incidentId },
        });
        if (!row)
            throw new common_1.NotFoundException("Security incident not found");
        return this.mapPrisma(row);
    }
    async save(incident) {
        if (!this.db.isEnabled()) {
            this.incidents.set(incident.incidentId, incident);
            return;
        }
        await this.prisma.security_incidents.upsert({
            where: { incident_id: incident.incidentId },
            create: {
                incident_id: incident.incidentId,
                title: incident.title,
                summary: incident.summary,
                severity: incident.severity,
                impact: incident.impact,
                status: incident.status,
                ndb_assessment: incident.ndbAssessment,
                contains_personal_data: incident.containsPersonalData,
                assigned_owner_user_id: incident.assignedOwnerUserId ?? null,
                resolution_notes: incident.resolutionNotes ?? null,
                detected_at: new Date(incident.detectedAt),
                created_at: new Date(incident.createdAt),
                updated_at: new Date(incident.updatedAt),
                closed_at: incident.closedAt ? new Date(incident.closedAt) : null,
            },
            update: {
                impact: incident.impact,
                status: incident.status,
                ndb_assessment: incident.ndbAssessment,
                assigned_owner_user_id: incident.assignedOwnerUserId ?? null,
                resolution_notes: incident.resolutionNotes ?? null,
                updated_at: new Date(incident.updatedAt),
                closed_at: incident.closedAt ? new Date(incident.closedAt) : null,
            },
        });
    }
    mapPrisma(row) {
        return {
            incidentId: row.incident_id,
            title: row.title,
            summary: row.summary,
            severity: row.severity,
            impact: row.impact,
            status: row.status,
            ndbAssessment: row.ndb_assessment,
            containsPersonalData: row.contains_personal_data,
            assignedOwnerUserId: row.assigned_owner_user_id ?? undefined,
            resolutionNotes: row.resolution_notes ?? undefined,
            detectedAt: row.detected_at.toISOString(),
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            closedAt: row.closed_at ? row.closed_at.toISOString() : undefined,
        };
    }
};
exports.SecurityIncidentsService = SecurityIncidentsService;
exports.SecurityIncidentsService = SecurityIncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SecurityIncidentsService);
//# sourceMappingURL=security-incidents.service.js.map