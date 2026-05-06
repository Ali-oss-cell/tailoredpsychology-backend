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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPatientRetentionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const break_glass_access_request_dto_1 = require("./dto/break-glass-access-request.dto");
const break_glass_access_status_dto_1 = require("./dto/break-glass-access-status.dto");
const patient_retention_reason_dto_1 = require("./dto/patient-retention-reason.dto");
const patient_retention_status_dto_1 = require("./dto/patient-retention-status.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AdminPatientRetentionController = class AdminPatientRetentionController {
    usersService;
    auditService;
    breakGlassAccess = new Map();
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async softDelete(user, patientId, dto) {
        this.assertAdmin(user);
        const retention = await this.usersService.softDeletePatient({
            patientId,
            actorUserId: user.sub,
            reason: dto.reason,
        });
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_soft_deleted",
            targetType: "auth",
            targetId: patientId,
            metadata: { reason: dto.reason },
        });
        return toRetentionDto(patientId, retention);
    }
    async restore(user, patientId) {
        this.assertAdmin(user);
        const retention = await this.usersService.restorePatient(patientId);
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_restored",
            targetType: "auth",
            targetId: patientId,
            metadata: {},
        });
        return toRetentionDto(patientId, retention);
    }
    async setLegalHold(user, patientId, dto) {
        this.assertAdmin(user);
        const retention = await this.usersService.setPatientLegalHold({
            patientId,
            actorUserId: user.sub,
            reason: dto.reason,
        });
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_legal_hold_enabled",
            targetType: "auth",
            targetId: patientId,
            metadata: { reason: dto.reason },
        });
        return toRetentionDto(patientId, retention);
    }
    async removeLegalHold(user, patientId) {
        this.assertAdmin(user);
        const retention = await this.usersService.clearPatientLegalHold(patientId);
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_legal_hold_removed",
            targetType: "auth",
            targetId: patientId,
            metadata: {},
        });
        return toRetentionDto(patientId, retention);
    }
    async getRetentionStatus(user, patientId) {
        this.assertAdmin(user);
        const retention = await this.usersService.getPatientRetentionState(patientId);
        return toRetentionDto(patientId, retention);
    }
    async listPurgeEligible(user, at) {
        this.assertAdmin(user);
        const nowIso = at && !Number.isNaN(new Date(at).getTime()) ? at : new Date().toISOString();
        const rows = await this.usersService.listPurgeEligiblePatients(nowIso);
        return rows.map((row) => toRetentionDto(row.patientId, row.retention));
    }
    async purge(user, patientId) {
        this.assertAdmin(user);
        const retention = await this.usersService.getPatientRetentionState(patientId);
        if (!retention.deletedAt || !retention.retentionUntil) {
            throw new common_1.BadRequestException("Patient is not soft-deleted with a retention window");
        }
        if (retention.legalHoldActive) {
            throw new common_1.BadRequestException("Purge blocked while legal hold is active");
        }
        if (new Date(retention.retentionUntil).getTime() > Date.now()) {
            throw new common_1.BadRequestException("Purge blocked before retention date");
        }
        const flag = process.env.W11H_ENABLE_PURGE_EXECUTION;
        if (flag !== "true") {
            this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "patient_purge_denied_policy",
                targetType: "auth",
                targetId: patientId,
                metadata: { reason: "feature_flag_disabled" },
            });
            throw new common_1.BadRequestException("Purge execution is disabled by feature flag");
        }
        const updated = await this.usersService.markPatientPurged(patientId);
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_purged",
            targetType: "auth",
            targetId: patientId,
            metadata: {},
        });
        return toRetentionDto(patientId, updated);
    }
    async grantBreakGlassAccess(user, patientId, dto) {
        this.assertAdmin(user);
        const retention = await this.usersService.getPatientRetentionState(patientId);
        if (!retention.legalHoldActive) {
            throw new common_1.BadRequestException("Break-glass access is only available while legal hold is active");
        }
        const grantedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        this.breakGlassAccess.set(patientId, {
            patientId,
            grantedByUserId: user.sub,
            justification: dto.justification.trim(),
            grantedAt,
            expiresAt,
        });
        this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_break_glass_granted",
            targetType: "auth",
            targetId: patientId,
            metadata: { justification: dto.justification.trim(), expiresAt },
        });
        return {
            patientId,
            active: true,
            grantedByUserId: user.sub,
            justification: dto.justification.trim(),
            grantedAt,
            expiresAt,
        };
    }
    getBreakGlassStatus(user, patientId) {
        this.assertAdmin(user);
        const grant = this.breakGlassAccess.get(patientId);
        const active = Boolean(grant && new Date(grant.expiresAt).getTime() > Date.now());
        if (!active) {
            return {
                patientId,
                active: false,
                grantedByUserId: null,
                justification: null,
                grantedAt: null,
                expiresAt: null,
            };
        }
        const activeGrant = grant;
        return {
            patientId,
            active: true,
            grantedByUserId: activeGrant.grantedByUserId,
            justification: activeGrant.justification,
            grantedAt: activeGrant.grantedAt,
            expiresAt: activeGrant.expiresAt,
        };
    }
    assertAdmin(user) {
        if (user.role !== "admin") {
            throw new common_1.ForbiddenException("Only admin can manage patient deletion and retention controls");
        }
    }
};
exports.AdminPatientRetentionController = AdminPatientRetentionController;
__decorate([
    (0, common_1.Post)(":id/soft-delete"),
    (0, swagger_1.ApiOperation)({ summary: "Soft delete patient account and compute retention window" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, patient_retention_reason_dto_1.PatientRetentionReasonDto]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Post)(":id/restore"),
    (0, swagger_1.ApiOperation)({ summary: "Restore soft-deleted patient account" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(":id/legal-hold"),
    (0, swagger_1.ApiOperation)({ summary: "Enable legal hold on patient account" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, patient_retention_reason_dto_1.PatientRetentionReasonDto]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "setLegalHold", null);
__decorate([
    (0, common_1.Post)(":id/legal-hold/remove"),
    (0, swagger_1.ApiOperation)({ summary: "Remove legal hold from patient account" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "removeLegalHold", null);
__decorate([
    (0, common_1.Get)(":id/retention-status"),
    (0, swagger_1.ApiOperation)({ summary: "Get retention/deletion status for patient account" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "getRetentionStatus", null);
__decorate([
    (0, common_1.Get)("purge-eligible"),
    (0, swagger_1.ApiOperation)({ summary: "List patient accounts eligible for purge by policy" }),
    (0, swagger_1.ApiOkResponse)({ type: [patient_retention_status_dto_1.PatientRetentionStatusDto] }),
    (0, swagger_1.ApiQuery)({ name: "at", required: false, description: "ISO timestamp override for eligibility evaluation" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("at")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "listPurgeEligible", null);
__decorate([
    (0, common_1.Post)(":id/purge"),
    (0, swagger_1.ApiOperation)({ summary: "Feature-flagged purge execution marker (no physical deletion in Wave 11)" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_retention_status_dto_1.PatientRetentionStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "purge", null);
__decorate([
    (0, common_1.Post)(":id/break-glass-access"),
    (0, swagger_1.ApiOperation)({ summary: "Grant time-limited break-glass access with mandatory justification" }),
    (0, swagger_1.ApiOkResponse)({ type: break_glass_access_status_dto_1.BreakGlassAccessStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, break_glass_access_request_dto_1.BreakGlassAccessRequestDto]),
    __metadata("design:returntype", Promise)
], AdminPatientRetentionController.prototype, "grantBreakGlassAccess", null);
__decorate([
    (0, common_1.Get)(":id/break-glass-access"),
    (0, swagger_1.ApiOperation)({ summary: "Get break-glass access status for patient scope" }),
    (0, swagger_1.ApiOkResponse)({ type: break_glass_access_status_dto_1.BreakGlassAccessStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", break_glass_access_status_dto_1.BreakGlassAccessStatusDto)
], AdminPatientRetentionController.prototype, "getBreakGlassStatus", null);
exports.AdminPatientRetentionController = AdminPatientRetentionController = __decorate([
    (0, swagger_1.ApiTags)("admin-patient-retention"),
    (0, common_1.Controller)("admin/patients"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_service_1.AuditService])
], AdminPatientRetentionController);
function toRetentionDto(patientId, retention) {
    const purgeEligible = Boolean(retention.deletedAt) &&
        !retention.legalHoldActive &&
        Boolean(retention.retentionUntil) &&
        Boolean(retention.retentionUntil && new Date(retention.retentionUntil).getTime() <= Date.now()) &&
        !retention.purgedAt;
    return {
        patientId,
        deletedAt: retention.deletedAt,
        deletionReason: retention.deletionReason,
        deletedByUserId: retention.deletedByUserId,
        legalHoldActive: retention.legalHoldActive,
        legalHoldReason: retention.legalHoldReason,
        legalHoldSetByUserId: retention.legalHoldSetByUserId,
        legalHoldSetAt: retention.legalHoldSetAt,
        retentionUntil: retention.retentionUntil,
        lastInteractionAt: retention.lastInteractionAt,
        purgedAt: retention.purgedAt,
        purgeEligible,
    };
}
//# sourceMappingURL=admin-patient-retention.controller.js.map