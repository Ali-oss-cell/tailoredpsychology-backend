import { Pool } from "pg";
import argon2 from "argon2";

type UserRole = "patient" | "psychologist" | "practice_manager" | "admin";

const ARGON_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const now = new Date();
const iso = (offsetDays = 0): string => new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON_OPTIONS);
}

async function upsertUser(
  pool: Pool,
  params: {
    userId: string;
    email: string;
    displayName: string;
    role: UserRole;
    passwordHash: string;
    accountOnboardingComplete?: boolean;
  },
): Promise<void> {
  await pool.query(
    `insert into users (user_id, email, display_name, role, password, account_onboarding_complete, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, now(), now())
     on conflict (user_id) do update set
       email = excluded.email,
       display_name = excluded.display_name,
       role = excluded.role,
       password = excluded.password,
       account_onboarding_complete = excluded.account_onboarding_complete,
       updated_at = now()`,
    [
      params.userId,
      params.email.toLowerCase(),
      params.displayName,
      params.role,
      params.passwordHash,
      params.accountOnboardingComplete ?? true,
    ],
  );
}

async function upsertPatientProfile(
  pool: Pool,
  patientId: string,
  mobile: string,
  preferred: "email" | "sms" | "phone",
  emergencyName: string,
): Promise<void> {
  await pool.query(
    `insert into patient_profiles (
       user_id, phone_mobile, preferred_contact_method, accessibility_notes,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, updated_at
     ) values ($1, $2, $3, '', $4, '+61 499 000 000', 'Family', now())
     on conflict (user_id) do update set
       phone_mobile = excluded.phone_mobile,
       preferred_contact_method = excluded.preferred_contact_method,
       emergency_contact_name = excluded.emergency_contact_name,
       emergency_contact_phone = excluded.emergency_contact_phone,
       emergency_contact_relationship = excluded.emergency_contact_relationship,
       updated_at = now()`,
    [patientId, mobile, preferred, emergencyName],
  );
}

async function upsertPsychologistProfile(
  pool: Pool,
  psychologistId: string,
  registrationNumber: string,
  providerNumber: string,
  specialties: string[],
  status: "active" | "inactive",
): Promise<void> {
  await pool.query(
    `insert into psychologist_profiles (user_id, registration_number, provider_number, specialties, status, updated_at)
     values ($1, $2, $3, $4::text[], $5, now())
     on conflict (user_id) do update set
       registration_number = excluded.registration_number,
       provider_number = excluded.provider_number,
       specialties = excluded.specialties,
       status = excluded.status,
       updated_at = now()`,
    [psychologistId, registrationNumber, providerNumber, specialties, status],
  );
}

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });

  const adminPassword = await hashPassword("AdminQA123!");
  const managerPassword = await hashPassword("ManagerQA123!");
  const psychPassword = await hashPassword("PsychQA123!");
  const patientPassword = await hashPassword("PatientQA123!");

  await upsertUser(pool, {
    userId: "user_admin_qa_001",
    email: "qa.admin@clink.test",
    displayName: "QA Admin",
    role: "admin",
    passwordHash: adminPassword,
  });
  await upsertUser(pool, {
    userId: "user_manager_qa_001",
    email: "qa.manager@clink.test",
    displayName: "QA Practice Manager",
    role: "practice_manager",
    passwordHash: managerPassword,
  });

  const psychologists = [
    {
      userId: "user_psychologist_qa_001",
      email: "qa.psych1@clink.test",
      displayName: "Dr Alex North",
      registrationNumber: "PSY-AHPRA-QA-001",
      providerNumber: "PRV-QA-001",
      specialties: ["anxiety", "depression", "stress"],
      status: "active" as const,
    },
    {
      userId: "user_psychologist_qa_002",
      email: "qa.psych2@clink.test",
      displayName: "Dr Sam Rivera",
      registrationNumber: "PSY-AHPRA-QA-002",
      providerNumber: "PRV-QA-002",
      specialties: ["trauma", "ptsd", "grief"],
      status: "active" as const,
    },
    {
      userId: "user_psychologist_qa_003",
      email: "qa.psych3@clink.test",
      displayName: "Dr Morgan Lee",
      registrationNumber: "PSY-AHPRA-QA-003",
      providerNumber: "PRV-QA-003",
      specialties: ["adhd", "sleep", "ocd"],
      status: "inactive" as const,
    },
  ];

  for (const psychologist of psychologists) {
    await upsertUser(pool, {
      userId: psychologist.userId,
      email: psychologist.email,
      displayName: psychologist.displayName,
      role: "psychologist",
      passwordHash: psychPassword,
    });
    await upsertPsychologistProfile(
      pool,
      psychologist.userId,
      psychologist.registrationNumber,
      psychologist.providerNumber,
      psychologist.specialties,
      psychologist.status,
    );
  }

  const patients = [
    { userId: "user_patient_qa_001", email: "qa.patient1@clink.test", displayName: "QA Patient Active", preferred: "email" as const },
    { userId: "user_patient_qa_002", email: "qa.patient2@clink.test", displayName: "QA Patient Soft Deleted", preferred: "sms" as const },
    { userId: "user_patient_qa_003", email: "qa.patient3@clink.test", displayName: "QA Patient Legal Hold", preferred: "phone" as const },
    { userId: "user_patient_qa_004", email: "qa.patient4@clink.test", displayName: "QA Patient Purge Pending", preferred: "email" as const },
    { userId: "user_patient_qa_005", email: "qa.patient5@clink.test", displayName: "QA Patient High Risk", preferred: "sms" as const },
    { userId: "user_patient_qa_006", email: "qa.patient6@clink.test", displayName: "QA Patient Corrections", preferred: "email" as const },
  ];

  for (const [index, patient] of patients.entries()) {
    await upsertUser(pool, {
      userId: patient.userId,
      email: patient.email,
      displayName: patient.displayName,
      role: "patient",
      passwordHash: patientPassword,
      accountOnboardingComplete: true,
    });
    await upsertPatientProfile(pool, patient.userId, `+61 400 000 10${index}`, patient.preferred, `Emergency Contact ${index + 1}`);
  }

  await pool.query(
    `update users set
      deleted_at = null,
      deletion_reason = null,
      deleted_by_user_id = null,
      legal_hold_active = false,
      legal_hold_reason = null,
      legal_hold_set_by_user_id = null,
      legal_hold_set_at = null,
      retention_until = null,
      purged_at = null,
      last_interaction_at = null,
      updated_at = now()
     where user_id in ('user_patient_qa_001','user_patient_qa_002','user_patient_qa_003','user_patient_qa_004','user_patient_qa_005','user_patient_qa_006')`,
  );

  await pool.query(
    `update users set
      deleted_at = $2::timestamptz,
      deletion_reason = 'Patient requested account closure for test scenario',
      deleted_by_user_id = 'user_admin_qa_001',
      retention_until = $3::timestamptz,
      last_interaction_at = $2::timestamptz
     where user_id = $1`,
    ["user_patient_qa_002", iso(-30), iso(365 * 7 - 30)],
  );

  await pool.query(
    `update users set
      legal_hold_active = true,
      legal_hold_reason = 'Open complaint workflow test scenario',
      legal_hold_set_by_user_id = 'user_admin_qa_001',
      legal_hold_set_at = $2::timestamptz
     where user_id = $1`,
    ["user_patient_qa_003", iso(-5)],
  );

  await pool.query(
    `update users set
      deleted_at = $2::timestamptz,
      deletion_reason = 'Retention countdown test',
      deleted_by_user_id = 'user_admin_qa_001',
      retention_until = $3::timestamptz,
      last_interaction_at = $2::timestamptz
     where user_id = $1`,
    ["user_patient_qa_004", iso(-(365 * 7 + 2)), iso(-2)],
  );

  await pool.query(
    `insert into patient_data_requests (
      request_id, patient_id, request_type, status, details, requested_correction,
      triage_owner_user_id, resolution_notes, sla_due_at, triaged_at, resolved_at, created_at, updated_at
    ) values
      ('pdr_qa_001', 'user_patient_qa_001', 'access', 'submitted', 'Need complete data export for records', null, null, null, $1::timestamptz, null, null, $2::timestamptz, now()),
      ('pdr_qa_002', 'user_patient_qa_006', 'correction', 'triage_review', 'DOB appears incorrect', 'Correct DOB to 1990-06-02', 'user_manager_qa_001', null, $3::timestamptz, $2::timestamptz, null, $2::timestamptz, now()),
      ('pdr_qa_003', 'user_patient_qa_006', 'correction', 'in_progress', 'Emergency contact phone outdated', 'Update emergency contact number', 'user_admin_qa_001', 'Validation in progress', $3::timestamptz, $2::timestamptz, null, $2::timestamptz, now()),
      ('pdr_qa_004', 'user_patient_qa_005', 'access', 'fulfilled', 'Request completed copy of records', null, 'user_admin_qa_001', 'Delivered encrypted export', $3::timestamptz, $2::timestamptz, $4::timestamptz, $2::timestamptz, now()),
      ('pdr_qa_005', 'user_patient_qa_003', 'correction', 'rejected', 'Request to remove clinical diagnosis', 'Remove diagnosis entry', 'user_admin_qa_001', 'Clinical records cannot be deleted without legal basis', $3::timestamptz, $2::timestamptz, $4::timestamptz, $2::timestamptz, now()),
      ('pdr_qa_006', 'user_patient_qa_002', 'access', 'cancelled', 'No longer required', null, null, 'Patient cancelled request', $3::timestamptz, null, $4::timestamptz, $2::timestamptz, now())
    on conflict (request_id) do update set
      status = excluded.status,
      details = excluded.details,
      requested_correction = excluded.requested_correction,
      triage_owner_user_id = excluded.triage_owner_user_id,
      resolution_notes = excluded.resolution_notes,
      sla_due_at = excluded.sla_due_at,
      triaged_at = excluded.triaged_at,
      resolved_at = excluded.resolved_at,
      updated_at = now()`,
    [iso(14), iso(-3), iso(10), iso(-1)],
  );

  await pool.query(
    `insert into referral_documents (
      document_id, patient_id, status, file_name, file_size, mime_type, source_type, referral_date,
      notes, uploaded_at, due_at, assigned_owner_user_id, reviewed_by, reviewed_at, review_reason, review_notes
    ) values
      ('ref_qa_001', 'user_patient_qa_001', 'received', 'qa-referral-received.pdf', 124000, 'application/pdf', 'gp_mhtp', $1::date, 'New referral uploaded', $2::timestamptz, $3::timestamptz, null, null, null, null, null),
      ('ref_qa_002', 'user_patient_qa_005', 'review_needed', 'qa-referral-review.pdf', 132000, 'application/pdf', 'specialist', $1::date, 'Needs provider verification', $2::timestamptz, $3::timestamptz, 'user_manager_qa_001', null, null, null, null),
      ('ref_qa_003', 'user_patient_qa_006', 'approved', 'qa-referral-approved.pdf', 118000, 'application/pdf', 'gp_mhtp', $1::date, 'Approved for onboarding', $2::timestamptz, $3::timestamptz, 'user_admin_qa_001', 'user_admin_qa_001', $4::timestamptz, 'Valid referral details', 'Move to booking'),
      ('ref_qa_004', 'user_patient_qa_003', 'rejected', 'qa-referral-rejected.pdf', 111000, 'application/pdf', 'manual_upload', $1::date, 'Rejected scenario', $2::timestamptz, $3::timestamptz, 'user_admin_qa_001', 'user_admin_qa_001', $4::timestamptz, 'Missing required fields', 'Request updated referral'),
      ('ref_qa_005', 'user_patient_qa_002', 'info_requested', 'qa-referral-info.pdf', 121000, 'application/pdf', 'gp_mhtp', $1::date, 'Info requested scenario', $2::timestamptz, $3::timestamptz, 'user_manager_qa_001', 'user_manager_qa_001', $4::timestamptz, 'Provider number unreadable', 'Patient asked to re-upload')
    on conflict (document_id) do update set
      status = excluded.status,
      assigned_owner_user_id = excluded.assigned_owner_user_id,
      reviewed_by = excluded.reviewed_by,
      reviewed_at = excluded.reviewed_at,
      review_reason = excluded.review_reason,
      review_notes = excluded.review_notes,
      due_at = excluded.due_at`,
    [iso(-20).slice(0, 10), iso(-8), iso(6), iso(-2)],
  );

  await pool.query(
    `insert into security_incidents (
      incident_id, title, summary, severity, impact, status, ndb_assessment, contains_personal_data,
      assigned_owner_user_id, resolution_notes, detected_at, created_at, updated_at, closed_at
    ) values
      ('sec_qa_001', 'Unauthorized export attempt', 'Multiple denied export attempts detected', 'high', 'moderate', 'reported', 'assessment_in_progress', true, 'user_admin_qa_001', null, $1::timestamptz, now(), now(), null),
      ('sec_qa_002', 'Webhook delivery anomaly', 'Delayed webhook processing observed', 'medium', 'low', 'triage', 'not_required', false, 'user_manager_qa_001', null, $1::timestamptz, now(), now(), null),
      ('sec_qa_003', 'Potential PHI disclosure', 'Third-party email routing misconfiguration', 'critical', 'severe', 'investigating', 'eligible_for_notification', true, 'user_admin_qa_001', 'Containment actions started', $1::timestamptz, now(), now(), null),
      ('sec_qa_004', 'NDB readiness case', 'Incident prepared for formal notification', 'high', 'severe', 'notification_ready', 'notifiable', true, 'user_admin_qa_001', 'Draft notification package prepared', $1::timestamptz, now(), now(), null),
      ('sec_qa_005', 'Closed low-risk event', 'No personal data affected', 'low', 'low', 'closed', 'not_required', false, 'user_manager_qa_001', 'Closed after validation', $1::timestamptz, now(), now(), $2::timestamptz)
    on conflict (incident_id) do update set
      status = excluded.status,
      ndb_assessment = excluded.ndb_assessment,
      assigned_owner_user_id = excluded.assigned_owner_user_id,
      resolution_notes = excluded.resolution_notes,
      updated_at = now(),
      closed_at = excluded.closed_at`,
    [iso(-7), iso(-1)],
  );

  await pool.query(
    `insert into patient_consents (consent_id, user_id, policy_version, accepted_at, withdrawn_at, withdrawal_reason)
     values
      ('consent_qa_001', 'user_patient_qa_001', 'v2026.04', $1::timestamptz, null, null),
      ('consent_qa_002', 'user_patient_qa_002', 'v2026.04', $1::timestamptz, $2::timestamptz, 'Testing withdrawal flow'),
      ('consent_qa_003', 'user_patient_qa_003', 'v2026.04', $1::timestamptz, null, null)
     on conflict (consent_id) do update set
       policy_version = excluded.policy_version,
       accepted_at = excluded.accepted_at,
       withdrawn_at = excluded.withdrawn_at,
       withdrawal_reason = excluded.withdrawal_reason`,
    [iso(-12), iso(-2)],
  );

  await pool.query(
    `insert into booking_requests (
      booking_request_id, patient_id, clinician_id, slot_id, appointment_date, referral_document_id,
      timezone, notes, state, created_at, updated_at
    ) values
      ('br_qa_001', 'user_patient_qa_001', 'user_psychologist_qa_001', 'qa_slot_001', $1::date, 'ref_qa_003', 'Australia/Sydney', 'Submitted booking', 'submitted', $2::timestamptz, now()),
      ('br_qa_002', 'user_patient_qa_005', 'user_psychologist_qa_002', 'qa_slot_002', $1::date, 'ref_qa_002', 'Australia/Sydney', 'Needs triage review', 'triage_review', $2::timestamptz, now()),
      ('br_qa_003', 'user_patient_qa_006', 'user_psychologist_qa_001', 'qa_slot_003', $1::date, 'ref_qa_003', 'Australia/Sydney', 'Matched and pending confirmation', 'matched_pending_confirmation', $2::timestamptz, now()),
      ('br_qa_004', 'user_patient_qa_003', 'user_psychologist_qa_002', 'qa_slot_004', $1::date, 'ref_qa_004', 'Australia/Sydney', 'Confirmed appointment', 'appointment_confirmed', $2::timestamptz, now())
    on conflict (booking_request_id) do update set
      state = excluded.state,
      updated_at = now()`,
    [iso(2).slice(0, 10), iso(-1)],
  );

  await pool.query(
    `insert into appointments (
      appointment_id, patient_id, clinician_id, scheduled_start_at, scheduled_end_at, status, chat_window_open_at, chat_window_close_at
    ) values
      ('appt_qa_001', 'user_patient_qa_001', 'user_psychologist_qa_001', $1::timestamptz, $2::timestamptz, 'scheduled', $3::timestamptz, $4::timestamptz),
      ('appt_qa_002', 'user_patient_qa_005', 'user_psychologist_qa_002', $5::timestamptz, $6::timestamptz, 'completed', $7::timestamptz, $8::timestamptz),
      ('appt_qa_003', 'user_patient_qa_006', 'user_psychologist_qa_001', $9::timestamptz, $10::timestamptz, 'cancelled', $11::timestamptz, $12::timestamptz),
      ('appt_qa_004', 'user_patient_qa_003', 'user_psychologist_qa_002', $13::timestamptz, $14::timestamptz, 'no_show', $15::timestamptz, $16::timestamptz)
    on conflict (appointment_id) do update set
      status = excluded.status,
      scheduled_start_at = excluded.scheduled_start_at,
      scheduled_end_at = excluded.scheduled_end_at`,
    [
      iso(1),
      iso(1 + 1 / 24),
      iso(1 - 1 / 48),
      iso(1 + 1 / 24),
      iso(-6),
      iso(-6 + 1 / 24),
      iso(-6 - 1 / 48),
      iso(-6 + 1 / 24),
      iso(-3),
      iso(-3 + 1 / 24),
      iso(-3 - 1 / 48),
      iso(-3 + 1 / 24),
      iso(-1),
      iso(-1 + 1 / 24),
      iso(-1 - 1 / 48),
      iso(-1 + 1 / 24),
    ],
  );

  await pool.end();

  console.log("Rich QA seed completed.");
  console.log("Admin: qa.admin@clink.test / AdminQA123!");
  console.log("Manager: qa.manager@clink.test / ManagerQA123!");
  console.log("Psychologists: qa.psych1@clink.test, qa.psych2@clink.test, qa.psych3@clink.test / PsychQA123!");
  console.log("Patients: qa.patient1@clink.test ... qa.patient6@clink.test / PatientQA123!");
}

void seed().catch((error) => {
  console.error("Rich QA seed failed:", error);
  process.exitCode = 1;
});
