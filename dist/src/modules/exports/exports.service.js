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
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const appointments_service_1 = require("../appointments/appointments.service");
const users_service_1 = require("../users/users.service");
let ExportsService = class ExportsService {
    auditService;
    usersService;
    appointmentsService;
    jobCounter = 1;
    jobs = new Map();
    constructor(auditService, usersService, appointmentsService) {
        this.auditService = auditService;
        this.usersService = usersService;
        this.appointmentsService = appointmentsService;
    }
    async createPatientDataExport(user) {
        this.assertPatientOwner(user);
        await this.assertExportAllowedForPatient(user.sub);
        const jobId = `exp_${`${this.jobCounter++}`.padStart(6, "0")}`;
        const requestedAt = new Date().toISOString();
        const job = {
            jobId,
            patientId: user.sub,
            requestedByUserId: user.sub,
            requesterRole: user.role,
            status: "queued",
            requestedAt,
        };
        this.jobs.set(jobId, job);
        void this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_data_export_requested",
            targetType: "system",
            targetId: jobId,
        });
        setTimeout(() => {
            const current = this.jobs.get(jobId);
            if (!current)
                return;
            current.status = "processing";
            const completedAt = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            const content = this.buildExportContent(user.sub, completedAt);
            current.status = "ready";
            current.completedAt = completedAt;
            current.expiresAt = expiresAt;
            current.fileName = `clink-patient-data-export-${jobId}.pdf`;
            current.contentType = "application/pdf";
            current.buffer = Buffer.from(content, "utf8");
            void this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "patient_data_export_generated",
                targetType: "system",
                targetId: jobId,
            });
        }, 250);
        return { jobId, status: "queued" };
    }
    async getPatientDataExportStatus(user, jobId) {
        const job = this.getPatientOwnedJob(user, jobId);
        await this.assertExportAllowedForPatient(user.sub);
        return {
            jobId: job.jobId,
            status: job.status,
            requestedAt: job.requestedAt,
            completedAt: job.completedAt,
            expiresAt: job.expiresAt,
        };
    }
    async getPatientDataExportDownload(user, jobId) {
        const job = this.getPatientOwnedJob(user, jobId);
        await this.assertExportAllowedForPatient(user.sub);
        if (job.status !== "ready" || !job.buffer || !job.fileName || !job.contentType) {
            throw new common_1.ConflictException("Export is not ready for download yet");
        }
        if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
            throw new common_1.ConflictException("Export download link expired; request a new export");
        }
        void this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "patient_data_export_downloaded",
            targetType: "system",
            targetId: jobId,
        });
        return {
            buffer: job.buffer,
            fileName: job.fileName,
            contentType: job.contentType,
        };
    }
    async createPsychologistPatientDataExport(user, psychologistId, patientId) {
        this.assertPsychologistRequestor(user, psychologistId);
        await this.assertPsychologistAssignedToPatient(user, psychologistId, patientId);
        await this.assertExportAllowedForPatient(patientId);
        const jobId = `exp_${`${this.jobCounter++}`.padStart(6, "0")}`;
        const requestedAt = new Date().toISOString();
        const job = {
            jobId,
            patientId,
            requestedByUserId: user.sub,
            requesterRole: user.role,
            status: "queued",
            requestedAt,
        };
        this.jobs.set(jobId, job);
        void this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "psychologist_patient_data_export_requested",
            targetType: "system",
            targetId: jobId,
            metadata: { patientId },
        });
        setTimeout(() => {
            const current = this.jobs.get(jobId);
            if (!current)
                return;
            current.status = "processing";
            const completedAt = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            const content = this.buildExportContent(patientId, completedAt);
            current.status = "ready";
            current.completedAt = completedAt;
            current.expiresAt = expiresAt;
            current.fileName = `clink-patient-data-export-${jobId}.pdf`;
            current.contentType = "application/pdf";
            current.buffer = Buffer.from(content, "utf8");
            void this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "psychologist_patient_data_export_generated",
                targetType: "system",
                targetId: jobId,
                metadata: { patientId },
            });
        }, 250);
        return { jobId, status: "queued" };
    }
    async getPsychologistPatientDataExportStatus(user, psychologistId, patientId, jobId) {
        this.assertPsychologistRequestor(user, psychologistId);
        const job = this.getPsychologistOwnedJob(user, patientId, jobId);
        await this.assertPsychologistAssignedToPatient(user, psychologistId, patientId);
        await this.assertExportAllowedForPatient(patientId);
        return {
            jobId: job.jobId,
            status: job.status,
            requestedAt: job.requestedAt,
            completedAt: job.completedAt,
            expiresAt: job.expiresAt,
        };
    }
    async getPsychologistPatientDataExportDownload(user, psychologistId, patientId, jobId) {
        this.assertPsychologistRequestor(user, psychologistId);
        const job = this.getPsychologistOwnedJob(user, patientId, jobId);
        await this.assertPsychologistAssignedToPatient(user, psychologistId, patientId);
        await this.assertExportAllowedForPatient(patientId);
        if (job.status !== "ready" || !job.buffer || !job.fileName || !job.contentType) {
            throw new common_1.ConflictException("Export is not ready for download yet");
        }
        if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
            throw new common_1.ConflictException("Export download link expired; request a new export");
        }
        void this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "psychologist_patient_data_export_downloaded",
            targetType: "system",
            targetId: jobId,
            metadata: { patientId },
        });
        return {
            buffer: job.buffer,
            fileName: job.fileName,
            contentType: job.contentType,
        };
    }
    async assertExportAllowedForPatient(patientId) {
        const retention = await this.usersService.getPatientRetentionState(patientId);
        if (retention.legalHoldActive) {
            throw new common_1.ConflictException("Data export is blocked while legal hold is active");
        }
    }
    getPatientOwnedJob(user, jobId) {
        this.assertPatientOwner(user);
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new common_1.NotFoundException("Export job not found");
        }
        if (job.patientId !== user.sub) {
            throw new common_1.ForbiddenException("You can only access your own export jobs");
        }
        return job;
    }
    getPsychologistOwnedJob(user, patientId, jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new common_1.NotFoundException("Export job not found");
        if (job.patientId !== patientId)
            throw new common_1.ForbiddenException("Export job does not match patient");
        if (job.requestedByUserId !== user.sub || job.requesterRole !== "psychologist") {
            throw new common_1.ForbiddenException("You can only access psychologist export jobs you created");
        }
        return job;
    }
    assertPatientOwner(user) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can request and download personal exports");
        }
    }
    assertPsychologistRequestor(user, psychologistId) {
        if (user.role !== "psychologist" || user.sub !== psychologistId) {
            throw new common_1.ForbiddenException("Only the authenticated psychologist can request patient exports");
        }
    }
    async assertPsychologistAssignedToPatient(user, psychologistId, patientId) {
        const sessions = await this.appointmentsService.getPsychologistSessions(user, psychologistId);
        const assigned = sessions.some((session) => session.patientId === patientId);
        if (!assigned) {
            throw new common_1.ForbiddenException("You are not assigned to this patient");
        }
    }
    buildExportContent(patientId, generatedAt) {
        return `%PDF-1.4
% Tailored Psychology Patient Data Export
Patient ID: ${patientId}
Generated At: ${generatedAt}

Sections:
- Identity/Profile summary
- Intake summary
- Booking and appointment timeline
- Mood check-ins summary
- Notifications summary
- Referral metadata
- Consent summary

This export is generated for patient access and correction workflows.
%%EOF`;
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        users_service_1.UsersService,
        appointments_service_1.AppointmentsService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map