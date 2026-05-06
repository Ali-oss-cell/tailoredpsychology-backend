"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersStubRepository = void 0;
const common_1 = require("@nestjs/common");
const intake_profile_merge_util_1 = require("./intake-profile-merge.util");
const patient_contact_profile_type_1 = require("./types/patient-contact-profile.type");
const patient_retention_state_type_1 = require("./types/patient-retention-state.type");
const psychologist_admin_profile_type_1 = require("./types/psychologist-admin-profile.type");
const MOCK_USERS = [
    {
        id: "user_patient_001",
        email: "patient@clink.test",
        displayName: "Patient Demo",
        role: "patient",
        password: "$argon2id$v=19$m=19456,t=2,p=1$SAnCqXx//k8DBFUjbtMAbQ$kxTakLr/H8P4TzdT33/ylXKNmojL7jUvVenA4SJuS4Q",
        accountOnboardingComplete: true,
        patientContactProfile: {
            phoneMobile: "+61 400 000 000",
            preferredContactMethod: "email",
            accessibilityNotes: "",
            emergencyContactName: "Jamie Chen",
            emergencyContactPhone: "+61 400 000 001",
            emergencyContactRelationship: "Partner",
        },
        patientRetention: (0, patient_retention_state_type_1.emptyPatientRetentionState)(),
    },
    {
        id: "user_psychologist_001",
        email: "psychologist@clink.test",
        displayName: "Psychologist Demo",
        role: "psychologist",
        password: "$argon2id$v=19$m=19456,t=2,p=1$OLypc/hC+/QU3O/QcpDvCg$O0Ca5AP+G8KQ1z7x4lFzfaBRGZPCF+k7YmGTe4rXTLM",
        accountOnboardingComplete: true,
        psychologistAdminProfile: {
            registrationNumber: "PSY-AHPRA-001",
            providerNumber: "PRV-100001",
            specialties: ["anxiety", "stress"],
            status: "active",
        },
    },
    {
        id: "user_psychologist_002",
        email: "psychologist2@clink.test",
        displayName: "Psychologist Two Demo",
        role: "psychologist",
        password: "$argon2id$v=19$m=19456,t=2,p=1$OLypc/hC+/QU3O/QcpDvCg$O0Ca5AP+G8KQ1z7x4lFzfaBRGZPCF+k7YmGTe4rXTLM",
        accountOnboardingComplete: true,
        psychologistAdminProfile: {
            registrationNumber: "PSY-AHPRA-002",
            providerNumber: "PRV-100002",
            specialties: ["depression"],
            status: "active",
        },
    },
    {
        id: "user_patient_002",
        email: "patient2@clink.test",
        displayName: "Patient Two Demo",
        role: "patient",
        password: "$argon2id$v=19$m=19456,t=2,p=1$NoxgV7oyri7dMPWSkOC9EA$6bldXm4Ifppti/hGPtFWIP5WrMV1s6Lw7VUz2WM4w20",
        accountOnboardingComplete: true,
        patientContactProfile: (0, patient_contact_profile_type_1.emptyPatientContactProfile)(),
        patientRetention: (0, patient_retention_state_type_1.emptyPatientRetentionState)(),
    },
    {
        id: "user_manager_001",
        email: "manager@clink.test",
        displayName: "Practice Manager Demo",
        role: "practice_manager",
        password: "$argon2id$v=19$m=19456,t=2,p=1$qpjuJy+QuAk7/4AnQY4pLQ$Epi7GRCpXav3lxNg9/RMMtal7plwq6upBy0Ct83c2YM",
        accountOnboardingComplete: true,
    },
    {
        id: "user_admin_001",
        email: "admin@clink.test",
        displayName: "Admin Demo",
        role: "admin",
        password: "$argon2id$v=19$m=19456,t=2,p=1$OXkJN5Y18gSO+ggmYG85yQ$u5PIeWNI4nBBgv1gltew4MYy5lburJ7ZEpQy+D1beYs",
        accountOnboardingComplete: true,
    },
];
let UsersStubRepository = class UsersStubRepository {
    patientCounter = 1000;
    psychologistCounter = 1000;
    async findByEmail(email) {
        const user = MOCK_USERS.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
        return user ?? null;
    }
    async findById(id) {
        const user = MOCK_USERS.find((candidate) => candidate.id === id);
        return user ?? null;
    }
    async updateDisplayName(id, displayName) {
        await this.updateProfile(id, { displayName });
    }
    async updateProfile(id, input) {
        const user = MOCK_USERS.find((candidate) => candidate.id === id);
        if (!user) {
            return;
        }
        user.displayName = input.displayName;
        if (user.role !== "patient") {
            return;
        }
        const base = user.patientContactProfile ?? (0, patient_contact_profile_type_1.emptyPatientContactProfile)();
        const patch = input.patientContactProfile;
        if (!patch) {
            user.patientContactProfile = base;
            return;
        }
        user.patientContactProfile = {
            phoneMobile: patch.phoneMobile !== undefined ? patch.phoneMobile : base.phoneMobile,
            preferredContactMethod: patch.preferredContactMethod !== undefined ? patch.preferredContactMethod : base.preferredContactMethod,
            accessibilityNotes: patch.accessibilityNotes !== undefined ? patch.accessibilityNotes : base.accessibilityNotes,
            emergencyContactName: patch.emergencyContactName !== undefined ? patch.emergencyContactName : base.emergencyContactName,
            emergencyContactPhone: patch.emergencyContactPhone !== undefined ? patch.emergencyContactPhone : base.emergencyContactPhone,
            emergencyContactRelationship: patch.emergencyContactRelationship !== undefined
                ? patch.emergencyContactRelationship
                : base.emergencyContactRelationship,
        };
    }
    async updatePassword(id, password) {
        const user = MOCK_USERS.find((candidate) => candidate.id === id);
        if (!user) {
            return;
        }
        user.password = password;
    }
    async markAccountOnboardingComplete(id) {
        const user = MOCK_USERS.find((candidate) => candidate.id === id);
        if (!user) {
            return;
        }
        user.accountOnboardingComplete = true;
    }
    async createPatientUser(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const next = {
            id: `user_patient_${`${this.patientCounter++}`.padStart(3, "0")}`,
            email: normalizedEmail,
            displayName: input.displayName.trim(),
            role: "patient",
            password: input.password,
            accountOnboardingComplete: false,
            patientContactProfile: (0, patient_contact_profile_type_1.emptyPatientContactProfile)(),
            patientRetention: (0, patient_retention_state_type_1.emptyPatientRetentionState)(),
        };
        MOCK_USERS.push(next);
        return next;
    }
    async listPsychologistUsers() {
        return MOCK_USERS.filter((candidate) => candidate.role === "psychologist").map((candidate) => ({
            ...candidate,
            psychologistAdminProfile: candidate.psychologistAdminProfile ?? (0, psychologist_admin_profile_type_1.emptyPsychologistAdminProfile)(),
        }));
    }
    async createPsychologistUser(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const next = {
            id: `user_psychologist_${`${this.psychologistCounter++}`.padStart(3, "0")}`,
            email: normalizedEmail,
            displayName: input.displayName.trim(),
            role: "psychologist",
            password: input.passwordHash,
            accountOnboardingComplete: true,
            psychologistAdminProfile: {
                registrationNumber: input.registrationNumber.trim(),
                providerNumber: input.providerNumber.trim(),
                specialties: input.specialties.map((item) => item.trim()).filter(Boolean),
                status: input.status,
            },
        };
        MOCK_USERS.push(next);
        return next;
    }
    async updatePsychologistUser(id, input) {
        const user = MOCK_USERS.find((candidate) => candidate.id === id && candidate.role === "psychologist");
        if (!user) {
            return null;
        }
        user.displayName = input.displayName.trim();
        user.psychologistAdminProfile = {
            registrationNumber: input.registrationNumber.trim(),
            providerNumber: input.providerNumber.trim(),
            specialties: input.specialties.map((item) => item.trim()).filter(Boolean),
            status: input.status,
        };
        return user;
    }
    async softDeletePatient(input) {
        const user = MOCK_USERS.find((candidate) => candidate.id === input.patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        const now = new Date().toISOString();
        const base = user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
        const retentionUntil = this.computeRetentionUntil(user.id, now);
        user.patientRetention = {
            ...base,
            deletedAt: now,
            deletionReason: input.reason.trim(),
            deletedByUserId: input.actorUserId,
            retentionUntil,
            lastInteractionAt: base.lastInteractionAt ?? now,
        };
        return user.patientRetention;
    }
    async restorePatient(patientId) {
        const user = MOCK_USERS.find((candidate) => candidate.id === patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        const base = user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
        user.patientRetention = {
            ...base,
            deletedAt: null,
            deletionReason: null,
            deletedByUserId: null,
            purgedAt: null,
        };
        return user.patientRetention;
    }
    async setPatientLegalHold(input) {
        const user = MOCK_USERS.find((candidate) => candidate.id === input.patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        const now = new Date().toISOString();
        const base = user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
        user.patientRetention = {
            ...base,
            legalHoldActive: true,
            legalHoldReason: input.reason.trim(),
            legalHoldSetByUserId: input.actorUserId,
            legalHoldSetAt: now,
        };
        return user.patientRetention;
    }
    async clearPatientLegalHold(patientId) {
        const user = MOCK_USERS.find((candidate) => candidate.id === patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        const base = user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
        user.patientRetention = {
            ...base,
            legalHoldActive: false,
            legalHoldReason: null,
            legalHoldSetByUserId: null,
            legalHoldSetAt: null,
        };
        return user.patientRetention;
    }
    async getPatientRetentionState(patientId) {
        const user = MOCK_USERS.find((candidate) => candidate.id === patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        return user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
    }
    async listPurgeEligiblePatients(nowIso) {
        const nowMs = new Date(nowIso).getTime();
        return MOCK_USERS.filter((candidate) => candidate.role === "patient")
            .map((candidate) => ({ patientId: candidate.id, retention: candidate.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)() }))
            .filter(({ retention }) => {
            if (!retention.deletedAt || retention.legalHoldActive || !retention.retentionUntil || retention.purgedAt) {
                return false;
            }
            return new Date(retention.retentionUntil).getTime() <= nowMs;
        });
    }
    async markPatientPurged(patientId) {
        const user = MOCK_USERS.find((candidate) => candidate.id === patientId && candidate.role === "patient");
        if (!user) {
            return null;
        }
        const base = user.patientRetention ?? (0, patient_retention_state_type_1.emptyPatientRetentionState)();
        user.patientRetention = {
            ...base,
            purgedAt: new Date().toISOString(),
        };
        return user.patientRetention;
    }
    async mergeCommittedIntakeIntoProfile(patientId, intakeData) {
        const patch = (0, intake_profile_merge_util_1.intakeDraftDataToProfileMerge)(intakeData);
        if (!patch) {
            return;
        }
        const user = MOCK_USERS.find((candidate) => candidate.id === patientId);
        if (!user || user.role !== "patient") {
            return;
        }
        await this.updateProfile(patientId, {
            displayName: patch.displayName ?? user.displayName,
            patientContactProfile: patch.patientContactProfile,
        });
    }
    computeRetentionUntil(patientId, fallbackIso) {
        const sevenYearsMs = 7 * 365 * 24 * 60 * 60 * 1000;
        const lastInteraction = MOCK_USERS.find((candidate) => candidate.id === patientId)?.patientRetention?.lastInteractionAt ?? fallbackIso;
        return new Date(new Date(lastInteraction).getTime() + sevenYearsMs).toISOString();
    }
};
exports.UsersStubRepository = UsersStubRepository;
exports.UsersStubRepository = UsersStubRepository = __decorate([
    (0, common_1.Injectable)()
], UsersStubRepository);
//# sourceMappingURL=users.stub-repository.js.map