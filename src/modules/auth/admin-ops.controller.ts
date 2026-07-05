import { Controller, ForbiddenException, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AnalyticsService } from "../analytics/analytics.service";
import { AppointmentsService } from "../appointments/appointments.service";
import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import {
  AdminAnalyticsSummaryDto,
  AdminAppointmentItemDto,
  AdminBillingSummaryDto,
  AdminDeletionQueueItemDto,
  AdminPatientItemDto,
  AdminResourceItemDto,
  AdminSettingsDomainDto,
  AdminStaffItemDto,
} from "./dto/admin-ops.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";

@ApiTags("admin-ops")
@Controller("admin/ops")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminOpsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("appointments")
  @ApiOperation({ summary: "Get admin appointment oversight snapshot" })
  @ApiOkResponse({ type: [AdminAppointmentItemDto] })
  async listAppointments(@CurrentUser() user: AuthJwtPayload): Promise<AdminAppointmentItemDto[]> {
    this.assertOpsGovernance(user);
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
    const usersRows =
      userIds.length > 0
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

  @Get("patients")
  @ApiOperation({ summary: "Get admin patient oversight snapshot" })
  @ApiOkResponse({ type: [AdminPatientItemDto] })
  async listPatients(@CurrentUser() user: AuthJwtPayload): Promise<AdminPatientItemDto[]> {
    this.assertOpsGovernance(user);
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
    const drafts =
      patientIds.length > 0
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

  @Get("staff")
  @ApiOperation({ summary: "Get admin staff oversight snapshot" })
  @ApiOkResponse({ type: [AdminStaffItemDto] })
  async listStaff(@CurrentUser() user: AuthJwtPayload): Promise<AdminStaffItemDto[]> {
    this.assertOpsGovernance(user);
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

  @Get("settings")
  @ApiOperation({ summary: "Get admin settings domains snapshot" })
  @ApiOkResponse({ type: [AdminSettingsDomainDto] })
  async listSettings(@CurrentUser() user: AuthJwtPayload): Promise<AdminSettingsDomainDto[]> {
    this.assertOpsGovernance(user);
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

  @Get("resources")
  @ApiOperation({ summary: "Get admin resources governance snapshot" })
  @ApiOkResponse({ type: [AdminResourceItemDto] })
  async listResources(@CurrentUser() user: AuthJwtPayload): Promise<AdminResourceItemDto[]> {
    this.assertOpsGovernance(user);
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

  @Get("deletion-queue")
  @ApiOperation({ summary: "Get retention/deletion queue for admin review" })
  @ApiOkResponse({ type: [AdminDeletionQueueItemDto] })
  async deletionQueue(
    @CurrentUser() user: AuthJwtPayload,
    @Query("state") state?: "all" | "deleted" | "legal_hold" | "purge_eligible",
  ): Promise<AdminDeletionQueueItemDto[]> {
    this.assertOpsGovernance(user);
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
        if (effectiveState === "deleted") return Boolean(row.deletedAt);
        if (effectiveState === "legal_hold") return row.legalHoldActive;
        if (effectiveState === "purge_eligible") return row.purgeEligible;
        return true;
      });
  }

  @Get("billing")
  @ApiOperation({ summary: "Get admin billing aggregate snapshot" })
  @ApiOkResponse({ type: AdminBillingSummaryDto })
  async billingSnapshot(@CurrentUser() user: AuthJwtPayload): Promise<AdminBillingSummaryDto> {
    this.assertOpsGovernance(user);
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

  @Get("analytics-summary")
  @ApiOperation({ summary: "Get admin analytics summary aggregates" })
  @ApiOkResponse({ type: AdminAnalyticsSummaryDto })
  async analyticsSummary(@CurrentUser() user: AuthJwtPayload): Promise<AdminAnalyticsSummaryDto> {
    this.assertOpsGovernance(user);
    const events = await this.analyticsService.listEvents();
    const audits = await this.auditService.listEvents({});
    return {
      totalAnalyticsEvents: events.length,
      totalAuditEvents: audits.length,
      bookingRequested: events.filter((e) => e.name === "booking_requested").length,
      joinFailures: events.filter((e) => e.name === "join_failed").length,
    };
  }

  private assertOpsGovernance(user: AuthJwtPayload): void {
    if (user.role !== "admin" && user.role !== "practice_manager") {
      throw new ForbiddenException("Only admin and practice_manager can access ops governance endpoints");
    }
  }
}

function resolveRetentionStatus(row: {
  deleted_at: Date | null;
  legal_hold_active: boolean;
  retention_until: Date | null;
}): "active" | "deleted" | "legal_hold" | "purge_pending" {
  if (row.legal_hold_active) return "legal_hold";
  if (!row.deleted_at) return "active";
  if (row.retention_until && row.retention_until.getTime() <= Date.now()) return "purge_pending";
  return "deleted";
}
