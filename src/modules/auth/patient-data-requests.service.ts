import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { CreatePatientDataRequestDto } from "./dto/create-patient-data-request.dto";
import type { PatientDataRequestActionDto } from "./dto/patient-data-request-action.dto";
import type { PatientDataRequestDto } from "./dto/patient-data-request.dto";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";

type PatientDataRequestStatus = PatientDataRequestDto["status"];
type PatientDataRequestRecord = PatientDataRequestDto;
type PatientDataRequestAction = PatientDataRequestActionDto["action"];

@Injectable()
export class PatientDataRequestsService {
  private readonly requests = new Map<string, PatientDataRequestRecord>();
  private counter = 1;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createForPatient(user: AuthJwtPayload, dto: CreatePatientDataRequestDto): Promise<PatientDataRequestDto> {
    this.assertPatient(user);
    const now = new Date().toISOString();
    const request: PatientDataRequestRecord = {
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

  async listForPatient(user: AuthJwtPayload): Promise<PatientDataRequestDto[]> {
    this.assertPatient(user);
    const rows = await this.list();
    return rows.filter((item) => item.patientId === user.sub);
  }

  async getForPatient(user: AuthJwtPayload, requestId: string): Promise<PatientDataRequestDto> {
    this.assertPatient(user);
    const request = await this.getById(requestId);
    if (request.patientId !== user.sub) {
      throw new ForbiddenException("You cannot access this request");
    }
    return request;
  }

  async listForOps(user: AuthJwtPayload): Promise<PatientDataRequestDto[]> {
    this.assertOps(user);
    return this.list();
  }

  async applyAction(user: AuthJwtPayload, requestId: string, dto: PatientDataRequestActionDto): Promise<PatientDataRequestDto> {
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

  private reduceAction(
    request: PatientDataRequestRecord,
    actorUserId: string,
    dto: PatientDataRequestActionDto,
    now: string,
  ): PatientDataRequestRecord {
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

  private assertTransitionable(current: PatientDataRequestStatus, action: PatientDataRequestAction): void {
    if (["fulfilled", "rejected", "cancelled"].includes(current)) {
      throw new ConflictException(`Request already finalized as ${current}`);
    }
    if (current === "submitted" && !["assign", "cancel"].includes(action)) {
      throw new ConflictException("Submitted requests must be assigned before review actions");
    }
    if (current === "triage_review" && !["start_review", "fulfill", "reject", "cancel"].includes(action)) {
      throw new ConflictException("Triage review request only supports start_review/fulfill/reject/cancel");
    }
    if (current === "in_progress" && !["fulfill", "reject", "cancel"].includes(action)) {
      throw new ConflictException("In-progress request only supports fulfill/reject/cancel");
    }
  }

  private assertPatient(user: AuthJwtPayload): void {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can manage own data requests");
    }
  }

  private assertOps(user: AuthJwtPayload): void {
    if (user.role !== "admin" && user.role !== "practice_manager") {
      throw new ForbiddenException("Only admin/practice_manager can triage patient data requests");
    }
  }

  private async getById(requestId: string): Promise<PatientDataRequestRecord> {
    if (!this.databaseService.isEnabled()) {
      const found = this.requests.get(requestId);
      if (!found) throw new NotFoundException("Patient data request not found");
      return found;
    }
    const row = await this.prisma.patient_data_requests.findUnique({
      where: { request_id: requestId },
    });
    if (!row) throw new NotFoundException("Patient data request not found");
    return this.mapPrismaRow(row);
  }

  private async list(): Promise<PatientDataRequestRecord[]> {
    if (!this.databaseService.isEnabled()) {
      return [...this.requests.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    const rows = await this.prisma.patient_data_requests.findMany({
      orderBy: { updated_at: "desc" },
    });
    return rows.map((row) => this.mapPrismaRow(row));
  }

  private async save(request: PatientDataRequestRecord): Promise<void> {
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

  private mapPrismaRow(row: {
    request_id: string;
    patient_id: string;
    request_type: string;
    status: string;
    details: string;
    requested_correction: string | null;
    triage_owner_user_id: string | null;
    resolution_notes: string | null;
    sla_due_at: Date;
    triaged_at: Date | null;
    resolved_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): PatientDataRequestRecord {
    return {
      requestId: row.request_id,
      patientId: row.patient_id,
      requestType: row.request_type as PatientDataRequestRecord["requestType"],
      status: row.status as PatientDataRequestRecord["status"],
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
}
