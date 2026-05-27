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
exports.UsersPgRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const intake_profile_merge_util_1 = require("./intake-profile-merge.util");
const patient_contact_profile_type_1 = require("./types/patient-contact-profile.type");
const patient_demographics_type_1 = require("./types/patient-demographics.type");
const patient_retention_state_type_1 = require("./types/patient-retention-state.type");
const psychologist_admin_profile_type_1 = require("./types/psychologist-admin-profile.type");
const user_role_type_1 = require("./types/user-role.type");
function parseRole(role) {
    if (user_role_type_1.USER_ROLES.includes(role)) {
        return role;
    }
    return "patient";
}
function iso(d) {
    return d ? d.toISOString() : null;
}
const userInclude = client_1.Prisma.validator()({
    patient_profiles: true,
    psychologist_profiles: true,
});
function mapPrismaUser(row) {
    const role = parseRole(row.role);
    const base = {
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
            preferredContactMethod: p?.preferred_contact_method === "sms" || p?.preferred_contact_method === "phone"
                ? p.preferred_contact_method
                : "email",
            accessibilityNotes: p?.accessibility_notes ?? "",
            emergencyContactName: p?.emergency_contact_name ?? "",
            emergencyContactPhone: p?.emergency_contact_phone ?? "",
            emergencyContactRelationship: p?.emergency_contact_relationship ?? "",
        };
        base.patientDemographics = {
            dateOfBirth: p?.date_of_birth ?? "",
            indigenousStatus: p?.indigenous_status ?? "",
            state: p?.state ?? "",
            suburb: p?.suburb ?? "",
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
let UsersPgRepository = class UsersPgRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        const u = await this.prisma.users.findFirst({
            where: { email: { equals: email.trim(), mode: "insensitive" } },
            include: userInclude,
        });
        return u ? mapPrismaUser(u) : null;
    }
    async findById(id) {
        const u = await this.prisma.users.findUnique({
            where: { user_id: id },
            include: userInclude,
        });
        return u ? mapPrismaUser(u) : null;
    }
    async updateDisplayName(id, displayName) {
        await this.updateProfile(id, { displayName });
    }
    async updateProfile(id, input) {
        const now = new Date();
        await this.prisma.users.update({
            where: { user_id: id },
            data: { display_name: input.displayName, updated_at: now },
        });
        const user = await this.findById(id);
        if (!user || user.role !== "patient") {
            return;
        }
        const contactPatch = input.patientContactProfile;
        const demographicsPatch = input.patientDemographics;
        if (!contactPatch && !demographicsPatch) {
            return;
        }
        const mergedContact = {
            ...(0, patient_contact_profile_type_1.emptyPatientContactProfile)(),
            ...(user.patientContactProfile ?? {}),
            ...(contactPatch ?? {}),
        };
        const mergedDemographics = {
            ...(0, patient_demographics_type_1.emptyPatientDemographics)(),
            ...(user.patientDemographics ?? {}),
            ...(demographicsPatch ?? {}),
        };
        await this.prisma.patient_profiles.upsert({
            where: { user_id: id },
            create: {
                user_id: id,
                phone_mobile: mergedContact.phoneMobile,
                preferred_contact_method: mergedContact.preferredContactMethod,
                accessibility_notes: mergedContact.accessibilityNotes,
                emergency_contact_name: mergedContact.emergencyContactName,
                emergency_contact_phone: mergedContact.emergencyContactPhone,
                emergency_contact_relationship: mergedContact.emergencyContactRelationship,
                date_of_birth: mergedDemographics.dateOfBirth,
                indigenous_status: mergedDemographics.indigenousStatus,
                state: mergedDemographics.state,
                suburb: mergedDemographics.suburb,
                updated_at: now,
            },
            update: {
                phone_mobile: mergedContact.phoneMobile,
                preferred_contact_method: mergedContact.preferredContactMethod,
                accessibility_notes: mergedContact.accessibilityNotes,
                emergency_contact_name: mergedContact.emergencyContactName,
                emergency_contact_phone: mergedContact.emergencyContactPhone,
                emergency_contact_relationship: mergedContact.emergencyContactRelationship,
                date_of_birth: mergedDemographics.dateOfBirth,
                indigenous_status: mergedDemographics.indigenousStatus,
                state: mergedDemographics.state,
                suburb: mergedDemographics.suburb,
                updated_at: now,
            },
        });
    }
    async updatePassword(id, password) {
        const now = new Date();
        await this.prisma.users.update({
            where: { user_id: id },
            data: { password, updated_at: now },
        });
    }
    async markAccountOnboardingComplete(id) {
        const now = new Date();
        await this.prisma.users.update({
            where: { user_id: id },
            data: { account_onboarding_complete: true, updated_at: now },
        });
    }
    async createPatientUser(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const userId = await this.prisma.$transaction(async (tx) => {
            // Only numeric suffixes (user_patient_001). Alphanumeric demo IDs (e.g. user_patient_a_002) must not break MAX(cast(...)).
            const rows = await tx.$queryRawUnsafe(`select coalesce(max((regexp_match(user_id, '^user_patient_([0-9]+)$'))[1]::integer), 999) + 1 as next from users where user_id ~ '^user_patient_[0-9]+$'`);
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
    async listPsychologistUsers() {
        const rows = await this.prisma.users.findMany({
            where: { role: "psychologist" },
            include: userInclude,
        });
        return rows.map((row) => mapPrismaUser(row));
    }
    async createPsychologistUser(input) {
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
        created.psychologistAdminProfile = created.psychologistAdminProfile ?? (0, psychologist_admin_profile_type_1.emptyPsychologistAdminProfile)();
        return created;
    }
    async updatePsychologistUser(id, input) {
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
        updated.psychologistAdminProfile = updated.psychologistAdminProfile ?? (0, psychologist_admin_profile_type_1.emptyPsychologistAdminProfile)();
        return updated;
    }
    async softDeletePatient(input) {
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
    async restorePatient(patientId) {
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
    async setPatientLegalHold(input) {
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
    async clearPatientLegalHold(patientId) {
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
    async getPatientRetentionState(patientId) {
        const user = await this.findById(patientId);
        if (!user || user.role !== "patient") {
            return null;
        }
        return user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
    }
    async listPurgeEligiblePatients(nowIso) {
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
        const out = [];
        for (const row of rows) {
            const retention = await this.getPatientRetentionState(row.user_id);
            if (retention) {
                out.push({ patientId: row.user_id, retention });
            }
        }
        return out;
    }
    async markPatientPurged(patientId) {
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
    async mergeCommittedIntakeIntoProfile(patientId, intakeData) {
        const patch = (0, intake_profile_merge_util_1.intakeDraftDataToProfileMerge)(intakeData);
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
            patientDemographics: patch.patientDemographics,
        });
    }
    async resolvePatientLastInteractionAt(patientId, fallbackIso) {
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
    computeRetentionUntil(lastInteractionAt) {
        const sevenYearsMs = 7 * 365 * 24 * 60 * 60 * 1000;
        return new Date(new Date(lastInteractionAt).getTime() + sevenYearsMs).toISOString();
    }
};
exports.UsersPgRepository = UsersPgRepository;
exports.UsersPgRepository = UsersPgRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersPgRepository);
//# sourceMappingURL=users.pg-repository.js.map