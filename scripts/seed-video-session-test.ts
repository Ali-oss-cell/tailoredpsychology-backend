import { PrismaClient } from "@prisma/client";

import { CURRENT_CONSENT_POLICY_VERSION } from "../src/modules/auth/consent-lifecycle.service";
import { hashPassword } from "../src/modules/auth/password-crypto.util";

const prisma = new PrismaClient();

const PATIENT_ID = process.env.VIDEO_TEST_PATIENT_ID?.trim() || "user_patient_098";
const PSYCH_ID = process.env.VIDEO_TEST_PSYCH_ID?.trim() || "user_psychologist_098";
const CLINICIAN_ID = process.env.VIDEO_TEST_CLINICIAN_ID?.trim() || "clinician_098";
const APPOINTMENT_ID = process.env.VIDEO_TEST_APPOINTMENT_ID?.trim() || "appt_video_test";
const PATIENT_EMAIL = (process.env.VIDEO_TEST_PATIENT_EMAIL?.trim() || "video.patient@clink.test").toLowerCase();
const PSYCH_EMAIL = (process.env.VIDEO_TEST_PSYCH_EMAIL?.trim() || "video.psych@clink.test").toLowerCase();
const PASSWORD = process.env.VIDEO_TEST_PASSWORD?.trim() || "VideoTest123!";
const START_IN_MINUTES = Number(process.env.VIDEO_TEST_START_MINUTES ?? "3");
const SESSION_MINUTES = Number(process.env.VIDEO_TEST_SESSION_MINUTES ?? "50");
const WEB_BASE = process.env.PUBLIC_APP_URL?.trim() || process.env.WEB_BASE?.trim() || "https://tailoredpsychology.com.au";

const readinessChecks = [
  { key: "camera", status: "pass", message: "Camera check passed (seeded for QA)." },
  { key: "microphone", status: "pass", message: "Microphone check passed (seeded for QA)." },
  { key: "network", status: "pass", message: "Network check passed (seeded for QA)." },
  { key: "session_window", status: "pass", message: "Session window is open." },
] as const;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney" });
}

async function upsertUser(params: {
  userId: string;
  email: string;
  displayName: string;
  role: "patient" | "psychologist";
  passwordHash: string;
}): Promise<void> {
  const now = new Date();
  await prisma.users.upsert({
    where: { user_id: params.userId },
    create: {
      user_id: params.userId,
      email: params.email,
      display_name: params.displayName,
      role: params.role,
      password: params.passwordHash,
      account_onboarding_complete: true,
      created_at: now,
      updated_at: now,
    },
    update: {
      email: params.email,
      display_name: params.displayName,
      role: params.role,
      password: params.passwordHash,
      account_onboarding_complete: true,
      updated_at: now,
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
}

async function seedProfiles(now: Date): Promise<void> {
  await prisma.patient_profiles.upsert({
    where: { user_id: PATIENT_ID },
    create: {
      user_id: PATIENT_ID,
      phone_mobile: "+61 400 000 098",
      preferred_contact_method: "email",
      emergency_contact_name: "Video Test Contact",
      emergency_contact_phone: "+61 400 000 099",
      emergency_contact_relationship: "Partner",
      date_of_birth: "1992-06-15",
      state: "NSW",
      suburb: "Sydney",
      updated_at: now,
    },
    update: { updated_at: now },
  });

  await prisma.psychologist_profiles.upsert({
    where: { user_id: PSYCH_ID },
    create: {
      user_id: PSYCH_ID,
      registration_number: "PSY-VIDEO-TEST-098",
      provider_number: "PRV-VIDEO-098",
      specialties: ["video-testing", "telehealth"],
      status: "active",
      updated_at: now,
    },
    update: {
      status: "active",
      updated_at: now,
    },
  });
}

async function seedIntakeAndConsent(now: Date): Promise<void> {
  await prisma.intake_drafts.upsert({
    where: { patient_id: PATIENT_ID },
    create: {
      patient_id: PATIENT_ID,
      draft_version: 1,
      data: {
        patientIdentity: {
          fullName: "Video Test Patient",
          dateOfBirth: "1992-06-15",
          mobile: "+61 400 000 098",
          email: PATIENT_EMAIL,
          suburb: "Sydney",
          state: "NSW",
          preferredContactMethod: "email",
        },
        consents: {
          privacyAccepted: true,
          telehealthAccepted: true,
          treatmentAccepted: true,
        },
      },
      updated_at: now,
      committed_at: now,
    },
    update: {
      draft_version: { increment: 1 },
      updated_at: now,
      committed_at: now,
    },
  });

  await prisma.patient_consents.upsert({
    where: { consent_id: "consent_video_test_098" },
    create: {
      consent_id: "consent_video_test_098",
      user_id: PATIENT_ID,
      policy_version: CURRENT_CONSENT_POLICY_VERSION,
      accepted_at: now,
    },
    update: {
      policy_version: CURRENT_CONSENT_POLICY_VERSION,
      accepted_at: now,
      withdrawn_at: null,
      withdrawal_reason: null,
    },
  });
}

async function seedAppointment(now: Date): Promise<{
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  chatWindowOpenAt: Date;
  chatWindowCloseAt: Date;
}> {
  const scheduledStartAt = new Date(now.getTime() + START_IN_MINUTES * 60 * 1000);
  const scheduledEndAt = new Date(scheduledStartAt.getTime() + SESSION_MINUTES * 60 * 1000);
  const chatWindowOpenAt = new Date(scheduledStartAt.getTime() - 30 * 60 * 1000);
  const chatWindowCloseAt = scheduledEndAt;

  await prisma.appointments.upsert({
    where: { appointment_id: APPOINTMENT_ID },
    create: {
      appointment_id: APPOINTMENT_ID,
      patient_id: PATIENT_ID,
      clinician_id: CLINICIAN_ID,
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt,
      status: "scheduled",
      chat_window_open_at: chatWindowOpenAt,
      chat_window_close_at: chatWindowCloseAt,
    },
    update: {
      patient_id: PATIENT_ID,
      clinician_id: CLINICIAN_ID,
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt,
      status: "scheduled",
      chat_window_open_at: chatWindowOpenAt,
      chat_window_close_at: chatWindowCloseAt,
    },
  });

  return { scheduledStartAt, scheduledEndAt, chatWindowOpenAt, chatWindowCloseAt };
}

async function seedReadiness(now: Date): Promise<void> {
  const payload = {
    overall_status: "ready",
    checks: readinessChecks,
    updated_at: now,
  };

  for (const userId of [PATIENT_ID, PSYCH_ID]) {
    await prisma.telehealth_readiness.upsert({
      where: {
        appointment_id_user_id: {
          appointment_id: APPOINTMENT_ID,
          user_id: userId,
        },
      },
      create: {
        appointment_id: APPOINTMENT_ID,
        user_id: userId,
        ...payload,
      },
      update: payload,
    });
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const now = new Date();
  const passwordHash = await hashPassword(PASSWORD);

  await upsertUser({
    userId: PATIENT_ID,
    email: PATIENT_EMAIL,
    displayName: "Video Test Patient",
    role: "patient",
    passwordHash,
  });
  await upsertUser({
    userId: PSYCH_ID,
    email: PSYCH_EMAIL,
    displayName: "Dr Video Test Psych",
    role: "psychologist",
    passwordHash,
  });

  await seedProfiles(now);
  await seedIntakeAndConsent(now);
  const times = await seedAppointment(now);
  await seedReadiness(now);

  const patientVideoUrl = `${WEB_BASE.replace(/\/$/, "")}/video-session/${APPOINTMENT_ID}`;
  const psychVideoUrl = patientVideoUrl;
  const patientLoginUrl = `${WEB_BASE.replace(/\/$/, "")}/login`;
  const psychLoginUrl = patientLoginUrl;

  console.log("");
  console.log("=== Video session test users ready ===");
  console.log("");
  console.log("Patient");
  console.log(`  Email:    ${PATIENT_EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Login:    ${patientLoginUrl}`);
  console.log(`  Session:  ${patientVideoUrl}`);
  console.log("");
  console.log("Psychologist");
  console.log(`  Email:    ${PSYCH_EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Login:    ${psychLoginUrl}`);
  console.log(`  Session:  ${psychVideoUrl}`);
  console.log("");
  console.log("Appointment");
  console.log(`  ID:       ${APPOINTMENT_ID}`);
  console.log(`  Clinician:${CLINICIAN_ID} (maps to ${PSYCH_ID})`);
  console.log(`  Starts:   ${fmt(times.scheduledStartAt.toISOString())} (in ~${START_IN_MINUTES} min)`);
  console.log(`  Ends:     ${fmt(times.scheduledEndAt.toISOString())}`);
  console.log(`  Join window open now until end (${fmt(times.chatWindowOpenAt.toISOString())} → ${fmt(times.chatWindowCloseAt.toISOString())})`);
  console.log("");
  console.log("Re-run this script anytime to reset the appointment to start again in 3 minutes.");
  console.log("");
}

void main()
  .catch((error) => {
    console.error("Failed seeding video session test data.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
