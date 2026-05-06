import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { AuditService } from "../audit/audit.service";
import { UsersService } from "../users/users.service";
import type { PatientRetentionState } from "../users/types/patient-retention-state.type";
import { CurrentUser } from "./decorators/current-user.decorator";
import { BreakGlassAccessRequestDto } from "./dto/break-glass-access-request.dto";
import { BreakGlassAccessStatusDto } from "./dto/break-glass-access-status.dto";
import { PatientRetentionReasonDto } from "./dto/patient-retention-reason.dto";
import { PatientRetentionStatusDto } from "./dto/patient-retention-status.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";

@ApiTags("admin-patient-retention")
@Controller("admin/patients")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminPatientRetentionController {
  private readonly breakGlassAccess = new Map<
    string,
    { patientId: string; grantedByUserId: string; justification: string; grantedAt: string; expiresAt: string }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Post(":id/soft-delete")
  @ApiOperation({ summary: "Soft delete patient account and compute retention window" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async softDelete(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") patientId: string,
    @Body() dto: PatientRetentionReasonDto,
  ): Promise<PatientRetentionStatusDto> {
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

  @Post(":id/restore")
  @ApiOperation({ summary: "Restore soft-deleted patient account" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async restore(@CurrentUser() user: AuthJwtPayload, @Param("id") patientId: string): Promise<PatientRetentionStatusDto> {
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

  @Post(":id/legal-hold")
  @ApiOperation({ summary: "Enable legal hold on patient account" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async setLegalHold(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") patientId: string,
    @Body() dto: PatientRetentionReasonDto,
  ): Promise<PatientRetentionStatusDto> {
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

  @Post(":id/legal-hold/remove")
  @ApiOperation({ summary: "Remove legal hold from patient account" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async removeLegalHold(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") patientId: string,
  ): Promise<PatientRetentionStatusDto> {
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

  @Get(":id/retention-status")
  @ApiOperation({ summary: "Get retention/deletion status for patient account" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async getRetentionStatus(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") patientId: string,
  ): Promise<PatientRetentionStatusDto> {
    this.assertAdmin(user);
    const retention = await this.usersService.getPatientRetentionState(patientId);
    return toRetentionDto(patientId, retention);
  }

  @Get("purge-eligible")
  @ApiOperation({ summary: "List patient accounts eligible for purge by policy" })
  @ApiOkResponse({ type: [PatientRetentionStatusDto] })
  @ApiQuery({ name: "at", required: false, description: "ISO timestamp override for eligibility evaluation" })
  async listPurgeEligible(
    @CurrentUser() user: AuthJwtPayload,
    @Query("at") at: string | undefined,
  ): Promise<PatientRetentionStatusDto[]> {
    this.assertAdmin(user);
    const nowIso = at && !Number.isNaN(new Date(at).getTime()) ? at : new Date().toISOString();
    const rows = await this.usersService.listPurgeEligiblePatients(nowIso);
    return rows.map((row) => toRetentionDto(row.patientId, row.retention));
  }

  @Post(":id/purge")
  @ApiOperation({ summary: "Feature-flagged purge execution marker (no physical deletion in Wave 11)" })
  @ApiOkResponse({ type: PatientRetentionStatusDto })
  async purge(@CurrentUser() user: AuthJwtPayload, @Param("id") patientId: string): Promise<PatientRetentionStatusDto> {
    this.assertAdmin(user);
    const retention = await this.usersService.getPatientRetentionState(patientId);
    if (!retention.deletedAt || !retention.retentionUntil) {
      throw new BadRequestException("Patient is not soft-deleted with a retention window");
    }
    if (retention.legalHoldActive) {
      throw new BadRequestException("Purge blocked while legal hold is active");
    }
    if (new Date(retention.retentionUntil).getTime() > Date.now()) {
      throw new BadRequestException("Purge blocked before retention date");
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
      throw new BadRequestException("Purge execution is disabled by feature flag");
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

  @Post(":id/break-glass-access")
  @ApiOperation({ summary: "Grant time-limited break-glass access with mandatory justification" })
  @ApiOkResponse({ type: BreakGlassAccessStatusDto })
  async grantBreakGlassAccess(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") patientId: string,
    @Body() dto: BreakGlassAccessRequestDto,
  ): Promise<BreakGlassAccessStatusDto> {
    this.assertAdmin(user);
    const retention = await this.usersService.getPatientRetentionState(patientId);
    if (!retention.legalHoldActive) {
      throw new BadRequestException("Break-glass access is only available while legal hold is active");
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

  @Get(":id/break-glass-access")
  @ApiOperation({ summary: "Get break-glass access status for patient scope" })
  @ApiOkResponse({ type: BreakGlassAccessStatusDto })
  getBreakGlassStatus(@CurrentUser() user: AuthJwtPayload, @Param("id") patientId: string): BreakGlassAccessStatusDto {
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
    const activeGrant = grant!;
    return {
      patientId,
      active: true,
      grantedByUserId: activeGrant.grantedByUserId,
      justification: activeGrant.justification,
      grantedAt: activeGrant.grantedAt,
      expiresAt: activeGrant.expiresAt,
    };
  }

  private assertAdmin(user: AuthJwtPayload): void {
    if (user.role !== "admin") {
      throw new ForbiddenException("Only admin can manage patient deletion and retention controls");
    }
  }
}

function toRetentionDto(patientId: string, retention: PatientRetentionState): PatientRetentionStatusDto {
  const purgeEligible =
    Boolean(retention.deletedAt) &&
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
