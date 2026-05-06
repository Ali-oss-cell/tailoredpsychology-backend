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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
const MAX_REFERRAL_SIZE_BYTES = 8 * 1024 * 1024;
const OPS_ROLES = new Set(["practice_manager", "admin"]);
function toMillis(value) {
    if (value instanceof Date)
        return value.getTime();
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}
let ResourcesService = class ResourcesService {
    auditService;
    databaseService;
    prisma;
    referralCounter = 1;
    referrals = [];
    constructor(auditService, databaseService, prisma) {
        this.auditService = auditService;
        this.databaseService = databaseService;
        this.prisma = prisma;
    }
    async uploadReferral(user, file, metadata) {
        if (user.role !== "patient") {
            await this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "referral_upload_denied_role",
                targetType: "referral_document",
                targetId: "new",
            });
            throw new common_1.ForbiddenException("Only patients can upload referral documents");
        }
        if (!file) {
            throw new common_1.BadRequestException("Referral file is required");
        }
        if (file.mimetype !== "application/pdf") {
            throw new common_1.BadRequestException("Only PDF referrals are supported");
        }
        if (file.size > MAX_REFERRAL_SIZE_BYTES) {
            throw new common_1.BadRequestException("Referral PDF exceeds 8MB size limit");
        }
        if (metadata.referralDate) {
            const referralDate = new Date(metadata.referralDate);
            if (Number.isNaN(referralDate.getTime())) {
                throw new common_1.BadRequestException("Invalid referral date");
            }
        }
        const documentId = `ref_${`${this.referralCounter++}`.padStart(6, "0")}`;
        const uploadedAt = new Date().toISOString();
        const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "referral_uploaded",
            targetType: "referral_document",
            targetId: documentId,
            metadata: {
                fileName: file.originalname,
                fileSize: file.size,
            },
        });
        const referral = {
            documentId,
            status: "received",
            patientId: user.sub,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            sourceType: metadata.sourceType,
            referralDate: metadata.referralDate,
            notes: metadata.notes,
            uploadedAt,
            dueAt,
            overdue: false,
        };
        await this.saveReferral(referral);
        return this.toReferralDocumentDto(referral);
    }
    async listReferralQueue(user, query) {
        this.assertOpsRole(user);
        const now = Date.now();
        const all = (await this.listReferrals()).map((ref) => ({
            ...ref,
            overdue: this.isOverdue(ref, now),
        }));
        return all
            .filter((item) => {
            if (query.status && item.status !== query.status)
                return false;
            if (query.owner === "unreviewed" && item.assignedOwnerUserId)
                return false;
            if (query.owner === "mine" && item.assignedOwnerUserId !== user.sub)
                return false;
            if (query.overdue === "overdue" && !item.overdue)
                return false;
            if (query.overdue === "on-track" && item.overdue)
                return false;
            return true;
        })
            .sort((a, b) => toMillis(b.uploadedAt) - toMillis(a.uploadedAt));
    }
    async approveReferral(user, referralId, reason, notes) {
        this.assertOpsRole(user);
        const referral = await this.getReferralById(referralId);
        this.assertTransitionable(referral, "approved");
        await this.applyReviewDecision(referral, user, "approved", reason, notes, "referral_approved");
        return { ...referral };
    }
    async rejectReferral(user, referralId, reason, notes) {
        this.assertOpsRole(user);
        const referral = await this.getReferralById(referralId);
        this.assertTransitionable(referral, "rejected");
        await this.applyReviewDecision(referral, user, "rejected", reason, notes, "referral_rejected");
        return { ...referral };
    }
    async requestReferralInfo(user, referralId, reason, notes) {
        this.assertOpsRole(user);
        const referral = await this.getReferralById(referralId);
        this.assertTransitionable(referral, "info_requested");
        await this.applyReviewDecision(referral, user, "info_requested", reason, notes, "referral_info_requested");
        return { ...referral };
    }
    assertOpsRole(user) {
        if (!OPS_ROLES.has(user.role)) {
            throw new common_1.ForbiddenException("Only admin and practice_manager can review referrals");
        }
    }
    async getReferralById(referralId) {
        const referrals = await this.listReferrals();
        const referral = referrals.find((item) => item.documentId === referralId);
        if (!referral) {
            throw new common_1.NotFoundException("Referral not found");
        }
        return referral;
    }
    assertTransitionable(referral, target) {
        if (referral.status === target) {
            throw new common_1.ConflictException(`Referral already ${target}`);
        }
        if (referral.status === "approved" || referral.status === "rejected") {
            throw new common_1.ConflictException(`Referral is already finalized as ${referral.status}`);
        }
    }
    async applyReviewDecision(referral, user, nextStatus, reason, notes, action) {
        referral.status = nextStatus;
        referral.assignedOwnerUserId = user.sub;
        referral.reviewedBy = user.sub;
        referral.reviewedAt = new Date().toISOString();
        referral.reviewReason = reason?.trim() || undefined;
        referral.reviewNotes = notes?.trim() || undefined;
        referral.overdue = this.isOverdue(referral, Date.now());
        await this.saveReferral(referral);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action,
            targetType: "referral_document",
            targetId: referral.documentId,
            metadata: {
                status: referral.status,
                reason: referral.reviewReason ?? null,
                assignedOwnerUserId: referral.assignedOwnerUserId ?? null,
                dueAt: referral.dueAt,
                overdue: referral.overdue,
            },
        });
    }
    isOverdue(referral, nowMs) {
        if (referral.status === "approved" || referral.status === "rejected")
            return false;
        const dueAtMs = new Date(referral.dueAt).getTime();
        if (Number.isNaN(dueAtMs))
            return false;
        return nowMs > dueAtMs;
    }
    async listReferrals() {
        if (!this.databaseService.isEnabled()) {
            return [...this.referrals];
        }
        const rows = await this.prisma.referral_documents.findMany({
            orderBy: { uploaded_at: "desc" },
        });
        return rows.map((row) => ({
            documentId: row.document_id,
            patientId: row.patient_id,
            status: row.status,
            fileName: row.file_name,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            sourceType: row.source_type ?? undefined,
            referralDate: row.referral_date ? row.referral_date.toISOString().slice(0, 10) : undefined,
            notes: row.notes ?? undefined,
            uploadedAt: row.uploaded_at.toISOString(),
            dueAt: row.due_at.toISOString(),
            overdue: this.isOverdue({ dueAt: row.due_at.toISOString(), status: row.status }, Date.now()),
            assignedOwnerUserId: row.assigned_owner_user_id ?? undefined,
            reviewedBy: row.reviewed_by ?? undefined,
            reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : undefined,
            reviewReason: row.review_reason ?? undefined,
            reviewNotes: row.review_notes ?? undefined,
        }));
    }
    async saveReferral(referral) {
        if (!this.databaseService.isEnabled()) {
            const idx = this.referrals.findIndex((item) => item.documentId === referral.documentId);
            if (idx >= 0)
                this.referrals[idx] = referral;
            else
                this.referrals.unshift(referral);
            return;
        }
        await this.prisma.referral_documents.upsert({
            where: { document_id: referral.documentId },
            create: {
                document_id: referral.documentId,
                patient_id: referral.patientId,
                status: referral.status,
                file_name: referral.fileName,
                file_size: referral.fileSize,
                mime_type: referral.mimeType,
                source_type: referral.sourceType ?? null,
                referral_date: referral.referralDate ? new Date(referral.referralDate) : null,
                notes: referral.notes ?? null,
                uploaded_at: new Date(referral.uploadedAt),
                due_at: new Date(referral.dueAt),
                assigned_owner_user_id: referral.assignedOwnerUserId ?? null,
                reviewed_by: referral.reviewedBy ?? null,
                reviewed_at: referral.reviewedAt ? new Date(referral.reviewedAt) : null,
                review_reason: referral.reviewReason ?? null,
                review_notes: referral.reviewNotes ?? null,
            },
            update: {
                status: referral.status,
                due_at: new Date(referral.dueAt),
                assigned_owner_user_id: referral.assignedOwnerUserId ?? null,
                reviewed_by: referral.reviewedBy ?? null,
                reviewed_at: referral.reviewedAt ? new Date(referral.reviewedAt) : null,
                review_reason: referral.reviewReason ?? null,
                review_notes: referral.reviewNotes ?? null,
            },
        });
    }
    toReferralDocumentDto(referral) {
        return {
            documentId: referral.documentId,
            status: referral.status,
            fileName: referral.fileName,
            fileSize: referral.fileSize,
            mimeType: referral.mimeType,
            uploadedAt: referral.uploadedAt,
        };
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        database_service_1.DatabaseService,
        prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map