"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const password_crypto_util_1 = require("../src/modules/auth/password-crypto.util");
const prisma = new client_1.PrismaClient();
function envOrDefault(name, fallback) {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : fallback;
}
function loadSeeds() {
    return [
        {
            key: "patient",
            role: "patient",
            userId: envOrDefault("QA_PATIENT_USER_ID", "qa_user_patient_001"),
            email: envOrDefault("QA_PATIENT_EMAIL", "qa.patient@tailoredpsychology.com.au").toLowerCase(),
            displayName: envOrDefault("QA_PATIENT_NAME", "QA Patient"),
            password: envOrDefault("QA_PATIENT_PASSWORD", "QaPatient123!"),
            onboardingComplete: true,
        },
        {
            key: "psychologist",
            role: "psychologist",
            userId: envOrDefault("QA_PSYCHOLOGIST_USER_ID", "qa_user_psychologist_001"),
            email: envOrDefault("QA_PSYCHOLOGIST_EMAIL", "qa.psychologist@tailoredpsychology.com.au").toLowerCase(),
            displayName: envOrDefault("QA_PSYCHOLOGIST_NAME", "QA Psychologist"),
            password: envOrDefault("QA_PSYCHOLOGIST_PASSWORD", "QaPsych123!"),
            onboardingComplete: true,
        },
        {
            key: "practice_manager",
            role: "practice_manager",
            userId: envOrDefault("QA_MANAGER_USER_ID", "qa_user_manager_001"),
            email: envOrDefault("QA_MANAGER_EMAIL", "qa.manager@tailoredpsychology.com.au").toLowerCase(),
            displayName: envOrDefault("QA_MANAGER_NAME", "QA Practice Manager"),
            password: envOrDefault("QA_MANAGER_PASSWORD", "QaManager123!"),
            onboardingComplete: true,
        },
        {
            key: "admin",
            role: "admin",
            userId: envOrDefault("QA_ADMIN_USER_ID", "qa_user_admin_001"),
            email: envOrDefault("QA_ADMIN_EMAIL", "qa.admin@tailoredpsychology.com.au").toLowerCase(),
            displayName: envOrDefault("QA_ADMIN_NAME", "QA Admin"),
            password: envOrDefault("QA_ADMIN_PASSWORD", "QaAdmin123!"),
            onboardingComplete: true,
        },
    ];
}
async function ensureRoleProfile(seed) {
    if (seed.role === "patient") {
        await prisma.patient_profiles.upsert({
            where: { user_id: seed.userId },
            create: {
                user_id: seed.userId,
            },
            update: {
                updated_at: new Date(),
            },
        });
        return;
    }
    if (seed.role === "psychologist") {
        await prisma.psychologist_profiles.upsert({
            where: { user_id: seed.userId },
            create: {
                user_id: seed.userId,
                registration_number: envOrDefault("QA_PSYCHOLOGIST_REG", "QA-REG-001"),
                provider_number: envOrDefault("QA_PSYCHOLOGIST_PROVIDER", "QA-PROVIDER-001"),
                specialties: ["qa-testing"],
                status: "active",
            },
            update: {
                status: "active",
                updated_at: new Date(),
            },
        });
    }
}
async function upsertSeed(seed) {
    const passwordHash = await (0, password_crypto_util_1.hashPassword)(seed.password);
    await prisma.users.upsert({
        where: { user_id: seed.userId },
        create: {
            user_id: seed.userId,
            email: seed.email,
            display_name: seed.displayName,
            role: seed.role,
            password: passwordHash,
            account_onboarding_complete: seed.onboardingComplete,
            updated_at: new Date(),
        },
        update: {
            email: seed.email,
            display_name: seed.displayName,
            role: seed.role,
            password: passwordHash,
            account_onboarding_complete: seed.onboardingComplete,
            updated_at: new Date(),
            deleted_at: null,
            deletion_reason: null,
            deleted_by_user_id: null,
            legal_hold_active: false,
            legal_hold_reason: null,
            legal_hold_set_by_user_id: null,
            legal_hold_set_at: null,
            retention_until: null,
            purged_at: null,
        },
    });
    await ensureRoleProfile(seed);
}
async function main() {
    const seeds = loadSeeds();
    for (const seed of seeds) {
        await upsertSeed(seed);
    }
    console.log("Seeded/updated QA users:");
    for (const seed of seeds) {
        console.log(`- ${seed.role}: ${seed.email}`);
    }
}
void main()
    .catch((error) => {
    console.error("Failed seeding staging QA users.", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-staging-qa-users.js.map