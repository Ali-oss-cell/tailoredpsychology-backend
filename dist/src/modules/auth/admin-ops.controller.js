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
exports.AdminOpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("../analytics/analytics.service");
const appointments_service_1 = require("../appointments/appointments.service");
const audit_service_1 = require("../audit/audit.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const admin_ops_dto_1 = require("./dto/admin-ops.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AdminOpsController = class AdminOpsController {
    appointmentsService;
    analyticsService;
    auditService;
    databaseService;
    prisma;
    constructor(appointmentsService, analyticsService, auditService, databaseService, prisma) {
        this.appointmentsService = appointmentsService;
        this.analyticsService = analyticsService;
        this.auditService = auditService;
        this.databaseService = databaseService;
        this.prisma = prisma;
    }
    async listAppointments(user) {
        this.assertAdmin(user);
        if (!this.databaseService.isEnabled()) {
            const sessions = await this.appointmentsService.getPatientSessions({ ...user, role: "admin" }, "user_patient_001");
            return sessions.map((s) => ({
                appointmentId: s.sessionId,
                patientId: "user_patient_001",
                patientName: "Patient Demo",
                clinicianId: s.clinicianId,
                clinicianName: s.clinicianId,
                scheduledStartAt: s.scheduledStartAt,
                status: s.status,
            }));
        }
        const appts = await this.prisma.appointments.findMany({
            orderBy: { scheduled_start_at: "desc" },
            take: 100,
        });
        const userIds = [...new Set([...appts.map((a) => a.patient_id), ...appts.map((a) => a.clinician_id)])];
        const usersRows = userIds.length > 0
            ? await this.prisma.users.findMany({
                where: { user_id: { in: userIds } },
                select: { user_id: true, display_name: true },
            })
            : [];
        const nameById = Object.fromEntries(usersRows.map((u) => [u.user_id, u.display_name]));
        return appts.map((a) => ({
            appointmentId: a.appointment_id,
            patientId: a.patient_id,
            patientName: nameById[a.patient_id] ?? a.patient_id,
            clinicianId: a.clinician_id,
            clinicianName: nameById[a.clinician_id] ?? a.clinician_id,
            scheduledStartAt: a.scheduled_start_at.toISOString(),
            status: a.status,
        }));
    }
    async listPatients(user) {
        this.assertAdmin(user);
        if (!this.databaseService.isEnabled()) {
            return [
                {
                    patientId: "user_patient_001",
                    displayName: "Patient Demo",
                    email: "patient@clink.test",
                    intakeState: "committed",
                    retentionStatus: "active",
                    legalHoldActive: false,
                },
            ];
        }
        const patients = await this.prisma.users.findMany({
            where: { role: "patient" },
            orderBy: { created_at: "desc" },
            take: 200,
        });
        const patientIds = patients.map((p) => p.user_id);
        const drafts = patientIds.length > 0
            ? await this.prisma.intake_drafts.findMany({
                where: { patient_id: { in: patientIds } },
            })
            : [];
        const draftByPatient = Object.fromEntries(drafts.map((d) => [d.patient_id, d]));
        return patients.map((row) => {
            const d = draftByPatient[row.user_id];
            return {
                patientId: row.user_id,
                displayName: row.display_name,
                email: row.email,
                intakeState: d?.committed_at ? "committed" : d?.draft_version ? "draft_in_progress" : "none",
                retentionStatus: resolveRetentionStatus({
                    deleted_at: row.deleted_at,
                    legal_hold_active: row.legal_hold_active,
                    retention_until: row.retention_until,
                }),
                legalHoldActive: row.legal_hold_active,
            };
        });
    }
    async listStaff(user) {
        this.assertAdmin(user);
        if (!this.databaseService.isEnabled()) {
            return [
                {
                    userId: "user_psychologist_001",
                    displayName: "Psychologist Demo",
                    email: "psychologist@clink.test",
                    role: "psychologist",
                    status: "active",
                },
            ];
        }
        const rows = await this.prisma.users.findMany({
            where: { role: { in: ["psychologist", "practice_manager", "admin"] } },
            orderBy: { created_at: "desc" },
            include: { psychologist_profiles: true },
        });
        return rows.map((row) => ({
            userId: row.user_id,
            displayName: row.display_name,
            email: row.email,
            role: row.role,
            status: row.role === "psychologist" ? row.psychologist_profiles?.status ?? "active" : "active",
        }));
    }
    async listSettings(user) {
        this.assertAdmin(user);
        const dbHealth = await this.databaseService.getHealthStatus().catch(() => ({
            configured: false,
            connected: false,
            migrationsTablePresent: false,
        }));
        return [
            { key: "authPolicy", value: "strict", editable: true },
            { key: "retentionPolicy", value: "7_year_default", editable: true },
            { key: "databaseConnected", value: dbHealth.connected ? "yes" : "no", editable: false },
            { key: "migrationsReady", value: dbHealth.migrationsTablePresent ? "yes" : "no", editable: false },
        ];
    }
    async listResources(user) {
        this.assertAdmin(user);
        if (!this.databaseService.isEnabled()) {
            return [
                {
                    resourceId: "ref_000001",
                    title: "Referral: referral.pdf",
                    state: "received",
                    owner: "unassigned",
                    updatedAt: new Date().toISOString(),
                },
            ];
        }
        const rows = await this.prisma.referral_documents.findMany({
            orderBy: { uploaded_at: "desc" },
            take: 100,
        });
        return rows.map((row) => ({
            resourceId: row.document_id,
            title: `Referral: ${row.file_name}`,
            state: row.status,
            owner: row.assigned_owner_user_id ?? "unassigned",
            updatedAt: row.uploaded_at.toISOString(),
        }));
    }
    async deletionQueue(user, state) {
        this.assertAdmin(user);
        const effectiveState = state ?? "all";
        if (!this.databaseService.isEnabled()) {
            return [
                {
                    patientId: "user_patient_001",
                    deletedAt: null,
                    retentionUntil: null,
                    legalHoldActive: false,
                    purgeEligible: false,
                },
            ];
        }
        const rows = await this.prisma.users.findMany({
            where: { role: "patient" },
            orderBy: { created_at: "desc" },
            select: {
                user_id: true,
                deleted_at: true,
                retention_until: true,
                legal_hold_active: true,
            },
        });
        const now = Date.now();
        return rows
            .map((row) => {
            const retentionMs = row.retention_until ? row.retention_until.getTime() : Number.POSITIVE_INFINITY;
            const purgeEligible = Boolean(row.deleted_at) && !row.legal_hold_active && retentionMs <= now;
            return {
                patientId: row.user_id,
                deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
                retentionUntil: row.retention_until ? row.retention_until.toISOString() : null,
                legalHoldActive: row.legal_hold_active,
                purgeEligible,
            };
        })
            .filter((row) => {
            if (effectiveState === "deleted")
                return Boolean(row.deletedAt);
            if (effectiveState === "legal_hold")
                return row.legalHoldActive;
            if (effectiveState === "purge_eligible")
                return row.purgeEligible;
            return true;
        });
    }
    async billingSnapshot(user) {
        this.assertAdmin(user);
        const events = await this.analyticsService.listEvents();
        const bookings = events.filter((e) => e.name === "booking_confirmed").length;
        return {
            revenueToday: bookings * 180,
            revenueWeek: bookings * 180 * 5,
            revenueMonth: bookings * 180 * 20,
            failedPayments: 0,
            pendingClaims: Math.max(0, Math.floor(bookings / 4)),
        };
    }
    async analyticsSummary(user) {
        this.assertAdmin(user);
        const events = await this.analyticsService.listEvents();
        const audits = await this.auditService.listEvents({});
        return {
            totalAnalyticsEvents: events.length,
            totalAuditEvents: audits.length,
            bookingRequested: events.filter((e) => e.name === "booking_requested").length,
            joinFailures: events.filter((e) => e.name === "join_failed").length,
        };
    }
    assertAdmin(user) {
        if (user.role !== "admin") {
            throw new common_1.ForbiddenException("Only admin can access admin ops governance endpoints");
        }
    }
};
exports.AdminOpsController = AdminOpsController;
__decorate([
    (0, common_1.Get)("appointments"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin appointment oversight snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminAppointmentItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "listAppointments", null);
__decorate([
    (0, common_1.Get)("patients"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin patient oversight snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminPatientItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "listPatients", null);
__decorate([
    (0, common_1.Get)("staff"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin staff oversight snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminStaffItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Get)("settings"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin settings domains snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminSettingsDomainDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "listSettings", null);
__decorate([
    (0, common_1.Get)("resources"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin resources governance snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminResourceItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "listResources", null);
__decorate([
    (0, common_1.Get)("deletion-queue"),
    (0, swagger_1.ApiOperation)({ summary: "Get retention/deletion queue for admin review" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_ops_dto_1.AdminDeletionQueueItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("state")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "deletionQueue", null);
__decorate([
    (0, common_1.Get)("billing"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin billing aggregate snapshot" }),
    (0, swagger_1.ApiOkResponse)({ type: admin_ops_dto_1.AdminBillingSummaryDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "billingSnapshot", null);
__decorate([
    (0, common_1.Get)("analytics-summary"),
    (0, swagger_1.ApiOperation)({ summary: "Get admin analytics summary aggregates" }),
    (0, swagger_1.ApiOkResponse)({ type: admin_ops_dto_1.AdminAnalyticsSummaryDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpsController.prototype, "analyticsSummary", null);
exports.AdminOpsController = AdminOpsController = __decorate([
    (0, swagger_1.ApiTags)("admin-ops"),
    (0, common_1.Controller)("admin/ops"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService,
        analytics_service_1.AnalyticsService,
        audit_service_1.AuditService,
        database_service_1.DatabaseService,
        prisma_service_1.PrismaService])
], AdminOpsController);
function resolveRetentionStatus(row) {
    if (row.legal_hold_active)
        return "legal_hold";
    if (!row.deleted_at)
        return "active";
    if (row.retention_until && row.retention_until.getTime() <= Date.now())
        return "purge_pending";
    return "deleted";
}
//# sourceMappingURL=admin-ops.controller.js.map