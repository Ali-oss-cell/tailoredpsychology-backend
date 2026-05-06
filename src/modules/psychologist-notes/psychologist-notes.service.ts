import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { AuditService } from "../audit/audit.service";
import { AppointmentsService } from "../appointments/appointments.service";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import type { CreatePsychologistNoteDto } from "./dto/create-psychologist-note.dto";
import type { PsychologistClinicalDataset, PsychologistNoteDto } from "./dto/psychologist-note.dto";
import type { PsychologistPatientContextDto } from "./dto/psychologist-patient-context.dto";
import type { PsychologistProfileDto } from "./dto/psychologist-profile.dto";
import type { PsychologistReferralDto } from "./dto/psychologist-referral.dto";
import type { SessionVideoAccessDto } from "./dto/session-video-access.dto";
import type { SessionVideoItemDto, SessionVideoPolicyStatus } from "./dto/session-video-item.dto";
import type { UpdatePsychologistNoteDto } from "./dto/update-psychologist-note.dto";
import type { UpdatePsychologistProfileDto } from "./dto/update-psychologist-profile.dto";

const DEFAULT_PSYCHOLOGIST_BIO = "Therapy focus: anxiety and stress management.";

@Injectable()
export class PsychologistNotesService {
  private notes = new Map<string, PsychologistNoteDto>();
  private noteCounter = 1;
  private profileBio = new Map<string, string>();
  private profileImageUrls = new Map<string, string>();
  private sessionVideoAccessTokens = new Map<
    string,
    { token: string; videoId: string; issuedToUserId: string; issuedAt: number; expiresAt: number; watermarkText: string }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async listNotes(user: AuthJwtPayload, psychologistId: string): Promise<PsychologistNoteDto[]> {
    this.assertPsychologistAccess(user, psychologistId);
    return [...this.notes.values()]
      .filter((n) => n.psychologistId === psychologistId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getNote(user: AuthJwtPayload, psychologistId: string, noteId: string): Promise<PsychologistNoteDto> {
    this.assertPsychologistAccess(user, psychologistId);
    const note = this.notes.get(noteId);
    if (!note || note.psychologistId !== psychologistId) {
      throw new NotFoundException("Psychologist note not found");
    }
    return note;
  }

  async createNote(user: AuthJwtPayload, psychologistId: string, dto: CreatePsychologistNoteDto): Promise<PsychologistNoteDto> {
    this.assertPsychologistAccess(user, psychologistId);
    const now = new Date().toISOString();
    const note: PsychologistNoteDto = {
      noteId: `note_${`${this.noteCounter++}`.padStart(4, "0")}`,
      psychologistId,
      patientId: dto.patientId,
      sessionId: dto.sessionId,
      status: dto.status,
      body: dto.body.trim(),
      clinicalDataset: this.normalizeClinicalDataset(dto.clinicalDataset),
      updatedAt: now,
    };
    this.notes.set(note.noteId, note);
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "psychologist_note_created",
      targetType: "appointment",
      targetId: note.sessionId,
      metadata: { noteId: note.noteId, status: note.status },
    });
    return note;
  }

  async updateNote(
    user: AuthJwtPayload,
    psychologistId: string,
    noteId: string,
    dto: UpdatePsychologistNoteDto,
  ): Promise<PsychologistNoteDto> {
    const note = await this.getNote(user, psychologistId, noteId);
    if (note.status === "signed") {
      throw new ForbiddenException("Signed notes are immutable");
    }
    const updated: PsychologistNoteDto = {
      ...note,
      body: dto.body !== undefined ? dto.body.trim() : note.body,
      clinicalDataset:
        dto.clinicalDataset !== undefined ? this.normalizeClinicalDataset(dto.clinicalDataset) : note.clinicalDataset,
      status: dto.status ?? note.status,
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(noteId, updated);
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "psychologist_note_updated",
      targetType: "appointment",
      targetId: updated.sessionId,
      metadata: { noteId, status: updated.status },
    });
    return updated;
  }

  async signNote(user: AuthJwtPayload, psychologistId: string, noteId: string): Promise<PsychologistNoteDto> {
    const note = await this.getNote(user, psychologistId, noteId);
    const missing = this.getMissingMinimumDataset(note.clinicalDataset);
    if (missing.length > 0) {
      throw new BadRequestException({
        code: "CLINICAL_MINIMUM_DATASET_MISSING",
        message: "Cannot sign note until all required clinical dataset fields are complete.",
        missingFields: missing,
      });
    }
    const updated: PsychologistNoteDto = {
      ...note,
      status: "signed",
      signedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(noteId, updated);
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "psychologist_note_signed",
      targetType: "appointment",
      targetId: updated.sessionId,
      metadata: { noteId },
    });
    return updated;
  }

  async getPatientContext(
    user: AuthJwtPayload,
    psychologistId: string,
    patientId: string,
  ): Promise<PsychologistPatientContextDto> {
    this.assertPsychologistAccess(user, psychologistId);
    const patient = await this.usersService.findById(patientId);
    if (!patient || patient.role !== "patient") {
      throw new NotFoundException("Patient not found");
    }
    const sessions = await this.appointmentsService.getPatientSessions(user, patientId);
    const riskLevel: PsychologistPatientContextDto["riskLevel"] = sessions.some((s) => s.status === "no_show")
      ? "high"
      : sessions.some((s) => s.status === "cancelled")
        ? "medium"
        : "low";
    return {
      psychologistId,
      patientId,
      patientDisplayName: patient.displayName,
      riskLevel,
      referralStatus: "linked_referral",
      readinessStatus: "attention",
      careSignals: ["session_trend_stable", "follow_up_recommended"],
    };
  }

  async listPsychologistReferrals(user: AuthJwtPayload, psychologistId: string): Promise<PsychologistReferralDto[]> {
    this.assertPsychologistAccess(user, psychologistId);
    const sessions = await this.appointmentsService.getPsychologistSessions(user, psychologistId);
    const assignedPatientIds = [...new Set(sessions.map((session) => session.patientId))];
    if (assignedPatientIds.length === 0) return [];

    if (!this.databaseService.isEnabled()) {
      return assignedPatientIds.map((patientId, index) => ({
        documentId: `ref_demo_${index + 1}`,
        patientId,
        status: "linked_referral",
        sourceType: "gp_mhtp",
        uploadedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    }

    const rows = await this.prisma.referral_documents.findMany({
      where: { patient_id: { in: assignedPatientIds } },
      orderBy: { uploaded_at: "desc" },
    });
    return rows.map((row) => ({
      documentId: row.document_id,
      patientId: row.patient_id,
      status: row.status,
      sourceType: row.source_type ?? "unknown",
      uploadedAt: row.uploaded_at.toISOString(),
      dueAt: row.due_at.toISOString(),
    }));
  }

  async getMyProfile(user: AuthJwtPayload): Promise<PsychologistProfileDto> {
    if (user.role !== "psychologist") {
      throw new ForbiddenException("Only psychologists can access this profile");
    }
    const psych = await this.usersService.findById(user.sub);
    if (!psych || psych.role !== "psychologist") {
      throw new NotFoundException("Psychologist profile not found");
    }

    if (this.databaseService.isEnabled()) {
      const bioRow = await this.prisma.psychologist_profile_bio.findUnique({
        where: { psychologist_id: psych.id },
      });
      const bioText = bioRow?.bio?.trim();
      const img = bioRow?.profile_image_url?.trim();
      return {
        psychologistId: psych.id,
        email: psych.email,
        displayName: psych.displayName,
        registrationNumber: psych.psychologistAdminProfile?.registrationNumber ?? "",
        providerNumber: psych.psychologistAdminProfile?.providerNumber ?? "",
        specialties: psych.psychologistAdminProfile?.specialties ?? [],
        status: psych.psychologistAdminProfile?.status ?? "active",
        bio: bioText || DEFAULT_PSYCHOLOGIST_BIO,
        profileImageUrl: img || undefined,
      };
    }

    return {
      psychologistId: psych.id,
      email: psych.email,
      displayName: psych.displayName,
      registrationNumber: psych.psychologistAdminProfile?.registrationNumber ?? "",
      providerNumber: psych.psychologistAdminProfile?.providerNumber ?? "",
      specialties: psych.psychologistAdminProfile?.specialties ?? [],
      status: psych.psychologistAdminProfile?.status ?? "active",
      bio: this.profileBio.get(psych.id) ?? DEFAULT_PSYCHOLOGIST_BIO,
      profileImageUrl: this.profileImageUrls.get(psych.id) ?? undefined,
    };
  }

  async updateMyProfile(user: AuthJwtPayload, dto: UpdatePsychologistProfileDto): Promise<PsychologistProfileDto> {
    if (user.role !== "psychologist") {
      throw new ForbiddenException("Only psychologists can update this profile");
    }
    const current = await this.getMyProfile(user);
    await this.usersService.updatePsychologistUser(user.sub, {
      displayName: dto.displayName ?? current.displayName,
      registrationNumber: dto.registrationNumber ?? current.registrationNumber,
      providerNumber: dto.providerNumber ?? current.providerNumber,
      specialties: dto.specialties ?? current.specialties,
      status: dto.status ?? current.status,
    });

    if (this.databaseService.isEnabled()) {
      const existing = await this.prisma.psychologist_profile_bio.findUnique({
        where: { psychologist_id: user.sub },
      });
      let nextBio = existing?.bio?.trim() || DEFAULT_PSYCHOLOGIST_BIO;
      if (dto.bio !== undefined) {
        nextBio = dto.bio.trim() || DEFAULT_PSYCHOLOGIST_BIO;
      }
      let nextImg = existing?.profile_image_url ?? null;
      if (dto.profileImageUrl !== undefined) {
        const prevUrl = existing?.profile_image_url ?? undefined;
        nextImg = dto.profileImageUrl.trim() ? dto.profileImageUrl.trim() : null;
        if (!nextImg && prevUrl) {
          this.tryUnlinkAvatarFile(prevUrl);
        }
      }
      await this.prisma.psychologist_profile_bio.upsert({
        where: { psychologist_id: user.sub },
        create: {
          psychologist_id: user.sub,
          bio: nextBio,
          profile_image_url: nextImg,
          updated_at: new Date(),
        },
        update: {
          bio: nextBio,
          profile_image_url: nextImg,
          updated_at: new Date(),
        },
      });
    } else {
      if (dto.bio !== undefined) {
        this.profileBio.set(user.sub, dto.bio.trim());
      }
      if (dto.profileImageUrl !== undefined) {
        const prev = this.profileImageUrls.get(user.sub);
        if (!dto.profileImageUrl.trim() && prev) {
          this.tryUnlinkAvatarFile(prev);
        }
        this.profileImageUrls.set(user.sub, dto.profileImageUrl.trim());
      }
    }
    return this.getMyProfile(user);
  }

  async uploadMyProfileAvatar(user: AuthJwtPayload, file: Express.Multer.File | undefined): Promise<PsychologistProfileDto> {
    if (user.role !== "psychologist") {
      throw new ForbiddenException("Only psychologists can upload a profile photo");
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException("Image file is required");
    }
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException("Only JPEG, PNG, or WebP images are allowed");
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException("Image must be 2MB or smaller");
    }

    const current = await this.getMyProfile(user);
    this.tryUnlinkAvatarFile(current.profileImageUrl);

    const ext = file.mimetype === "image/jpeg" ? "jpg" : file.mimetype === "image/png" ? "png" : "webp";
    const { randomUUID } = await import("crypto");
    const safeBase = user.sub.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const safeName = `${safeBase}_${randomUUID()}.${ext}`;
    const dir = join(process.cwd(), "uploads", "clinician-avatars");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, safeName), file.buffer);

    const publicBase = (process.env.PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const imageUrl = `${publicBase}/api/public/clinician-avatars/${safeName}`;

    if (this.databaseService.isEnabled()) {
      const existing = await this.prisma.psychologist_profile_bio.findUnique({
        where: { psychologist_id: user.sub },
      });
      const nextBio = existing?.bio?.trim() || DEFAULT_PSYCHOLOGIST_BIO;
      await this.prisma.psychologist_profile_bio.upsert({
        where: { psychologist_id: user.sub },
        create: {
          psychologist_id: user.sub,
          bio: nextBio,
          profile_image_url: imageUrl,
          updated_at: new Date(),
        },
        update: {
          profile_image_url: imageUrl,
          updated_at: new Date(),
        },
      });
    } else {
      this.profileImageUrls.set(user.sub, imageUrl);
    }

    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "psychologist_profile_avatar_uploaded",
      targetType: "system",
      targetId: user.sub,
      metadata: { fileName: safeName, bytes: file.size },
    });

    return this.getMyProfile(user);
  }

  private tryUnlinkAvatarFile(profileImageUrl: string | undefined): void {
    if (!profileImageUrl?.includes("/api/public/clinician-avatars/")) {
      return;
    }
    const segment = profileImageUrl.split("/").pop()?.split("?")[0];
    if (!segment || !/^[a-zA-Z0-9_.-]+$/.test(segment)) {
      return;
    }
    const fullPath = join(process.cwd(), "uploads", "clinician-avatars", segment);
    void unlink(fullPath).catch(() => undefined);
  }

  async listSessionVideosForPsychologist(user: AuthJwtPayload, psychologistId: string): Promise<SessionVideoItemDto[]> {
    this.assertPsychologistAccess(user, psychologistId);
    const sessions = await this.appointmentsService.getPsychologistSessions(user, psychologistId);
    const rows: SessionVideoItemDto[] = [];
    for (const session of sessions) {
      rows.push(await this.toSessionVideoItem(session, user));
    }
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "session_video_listed",
      targetType: "system",
      targetId: psychologistId,
      metadata: { scope: "psychologist", count: rows.length },
    });
    return rows;
  }

  async listSessionVideosForPatient(user: AuthJwtPayload, patientId: string): Promise<SessionVideoItemDto[]> {
    const canRead = (user.role === "patient" && user.sub === patientId) || user.role === "admin" || user.role === "practice_manager";
    if (!canRead) {
      throw new ForbiddenException("You cannot access this patient's session videos");
    }
    const sessions = await this.appointmentsService.getPatientSessions(user, patientId);
    const rows: SessionVideoItemDto[] = [];
    for (const session of sessions) {
      rows.push(await this.toSessionVideoItem(session, user));
    }
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "session_video_listed",
      targetType: "system",
      targetId: patientId,
      metadata: { scope: "patient", count: rows.length },
    });
    return rows;
  }

  async requestSessionVideoAccess(user: AuthJwtPayload, videoId: string): Promise<SessionVideoAccessDto> {
    const sessionId = this.parseSessionIdFromVideoId(videoId);
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundException("Session video not found");
    }

    const isOwnerPatient = user.role === "patient" && user.sub === session.patientId;
    const isOwnerPsychologist =
      user.role === "psychologist" &&
      user.sub === this.resolveClinicianUserId(session.clinicianId);

    if (!isOwnerPatient && !isOwnerPsychologist) {
      await this.auditService.recordEvent({
        actorUserId: user.sub,
        actorRole: user.role,
        action: "session_video_access_denied",
        targetType: "appointment",
        targetId: session.sessionId,
        metadata: { reason: "owners_only" },
      });
      return {
        videoId,
        canDownload: false,
        denialReason: "Downloads are restricted to owner patient or assigned psychologist.",
      };
    }

    const policyStatus = await this.getPolicyStatus(session.patientId);
    if (policyStatus !== "active") {
      const denialReason =
        policyStatus === "hold"
          ? "Downloads blocked while legal hold is active."
          : "Downloads blocked while patient data is pending purge.";
      await this.auditService.recordEvent({
        actorUserId: user.sub,
        actorRole: user.role,
        action: "session_video_access_denied",
        targetType: "appointment",
        targetId: session.sessionId,
        metadata: { reason: denialReason, policyStatus },
      });
      throw new ConflictException({ code: "SESSION_VIDEO_DOWNLOAD_BLOCKED", message: denialReason, policyStatus });
    }

    const token = this.issueSessionVideoToken(videoId, user.sub, this.getWatermarkText(user.sub));
    const grant = this.sessionVideoAccessTokens.get(token)!;
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "session_video_access_granted",
      targetType: "appointment",
      targetId: session.sessionId,
      metadata: { videoId, expiresAt: new Date(grant.expiresAt).toISOString() },
    });
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "session_video_download_initiated",
      targetType: "appointment",
      targetId: session.sessionId,
      metadata: { videoId },
    });
    return {
      videoId,
      canDownload: true,
      accessToken: grant.token,
      expiresAt: new Date(grant.expiresAt).toISOString(),
      watermarkText: grant.watermarkText,
      downloadUrl: `https://example.com/protected-download/${grant.token}`,
    };
  }

  private assertPsychologistAccess(user: AuthJwtPayload, psychologistId: string): void {
    const canRead = (user.role === "psychologist" && user.sub === psychologistId) || user.role === "admin" || user.role === "practice_manager";
    if (!canRead) {
      throw new ForbiddenException("You cannot access this psychologist scope");
    }
  }

  private async toSessionVideoItem(
    session: { sessionId: string; patientId: string; clinicianId: string; scheduledStartAt: string; status: string },
    user: AuthJwtPayload,
  ): Promise<SessionVideoItemDto> {
    const videoId = `video_${session.sessionId}`;
    const policyStatus = await this.getPolicyStatus(session.patientId);
    const isOwnerPatient = user.role === "patient" && user.sub === session.patientId;
    const isOwnerPsychologist = user.role === "psychologist" && user.sub === this.resolveClinicianUserId(session.clinicianId);
    const canDownload = policyStatus === "active" && (isOwnerPatient || isOwnerPsychologist);
    const policyReason =
      policyStatus === "hold"
        ? "Downloads blocked while legal hold is active."
        : policyStatus === "purge_pending"
          ? "Downloads blocked while patient data is pending purge."
          : canDownload
            ? undefined
            : "Downloads are restricted to owner patient or assigned psychologist.";
    return {
      videoId,
      sessionId: session.sessionId,
      patientId: session.patientId,
      clinicianId: session.clinicianId,
      sessionDate: session.scheduledStartAt,
      policyStatus,
      canDownload,
      policyReason,
      watermarkRequired: true,
      watermarkText: this.getWatermarkText(user.sub),
      transcriptReady: session.status === "completed",
    };
  }

  private async getPolicyStatus(patientId: string): Promise<SessionVideoPolicyStatus> {
    const retention = await this.usersService.getPatientRetentionState(patientId);
    if (retention.legalHoldActive) return "hold";
    if (retention.deletedAt && !retention.purgedAt) return "purge_pending";
    return "active";
  }

  private async getSessionById(sessionId: string): Promise<{
    sessionId: string;
    patientId: string;
    clinicianId: string;
    scheduledStartAt: string;
    status: string;
  } | null> {
    try {
      const session = await this.appointmentsService.getSessionDetail(
        { sub: "system_admin", role: "admin", email: "system@local", displayName: "System Admin" },
        sessionId,
      );
      return {
        sessionId: session.sessionId,
        patientId: session.patientId,
        clinicianId: session.clinicianId,
        scheduledStartAt: session.scheduledStartAt,
        status: session.status,
      };
    } catch {
      return null;
    }
  }

  private parseSessionIdFromVideoId(videoId: string): string {
    const prefix = "video_";
    if (!videoId.startsWith(prefix)) {
      throw new BadRequestException("Invalid video id");
    }
    return videoId.slice(prefix.length);
  }

  private resolveClinicianUserId(clinicianId: string): string {
    if (!clinicianId.startsWith("clinician_")) {
      return clinicianId;
    }
    return `user_psychologist_${clinicianId.slice("clinician_".length)}`;
  }

  private issueSessionVideoToken(videoId: string, issuedToUserId: string, watermarkText: string): string {
    const token = `svat_${Math.random().toString(36).slice(2, 12)}`;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 5 * 60 * 1000;
    this.sessionVideoAccessTokens.set(token, { token, videoId, issuedToUserId, issuedAt, expiresAt, watermarkText });
    return token;
  }

  private getWatermarkText(userId: string): string {
    return `CLINK CONFIDENTIAL · ${userId.toUpperCase()} · ${new Date().toISOString().slice(0, 10)}`;
  }

  private normalizeClinicalDataset(dataset: Record<string, unknown> | undefined): PsychologistClinicalDataset | undefined {
    if (!dataset) return undefined;
    const read = (key: keyof PsychologistClinicalDataset) => {
      const value = dataset[key];
      return typeof value === "string" ? value.trim() : "";
    };
    return {
      presentingConcerns: read("presentingConcerns"),
      riskAssessment: read("riskAssessment"),
      interventionsApplied: read("interventionsApplied"),
      progressEvaluation: read("progressEvaluation"),
      followUpPlan: read("followUpPlan"),
    };
  }

  private getMissingMinimumDataset(dataset: PsychologistClinicalDataset | undefined): string[] {
    if (!dataset) {
      return ["presentingConcerns", "riskAssessment", "interventionsApplied", "progressEvaluation", "followUpPlan"];
    }
    const required: Array<keyof PsychologistClinicalDataset> = [
      "presentingConcerns",
      "riskAssessment",
      "interventionsApplied",
      "progressEvaluation",
      "followUpPlan",
    ];
    return required.filter((key) => dataset[key].trim().length === 0);
  }
}
