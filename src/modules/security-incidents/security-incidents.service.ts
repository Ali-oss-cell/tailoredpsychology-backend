import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import type { CreateSecurityIncidentDto } from "./dto/create-security-incident.dto";
import type { SecurityIncidentDto } from "./dto/security-incident.dto";
import type { UpdateSecurityIncidentDto } from "./dto/update-security-incident.dto";

@Injectable()
export class SecurityIncidentsService {
  private counter = 1;
  private incidents = new Map<string, SecurityIncidentDto>();

  constructor(
    private readonly db: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(user: AuthJwtPayload, dto: CreateSecurityIncidentDto): Promise<SecurityIncidentDto> {
    this.assertAdmin(user);
    const now = new Date().toISOString();
    const incident: SecurityIncidentDto = {
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

  async list(user: AuthJwtPayload): Promise<SecurityIncidentDto[]> {
    this.assertAdmin(user);
    if (!this.db.isEnabled()) {
      return [...this.incidents.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    const rows = await this.prisma.security_incidents.findMany({
      orderBy: { updated_at: "desc" },
    });
    return rows.map((row) => this.mapPrisma(row));
  }

  async update(user: AuthJwtPayload, incidentId: string, dto: UpdateSecurityIncidentDto): Promise<SecurityIncidentDto> {
    this.assertAdmin(user);
    const current = await this.getById(incidentId);
    if (dto.status && dto.status !== current.status) {
      this.assertTransitionable(current.status, dto.status);
    }
    const now = new Date().toISOString();
    const nextStatus = dto.status ?? current.status;
    const updated: SecurityIncidentDto = {
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

  private assertTransitionable(current: SecurityIncidentDto["status"], next: SecurityIncidentDto["status"]): void {
    const transitions: Record<SecurityIncidentDto["status"], SecurityIncidentDto["status"][]> = {
      reported: ["triage"],
      triage: ["investigating", "closed"],
      investigating: ["notification_assessment", "closed"],
      notification_assessment: ["notification_ready", "closed"],
      notification_ready: ["closed"],
      closed: [],
    };
    if (!transitions[current].includes(next)) {
      throw new ConflictException(`Invalid incident transition from ${current} to ${next}`);
    }
  }

  private assertAdmin(user: AuthJwtPayload): void {
    if (user.role !== "admin") {
      throw new ForbiddenException("Only admin can manage security incidents");
    }
  }

  private async getById(incidentId: string): Promise<SecurityIncidentDto> {
    if (!this.db.isEnabled()) {
      const found = this.incidents.get(incidentId);
      if (!found) throw new NotFoundException("Security incident not found");
      return found;
    }
    const row = await this.prisma.security_incidents.findUnique({
      where: { incident_id: incidentId },
    });
    if (!row) throw new NotFoundException("Security incident not found");
    return this.mapPrisma(row);
  }

  private async save(incident: SecurityIncidentDto): Promise<void> {
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

  private mapPrisma(row: {
    incident_id: string;
    title: string;
    summary: string;
    severity: string;
    impact: string;
    status: string;
    ndb_assessment: string;
    contains_personal_data: boolean;
    assigned_owner_user_id: string | null;
    resolution_notes: string | null;
    detected_at: Date;
    created_at: Date;
    updated_at: Date;
    closed_at: Date | null;
  }): SecurityIncidentDto {
    return {
      incidentId: row.incident_id,
      title: row.title,
      summary: row.summary,
      severity: row.severity as SecurityIncidentDto["severity"],
      impact: row.impact as SecurityIncidentDto["impact"],
      status: row.status as SecurityIncidentDto["status"],
      ndbAssessment: row.ndb_assessment as SecurityIncidentDto["ndbAssessment"],
      containsPersonalData: row.contains_personal_data,
      assignedOwnerUserId: row.assigned_owner_user_id ?? undefined,
      resolutionNotes: row.resolution_notes ?? undefined,
      detectedAt: row.detected_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      closedAt: row.closed_at ? row.closed_at.toISOString() : undefined,
    };
  }
}
