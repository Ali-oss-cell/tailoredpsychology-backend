import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { intakeDraftDataToProfileMerge } from "./intake-profile-merge.util";
import type { UserRecord } from "./entities/user-record";
import { emptyPatientContactProfile, type PatientContactProfile } from "./types/patient-contact-profile.type";
import { emptyPatientRetentionState, type PatientRetentionState } from "./types/patient-retention-state.type";
import { emptyPsychologistAdminProfile } from "./types/psychologist-admin-profile.type";
import { USER_ROLES, type UserRole } from "./types/user-role.type";
import type {
  CreatePsychologistUserInput,
  PatientLegalHoldInput,
  PatientSoftDeleteInput,
  UpdatePsychologistUserInput,
  UpdateUserProfileInput,
  UsersRepository,
} from "./users.repository";

function parseRole(role: string): UserRole {
  if ((USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }
  return "patient";
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

const userInclude = Prisma.validator<Prisma.usersInclude>()({
  patient_profiles: true,
  psychologist_profiles: true,
});

type UserWithProfiles = Prisma.usersGetPayload<{ include: typeof userInclude }>;

function mapPrismaUser(row: UserWithProfiles): UserRecord {
  const role = parseRole(row.role);
  const base: UserRecord = {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role,
    password: row.password,
    accountOnboardingComplete: row.account_onboarding_complete,
  };
  if (role === "patient") {
    const p = row.patient_profiles ?? null;
    base.patientContactProfile = {
      phoneMobile: p?.phone_mobile ?? "",
      preferredContactMethod:
        p?.preferred_contact_method === "sms" || p?.preferred_contact_method === "phone"
          ? p.preferred_contact_method
          : "email",
      accessibilityNotes: p?.accessibility_notes ?? "",
      emergencyContactName: p?.emergency_contact_name ?? "",
      emergencyContactPhone: p?.emergency_contact_phone ?? "",
      emergencyContactRelationship: p?.emergency_contact_relationship ?? "",
    };
    base.patientRetention = {
      deletedAt: iso(row.deleted_at),
      deletionReason: row.deletion_reason,
      deletedByUserId: row.deleted_by_user_id,
      legalHoldActive: row.legal_hold_active ?? false,
      legalHoldReason: row.legal_hold_reason,
      legalHoldSetByUserId: row.legal_hold_set_by_user_id,
      legalHoldSetAt: iso(row.legal_hold_set_at),
      retentionUntil: iso(row.retention_until),
      purgedAt: iso(row.purged_at),
      lastInteractionAt: iso(row.last_interaction_at),
    };
  }
  if (role === "psychologist") {
    const pp = row.psychologist_profiles ?? null;
    base.psychologistAdminProfile = {
      registrationNumber: pp?.registration_number ?? "",
      providerNumber: pp?.provider_number ?? "",
      specialties: pp?.specialties ?? [],
      status: pp?.status === "inactive" ? "inactive" : "active",
    };
  }
  return base;
}

@Injectable()
export class UsersPgRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const u = await this.prisma.users.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
      include: userInclude,
    });
    return u ? mapPrismaUser(u) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const u = await this.prisma.users.findUnique({
      where: { user_id: id },
      include: userInclude,
    });
    return u ? mapPrismaUser(u) : null;
  }

  async updateDisplayName(id: string, displayName: string): Promise<void> {
    await this.updateProfile(id, { displayName });
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<void> {
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: id },
      data: { display_name: input.displayName, updated_at: now },
    });
    const user = await this.findById(id);
    if (!user || user.role !== "patient") {
      return;
    }
    const patch = input.patientContactProfile;
    if (!patch) {
      return;
    }
    const merged: PatientContactProfile = {
      ...emptyPatientContactProfile(),
      ...(user.patientContactProfile ?? {}),
      ...patch,
    };
    await this.prisma.patient_profiles.upsert({
      where: { user_id: id },
      create: {
        user_id: id,
        phone_mobile: merged.phoneMobile,
        preferred_contact_method: merged.preferredContactMethod,
        accessibility_notes: merged.accessibilityNotes,
        emergency_contact_name: merged.emergencyContactName,
        emergency_contact_phone: merged.emergencyContactPhone,
        emergency_contact_relationship: merged.emergencyContactRelationship,
        updated_at: now,
      },
      update: {
        phone_mobile: merged.phoneMobile,
        preferred_contact_method: merged.preferredContactMethod,
        accessibility_notes: merged.accessibilityNotes,
        emergency_contact_name: merged.emergencyContactName,
        emergency_contact_phone: merged.emergencyContactPhone,
        emergency_contact_relationship: merged.emergencyContactRelationship,
        updated_at: now,
      },
    });
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: id },
      data: { password, updated_at: now },
    });
  }

  async markAccountOnboardingComplete(id: string): Promise<void> {
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: id },
      data: { account_onboarding_complete: true, updated_at: now },
    });
  }

  async createPatientUser(input: { email: string; displayName: string; password: string }): Promise<UserRecord> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const userId = await this.prisma.$transaction(async (tx) => {
      // Only numeric suffixes (user_patient_001). Alphanumeric demo IDs (e.g. user_patient_a_002) must not break MAX(cast(...)).
      const rows = await tx.$queryRawUnsafe<{ next: string }[]>(
        `select coalesce(max((regexp_match(user_id, '^user_patient_([0-9]+)$'))[1]::integer), 999) + 1 as next from users where user_id ~ '^user_patient_[0-9]+$'`,
      );
      const nextNum = Number(rows[0]?.next ?? 1000);
      const id = `user_patient_${`${nextNum}`.padStart(3, "0")}`;
      const now = new Date();
      await tx.users.create({
        data: {
          user_id: id,
          email: normalizedEmail,
          display_name: input.displayName.trim(),
          role: "patient",
          password: input.password,
          account_onboarding_complete: false,
          created_at: now,
          updated_at: now,
        },
      });
      await tx.patient_profiles.create({
        data: {
          user_id: id,
          updated_at: now,
        },
      });
      return id;
    });
    const created = await this.findById(userId);
    if (!created) {
      throw new Error("Failed to load created patient user");
    }
    return created;
  }

  async listPsychologistUsers(): Promise<UserRecord[]> {
    const rows = await this.prisma.users.findMany({
      where: { role: "psychologist" },
      include: userInclude,
    });
    return rows.map((row) => mapPrismaUser(row));
  }

  async createPsychologistUser(input: CreatePsychologistUserInput): Promise<UserRecord> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const id = await this.prisma.$transaction(async (tx) => {
      const userId = `user_psychologist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();
      await tx.users.create({
        data: {
          user_id: userId,
          email: normalizedEmail,
          display_name: input.displayName.trim(),
          role: "psychologist",
          password: input.passwordHash,
          account_onboarding_complete: true,
          created_at: now,
          updated_at: now,
        },
      });
      await tx.psychologist_profiles.create({
        data: {
          user_id: userId,
          registration_number: input.registrationNumber.trim(),
          provider_number: input.providerNumber.trim(),
          specialties: input.specialties.map((item) => item.trim()).filter(Boolean),
          status: input.status,
          updated_at: now,
        },
      });
      return userId;
    });
    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to load created psychologist user");
    }
    created.psychologistAdminProfile = created.psychologistAdminProfile ?? emptyPsychologistAdminProfile();
    return created;
  }

  async updatePsychologistUser(id: string, input: UpdatePsychologistUserInput): Promise<UserRecord | null> {
    const existing = await this.findById(id);
    if (!existing || existing.role !== "psychologist") {
      return null;
    }
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: id },
      data: { display_name: input.displayName.trim(), updated_at: now },
    });
    await this.prisma.psychologist_profiles.upsert({
      where: { user_id: id },
      create: {
        user_id: id,
        registration_number: input.registrationNumber.trim(),
        provider_number: input.providerNumber.trim(),
        specialties: input.specialties.map((item) => item.trim()).filter(Boolean),
        status: input.status,
        updated_at: now,
      },
      update: {
        registration_number: input.registrationNumber.trim(),
        provider_number: input.providerNumber.trim(),
        specialties: input.specialties.map((item) => item.trim()).filter(Boolean),
        status: input.status,
        updated_at: now,
      },
    });
    const updated = await this.findById(id);
    if (!updated) {
      return null;
    }
    updated.psychologistAdminProfile = updated.psychologistAdminProfile ?? emptyPsychologistAdminProfile();
    return updated;
  }

  async softDeletePatient(input: PatientSoftDeleteInput): Promise<PatientRetentionState | null> {
    const user = await this.findById(input.patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    const now = new Date().toISOString();
    const lastInteractionAt = await this.resolvePatientLastInteractionAt(input.patientId, now);
    const retentionUntil = this.computeRetentionUntil(lastInteractionAt);
    await this.prisma.users.update({
      where: { user_id: input.patientId },
      data: {
        deleted_at: new Date(now),
        deletion_reason: input.reason.trim(),
        deleted_by_user_id: input.actorUserId,
        retention_until: new Date(retentionUntil),
        last_interaction_at: new Date(lastInteractionAt),
        updated_at: new Date(now),
      },
    });
    return await this.getPatientRetentionState(input.patientId);
  }

  async restorePatient(patientId: string): Promise<PatientRetentionState | null> {
    const user = await this.findById(patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: patientId },
      data: {
        deleted_at: null,
        deletion_reason: null,
        deleted_by_user_id: null,
        purged_at: null,
        updated_at: now,
      },
    });
    return await this.getPatientRetentionState(patientId);
  }

  async setPatientLegalHold(input: PatientLegalHoldInput): Promise<PatientRetentionState | null> {
    const user = await this.findById(input.patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: input.patientId },
      data: {
        legal_hold_active: true,
        legal_hold_reason: input.reason.trim(),
        legal_hold_set_by_user_id: input.actorUserId,
        legal_hold_set_at: now,
        updated_at: now,
      },
    });
    return await this.getPatientRetentionState(input.patientId);
  }

  async clearPatientLegalHold(patientId: string): Promise<PatientRetentionState | null> {
    const user = await this.findById(patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: patientId },
      data: {
        legal_hold_active: false,
        legal_hold_reason: null,
        legal_hold_set_by_user_id: null,
        legal_hold_set_at: null,
        updated_at: now,
      },
    });
    return await this.getPatientRetentionState(patientId);
  }

  async getPatientRetentionState(patientId: string): Promise<PatientRetentionState | null> {
    const user = await this.findById(patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    return user.patientRetention ?? emptyPatientRetentionState();
  }

  async listPurgeEligiblePatients(nowIso: string): Promise<Array<{ patientId: string; retention: PatientRetentionState }>> {
    const rows = await this.prisma.users.findMany({
      where: {
        role: "patient",
        deleted_at: { not: null },
        purged_at: null,
        legal_hold_active: false,
        retention_until: { lte: new Date(nowIso) },
      },
      select: { user_id: true },
    });
    const out: Array<{ patientId: string; retention: PatientRetentionState }> = [];
    for (const row of rows) {
      const retention = await this.getPatientRetentionState(row.user_id);
      if (retention) {
        out.push({ patientId: row.user_id, retention });
      }
    }
    return out;
  }

  async markPatientPurged(patientId: string): Promise<PatientRetentionState | null> {
    const user = await this.findById(patientId);
    if (!user || user.role !== "patient") {
      return null;
    }
    const now = new Date();
    await this.prisma.users.update({
      where: { user_id: patientId },
      data: { purged_at: now, updated_at: now },
    });
    return await this.getPatientRetentionState(patientId);
  }

  async mergeCommittedIntakeIntoProfile(patientId: string, intakeData: Record<string, unknown>): Promise<void> {
    const patch = intakeDraftDataToProfileMerge(intakeData);
    if (!patch) {
      return;
    }
    const user = await this.findById(patientId);
    if (!user || user.role !== "patient") {
      return;
    }
    await this.updateProfile(patientId, {
      displayName: patch.displayName ?? user.displayName,
      patientContactProfile: patch.patientContactProfile,
    });
  }

  private async resolvePatientLastInteractionAt(patientId: string, fallbackIso: string): Promise<string> {
    const epoch = new Date("1970-01-01T00:00:00.000Z").getTime();
    const [apptAgg, bookingAgg, userRow] = await Promise.all([
      this.prisma.appointments.aggregate({
        where: { patient_id: patientId },
        _max: { scheduled_end_at: true },
      }),
      this.prisma.booking_requests.aggregate({
        where: { patient_id: patientId },
        _max: { updated_at: true },
      }),
      this.prisma.users.findUnique({
        where: { user_id: patientId },
        select: { created_at: true },
      }),
    ]);
    const t1 = apptAgg._max.scheduled_end_at?.getTime() ?? epoch;
    const t2 = bookingAgg._max.updated_at?.getTime() ?? epoch;
    const t3 = userRow?.created_at.getTime() ?? epoch;
    const maxMs = Math.max(t1, t2, t3);
    return new Date(maxMs).toISOString();
  }

  private computeRetentionUntil(lastInteractionAt: string): string {
    const sevenYearsMs = 7 * 365 * 24 * 60 * 60 * 1000;
    return new Date(new Date(lastInteractionAt).getTime() + sevenYearsMs).toISOString();
  }
}
