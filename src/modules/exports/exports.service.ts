import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { AppointmentsService } from "../appointments/appointments.service";
import { UsersService } from "../users/users.service";
import { CreateDataExportResponseDto } from "./dto/create-data-export-response.dto";
import { DataExportStatusDto } from "./dto/data-export-status.dto";

type ExportJob = {
  jobId: string;
  patientId: string;
  requestedByUserId: string;
  requesterRole: AuthJwtPayload["role"];
  status: "queued" | "processing" | "ready" | "failed";
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  fileName?: string;
  contentType?: string;
  buffer?: Buffer;
};

@Injectable()
export class ExportsService {
  private jobCounter = 1;
  private readonly jobs = new Map<string, ExportJob>();

  constructor(
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async createPatientDataExport(user: AuthJwtPayload): Promise<CreateDataExportResponseDto> {
    this.assertPatientOwner(user);
    await this.assertExportAllowedForPatient(user.sub);
    const jobId = `exp_${`${this.jobCounter++}`.padStart(6, "0")}`;
    const requestedAt = new Date().toISOString();
    const job: ExportJob = {
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
      if (!current) return;
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

  async getPatientDataExportStatus(user: AuthJwtPayload, jobId: string): Promise<DataExportStatusDto> {
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

  async getPatientDataExportDownload(
    user: AuthJwtPayload,
    jobId: string,
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    const job = this.getPatientOwnedJob(user, jobId);
    await this.assertExportAllowedForPatient(user.sub);
    if (job.status !== "ready" || !job.buffer || !job.fileName || !job.contentType) {
      throw new ConflictException("Export is not ready for download yet");
    }
    if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
      throw new ConflictException("Export download link expired; request a new export");
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

  async createPsychologistPatientDataExport(
    user: AuthJwtPayload,
    psychologistId: string,
    patientId: string,
  ): Promise<CreateDataExportResponseDto> {
    this.assertPsychologistRequestor(user, psychologistId);
    await this.assertPsychologistAssignedToPatient(user, psychologistId, patientId);
    await this.assertExportAllowedForPatient(patientId);

    const jobId = `exp_${`${this.jobCounter++}`.padStart(6, "0")}`;
    const requestedAt = new Date().toISOString();
    const job: ExportJob = {
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
      if (!current) return;
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

  async getPsychologistPatientDataExportStatus(
    user: AuthJwtPayload,
    psychologistId: string,
    patientId: string,
    jobId: string,
  ): Promise<DataExportStatusDto> {
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

  async getPsychologistPatientDataExportDownload(
    user: AuthJwtPayload,
    psychologistId: string,
    patientId: string,
    jobId: string,
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    this.assertPsychologistRequestor(user, psychologistId);
    const job = this.getPsychologistOwnedJob(user, patientId, jobId);
    await this.assertPsychologistAssignedToPatient(user, psychologistId, patientId);
    await this.assertExportAllowedForPatient(patientId);
    if (job.status !== "ready" || !job.buffer || !job.fileName || !job.contentType) {
      throw new ConflictException("Export is not ready for download yet");
    }
    if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
      throw new ConflictException("Export download link expired; request a new export");
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

  private async assertExportAllowedForPatient(patientId: string): Promise<void> {
    const retention = await this.usersService.getPatientRetentionState(patientId);
    if (retention.legalHoldActive) {
      throw new ConflictException("Data export is blocked while legal hold is active");
    }
  }

  private getPatientOwnedJob(user: AuthJwtPayload, jobId: string): ExportJob {
    this.assertPatientOwner(user);
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException("Export job not found");
    }
    if (job.patientId !== user.sub) {
      throw new ForbiddenException("You can only access your own export jobs");
    }
    return job;
  }

  private getPsychologistOwnedJob(user: AuthJwtPayload, patientId: string, jobId: string): ExportJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new NotFoundException("Export job not found");
    if (job.patientId !== patientId) throw new ForbiddenException("Export job does not match patient");
    if (job.requestedByUserId !== user.sub || job.requesterRole !== "psychologist") {
      throw new ForbiddenException("You can only access psychologist export jobs you created");
    }
    return job;
  }

  private assertPatientOwner(user: AuthJwtPayload): void {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can request and download personal exports");
    }
  }

  private assertPsychologistRequestor(user: AuthJwtPayload, psychologistId: string): void {
    if (user.role !== "psychologist" || user.sub !== psychologistId) {
      throw new ForbiddenException("Only the authenticated psychologist can request patient exports");
    }
  }

  private async assertPsychologistAssignedToPatient(
    user: AuthJwtPayload,
    psychologistId: string,
    patientId: string,
  ): Promise<void> {
    const sessions = await this.appointmentsService.getPsychologistSessions(user, psychologistId);
    const assigned = sessions.some((session) => session.patientId === patientId);
    if (!assigned) {
      throw new ForbiddenException("You are not assigned to this patient");
    }
  }

  private buildExportContent(patientId: string, generatedAt: string): string {
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
}
