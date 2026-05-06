import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import type { GetReferralQueueQueryDto } from "./dto/get-referral-queue-query.dto";
import { ReferralDocumentDto } from "./dto/referral-document.dto";
import { UploadReferralMetadataDto } from "./dto/upload-referral-metadata.dto";

const MAX_REFERRAL_SIZE_BYTES = 8 * 1024 * 1024;
const OPS_ROLES = new Set<AuthJwtPayload["role"]>(["practice_manager", "admin"]);

type ReferralReviewStatus = "received" | "review_needed" | "approved" | "rejected" | "info_requested";
function toMillis(value: string | Date): number {
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
type ReferralRecord = {
  documentId: string;
  patientId: string;
  status: ReferralReviewStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sourceType?: string;
  referralDate?: string;
  notes?: string;
  uploadedAt: string;
  dueAt: string;
  overdue: boolean;
  assignedOwnerUserId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewReason?: string;
  reviewNotes?: string;
};

@Injectable()
export class ResourcesService {
  private referralCounter = 1;
  private referrals: ReferralRecord[] = [];
  constructor(
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadReferral(
    user: AuthJwtPayload,
    file: Express.Multer.File | undefined,
    metadata: UploadReferralMetadataDto,
  ): Promise<ReferralDocumentDto> {
    if (user.role !== "patient") {
      await this.auditService.recordEvent({
        actorUserId: user.sub,
        actorRole: user.role,
        action: "referral_upload_denied_role",
        targetType: "referral_document",
        targetId: "new",
      });
      throw new ForbiddenException("Only patients can upload referral documents");
    }

    if (!file) {
      throw new BadRequestException("Referral file is required");
    }
    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException("Only PDF referrals are supported");
    }
    if (file.size > MAX_REFERRAL_SIZE_BYTES) {
      throw new BadRequestException("Referral PDF exceeds 8MB size limit");
    }
    if (metadata.referralDate) {
      const referralDate = new Date(metadata.referralDate);
      if (Number.isNaN(referralDate.getTime())) {
        throw new BadRequestException("Invalid referral date");
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
    const referral: ReferralRecord = {
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

  async listReferralQueue(user: AuthJwtPayload, query: GetReferralQueueQueryDto): Promise<ReferralRecord[]> {
    this.assertOpsRole(user);
    const now = Date.now();
    const all = (await this.listReferrals()).map((ref) => ({
      ...ref,
      overdue: this.isOverdue(ref, now),
    }));
    return all
      .filter((item) => {
        if (query.status && item.status !== query.status) return false;
        if (query.owner === "unreviewed" && item.assignedOwnerUserId) return false;
        if (query.owner === "mine" && item.assignedOwnerUserId !== user.sub) return false;
        if (query.overdue === "overdue" && !item.overdue) return false;
        if (query.overdue === "on-track" && item.overdue) return false;
        return true;
      })
      .sort((a, b) => toMillis(b.uploadedAt) - toMillis(a.uploadedAt));
  }

  async approveReferral(user: AuthJwtPayload, referralId: string, reason?: string, notes?: string): Promise<ReferralRecord> {
    this.assertOpsRole(user);
    const referral = await this.getReferralById(referralId);
    this.assertTransitionable(referral, "approved");
    await this.applyReviewDecision(referral, user, "approved", reason, notes, "referral_approved");
    return { ...referral };
  }

  async rejectReferral(user: AuthJwtPayload, referralId: string, reason?: string, notes?: string): Promise<ReferralRecord> {
    this.assertOpsRole(user);
    const referral = await this.getReferralById(referralId);
    this.assertTransitionable(referral, "rejected");
    await this.applyReviewDecision(referral, user, "rejected", reason, notes, "referral_rejected");
    return { ...referral };
  }

  async requestReferralInfo(
    user: AuthJwtPayload,
    referralId: string,
    reason?: string,
    notes?: string,
  ): Promise<ReferralRecord> {
    this.assertOpsRole(user);
    const referral = await this.getReferralById(referralId);
    this.assertTransitionable(referral, "info_requested");
    await this.applyReviewDecision(referral, user, "info_requested", reason, notes, "referral_info_requested");
    return { ...referral };
  }

  private assertOpsRole(user: AuthJwtPayload): void {
    if (!OPS_ROLES.has(user.role)) {
      throw new ForbiddenException("Only admin and practice_manager can review referrals");
    }
  }

  private async getReferralById(referralId: string): Promise<ReferralRecord> {
    const referrals = await this.listReferrals();
    const referral = referrals.find((item) => item.documentId === referralId);
    if (!referral) {
      throw new NotFoundException("Referral not found");
    }
    return referral;
  }

  private assertTransitionable(referral: ReferralRecord, target: Exclude<ReferralReviewStatus, "received" | "review_needed">): void {
    if (referral.status === target) {
      throw new ConflictException(`Referral already ${target}`);
    }
    if (referral.status === "approved" || referral.status === "rejected") {
      throw new ConflictException(`Referral is already finalized as ${referral.status}`);
    }
  }

  private async applyReviewDecision(
    referral: ReferralRecord,
    user: AuthJwtPayload,
    nextStatus: Exclude<ReferralReviewStatus, "received" | "review_needed">,
    reason: string | undefined,
    notes: string | undefined,
    action: "referral_approved" | "referral_rejected" | "referral_info_requested",
  ): Promise<void> {
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

  private isOverdue(referral: ReferralRecord, nowMs: number): boolean {
    if (referral.status === "approved" || referral.status === "rejected") return false;
    const dueAtMs = new Date(referral.dueAt).getTime();
    if (Number.isNaN(dueAtMs)) return false;
    return nowMs > dueAtMs;
  }

  private async listReferrals(): Promise<ReferralRecord[]> {
    if (!this.databaseService.isEnabled()) {
      return [...this.referrals];
    }
    const rows = await this.prisma.referral_documents.findMany({
      orderBy: { uploaded_at: "desc" },
    });
    return rows.map((row) => ({
      documentId: row.document_id,
      patientId: row.patient_id,
      status: row.status as ReferralReviewStatus,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      sourceType: row.source_type ?? undefined,
      referralDate: row.referral_date ? row.referral_date.toISOString().slice(0, 10) : undefined,
      notes: row.notes ?? undefined,
      uploadedAt: row.uploaded_at.toISOString(),
      dueAt: row.due_at.toISOString(),
      overdue: this.isOverdue({ dueAt: row.due_at.toISOString(), status: row.status } as ReferralRecord, Date.now()),
      assignedOwnerUserId: row.assigned_owner_user_id ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
      reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : undefined,
      reviewReason: row.review_reason ?? undefined,
      reviewNotes: row.review_notes ?? undefined,
    }));
  }

  private async saveReferral(referral: ReferralRecord): Promise<void> {
    if (!this.databaseService.isEnabled()) {
      const idx = this.referrals.findIndex((item) => item.documentId === referral.documentId);
      if (idx >= 0) this.referrals[idx] = referral;
      else this.referrals.unshift(referral);
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

  private toReferralDocumentDto(referral: ReferralRecord): ReferralDocumentDto {
    return {
      documentId: referral.documentId,
      status: referral.status,
      fileName: referral.fileName,
      fileSize: referral.fileSize,
      mimeType: referral.mimeType,
      uploadedAt: referral.uploadedAt,
    };
  }
}
