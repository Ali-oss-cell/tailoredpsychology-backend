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
exports.PatientDataRequestsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
let PatientDataRequestsService = class PatientDataRequestsService {
    databaseService;
    prisma;
    auditService;
    requests = new Map();
    counter = 1;
    constructor(databaseService, prisma, auditService) {
        this.databaseService = databaseService;
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createForPatient(user, dto) {
        this.assertPatient(user);
        const now = new Date().toISOString();
        const request = {
            requestId: `pdr_${`${this.counter++}`.padStart(4, "0")}`,
            patientId: user.sub,
            requestType: dto.requestType,
            status: "submitted",
            details: dto.details.trim(),
            requestedCorrection: dto.requestedCorrection?.trim() || undefined,
            slaDueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: now,
            updatedAt: now,
        };
        await this.save(request);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_data_request_created",
            targetType: "auth",
            targetId: request.requestId,
            metadata: { requestType: request.requestType, status: request.status },
        });
        return request;
    }
    async listForPatient(user) {
        this.assertPatient(user);
        const rows = await this.list();
        return rows.filter((item) => item.patientId === user.sub);
    }
    async getForPatient(user, requestId) {
        this.assertPatient(user);
        const request = await this.getById(requestId);
        if (request.patientId !== user.sub) {
            throw new common_1.ForbiddenException("You cannot access this request");
        }
        return request;
    }
    async listForOps(user) {
        this.assertOps(user);
        return this.list();
    }
    async applyAction(user, requestId, dto) {
        this.assertOps(user);
        const request = await this.getById(requestId);
        const now = new Date().toISOString();
        this.assertTransitionable(request.status, dto.action);
        const next = this.reduceAction(request, user.sub, dto, now);
        await this.save(next);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_data_request_status_changed",
            targetType: "auth",
            targetId: requestId,
            metadata: { action: dto.action, status: next.status, reason: dto.reason?.trim() || null },
        });
        return next;
    }
    reduceAction(request, actorUserId, dto, now) {
        const notes = dto.notes?.trim() || undefined;
        const reason = dto.reason?.trim() || undefined;
        if (dto.action === "assign") {
            return { ...request, status: "triage_review", triageOwnerUserId: actorUserId, triagedAt: now, updatedAt: now };
        }
        if (dto.action === "start_review") {
            return { ...request, status: "in_progress", triageOwnerUserId: request.triageOwnerUserId ?? actorUserId, updatedAt: now };
        }
        if (dto.action === "fulfill") {
            return {
                ...request,
                status: "fulfilled",
                triageOwnerUserId: request.triageOwnerUserId ?? actorUserId,
                resolutionNotes: notes ?? "Request fulfilled.",
                resolvedAt: now,
                updatedAt: now,
            };
        }
        if (dto.action === "reject") {
            return {
                ...request,
                status: "rejected",
                triageOwnerUserId: request.triageOwnerUserId ?? actorUserId,
                resolutionNotes: notes ?? reason ?? "Request rejected.",
                resolvedAt: now,
                updatedAt: now,
            };
        }
        return {
            ...request,
            status: "cancelled",
            resolutionNotes: notes ?? reason ?? "Request cancelled.",
            resolvedAt: now,
            updatedAt: now,
        };
    }
    assertTransitionable(current, action) {
        if (["fulfilled", "rejected", "cancelled"].includes(current)) {
            throw new common_1.ConflictException(`Request already finalized as ${current}`);
        }
        if (current === "submitted" && !["assign", "cancel"].includes(action)) {
            throw new common_1.ConflictException("Submitted requests must be assigned before review actions");
        }
        if (current === "triage_review" && !["start_review", "fulfill", "reject", "cancel"].includes(action)) {
            throw new common_1.ConflictException("Triage review request only supports start_review/fulfill/reject/cancel");
        }
        if (current === "in_progress" && !["fulfill", "reject", "cancel"].includes(action)) {
            throw new common_1.ConflictException("In-progress request only supports fulfill/reject/cancel");
        }
    }
    assertPatient(user) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can manage own data requests");
        }
    }
    assertOps(user) {
        if (user.role !== "admin" && user.role !== "practice_manager") {
            throw new common_1.ForbiddenException("Only admin/practice_manager can triage patient data requests");
        }
    }
    async getById(requestId) {
        if (!this.databaseService.isEnabled()) {
            const found = this.requests.get(requestId);
            if (!found)
                throw new common_1.NotFoundException("Patient data request not found");
            return found;
        }
        const row = await this.prisma.patient_data_requests.findUnique({
            where: { request_id: requestId },
        });
        if (!row)
            throw new common_1.NotFoundException("Patient data request not found");
        return this.mapPrismaRow(row);
    }
    async list() {
        if (!this.databaseService.isEnabled()) {
            return [...this.requests.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        }
        const rows = await this.prisma.patient_data_requests.findMany({
            orderBy: { updated_at: "desc" },
        });
        return rows.map((row) => this.mapPrismaRow(row));
    }
    async save(request) {
        if (!this.databaseService.isEnabled()) {
            this.requests.set(request.requestId, request);
            return;
        }
        await this.prisma.patient_data_requests.upsert({
            where: { request_id: request.requestId },
            create: {
                request_id: request.requestId,
                patient_id: request.patientId,
                request_type: request.requestType,
                status: request.status,
                details: request.details,
                requested_correction: request.requestedCorrection ?? null,
                triage_owner_user_id: request.triageOwnerUserId ?? null,
                resolution_notes: request.resolutionNotes ?? null,
                sla_due_at: new Date(request.slaDueAt),
                triaged_at: request.triagedAt ? new Date(request.triagedAt) : null,
                resolved_at: request.resolvedAt ? new Date(request.resolvedAt) : null,
                created_at: new Date(request.createdAt),
                updated_at: new Date(request.updatedAt),
            },
            update: {
                status: request.status,
                triage_owner_user_id: request.triageOwnerUserId ?? null,
                resolution_notes: request.resolutionNotes ?? null,
                triaged_at: request.triagedAt ? new Date(request.triagedAt) : null,
                resolved_at: request.resolvedAt ? new Date(request.resolvedAt) : null,
                updated_at: new Date(request.updatedAt),
            },
        });
    }
    mapPrismaRow(row) {
        return {
            requestId: row.request_id,
            patientId: row.patient_id,
            requestType: row.request_type,
            status: row.status,
            details: row.details,
            requestedCorrection: row.requested_correction ?? undefined,
            triageOwnerUserId: row.triage_owner_user_id ?? undefined,
            resolutionNotes: row.resolution_notes ?? undefined,
            slaDueAt: row.sla_due_at.toISOString(),
            triagedAt: row.triaged_at ? row.triaged_at.toISOString() : undefined,
            resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }
};
exports.PatientDataRequestsService = PatientDataRequestsService;
exports.PatientDataRequestsService = PatientDataRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PatientDataRequestsService);
//# sourceMappingURL=patient-data-requests.service.js.map