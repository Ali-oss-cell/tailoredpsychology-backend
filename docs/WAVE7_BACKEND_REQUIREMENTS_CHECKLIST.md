# Wave 7 Backend Requirements Checklist

Backend execution checklist derived from Wave 7 business requirements.

## Priorities

- `P0` must-have before production pilot
- `P1` should-have for operational stability
- `P2` optimization / advanced reporting

---

## 1) Domain Model and State Management

### Canonical lifecycle enum draft (W8A-01)

`discover`, `pre_screen`, `account_created`, `intake_draft`, `intake_submitted`, `triage_review`, `matched_pending_confirmation`, `appointment_confirmed`, `session_prep`, `session_in_progress`, `post_session_followup`, `ongoing_care`, `inactive_or_discharged`

### Transition control contract

| From | To | Actor(s) allowed | Validation requirement |
|---|---|---|---|
| `intake_draft` | `intake_submitted` | patient | Required intake + consent checks pass |
| `intake_submitted` | `triage_review` | ops/system | Queue ingestion and SLA start timestamp |
| `triage_review` | `matched_pending_confirmation` | ops/clinical | Clinician assignment and rationale |
| `matched_pending_confirmation` | `appointment_confirmed` | patient/ops | Confirmation acceptance event |
| `appointment_confirmed` | `session_prep` | system | Time-based pre-session window reached |
| `session_prep` | `session_in_progress` | patient + clinician | Access checks and session start event |
| `session_in_progress` | `post_session_followup` | clinician | Completion summary exists |
| `post_session_followup` | `ongoing_care` | clinician | Care plan next actions saved |
| `post_session_followup` | `inactive_or_discharged` | clinician/ops | Discharge reason recorded |

Non-allowed transitions are rejected with `409 Conflict` and are append-audited as denied attempts.

| ID | Requirement | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-001 | Implement canonical lifecycle state enum and transition rules | P0 | Invalid transitions rejected; valid transitions audited | Not started |
| BE-BR-002 | Persist lifecycle transition events (append-only) | P0 | Event record includes actor, from, to, reason, timestamp | Not started |
| BE-BR-003 | Lifecycle SLA monitor hooks | P1 | Time-in-state can be queried for alerting | Not started |

## 2) Core Entities

| ID | Entity | Priority | Required fields (minimum) | Status |
|---|---|---|---|---|
| BE-BR-101 | `PatientProfile` | P0 | identity, contact, accessibility, emergency contact | Not started |
| BE-BR-102 | `IntakeSubmission` | P0 | concerns, risk flags, booking type, submittedAt | Not started |
| BE-BR-103 | `BookingRequest` | P0 | patientId, clinicianId/noPreference, date, slot, state | Not started |
| BE-BR-104 | `Appointment` | P0 | schedule, participants, modality, status | Not started |
| BE-BR-105 | `ReferralDocument` | P0 | documentId, source, status, validity metadata | Not started |
| BE-BR-106 | `ConsentRecord` | P0 | policy version, acceptedAt, acceptedBy | Not started |
| BE-BR-107 | `TelehealthSessionWindow` | P1 | openAt, closeAt, status, closureReason | Not started |

## 3) API Contracts

| ID | Endpoint | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-201 | `GET /clinicians/availability` | P0 | Date-window queries and slot statuses supported | Not started |
| BE-BR-202 | `POST /booking-requests` | P0 | Validates rules and creates lifecycle state | Not started |
| BE-BR-203 | `POST /documents/referrals` | P0 | Secure upload, metadata saved, status returned | Not started |
| BE-BR-204 | `GET /patients/:id/intake-latest` | P1 | Latest intake version returned with metadata | Not started |
| BE-BR-205 | `POST /patients/:id/intake-delta` | P1 | Delta merge policy enforced and audited | Not started |
| BE-BR-206 | `GET /patients/:id/medicare-status` | P1 | Session counters and readiness flags returned | Not started |
| BE-BR-207 | `POST /consents` | P0 | Stores versioned consent records | Not started |
| BE-BR-208 | `GET /booking-requests/:id/status` | P1 | Returns patient-facing status timeline fields | Not started |

## 4) Referral Document Pipeline

| ID | Requirement | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-301 | Secure object storage policy | P0 | Role-based access and encryption at rest | Not started |
| BE-BR-302 | MIME/content validation | P0 | Rejects invalid files and logs reason | Not started |
| BE-BR-303 | AV scan integration hook | P1 | Scanning status tracked per document | Not started |
| BE-BR-304 | Document status lifecycle | P0 | `received/review_needed/valid/expired/rejected` supported | Not started |
| BE-BR-305 | Expiry and renewal reminders | P2 | Upcoming expiry query endpoint available | Not started |

## 5) Telehealth Pre-Session Chat (T-30 Window)

| ID | Requirement | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-401 | Chat access opens exactly at T-30 | P0 | API denies access before openAt and allows at/after openAt | Not started |
| BE-BR-402 | Chat auto-close events | P0 | Closes on join/cancel/no-show timeout with reason | Not started |
| BE-BR-403 | Chat role permissions | P0 | Only allowed roles can read/write for appointment | Not started |
| BE-BR-404 | Chat open/close audit events | P1 | Events include actor/system source and timestamps | Not started |

## 6) Security, Privacy, and Audit

| ID | Requirement | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-501 | Data classification tags by field/domain | P1 | Sensitive fields tagged in schema/docs | Not started |
| BE-BR-502 | Field-level audit for sensitive updates | P0 | Before/after values and actor captured | Not started |
| BE-BR-503 | Consent withdrawal support | P1 | Withdrawal state and timestamp persisted | Not started |
| BE-BR-504 | Retention and soft-delete strategy | P1 | Policies implemented and testable | Not started |

## 7) Observability and Operations

| ID | Requirement | Priority | Acceptance criteria | Status |
|---|---|---|---|---|
| BE-BR-601 | Lifecycle transition metrics | P1 | Counts and duration metrics available | Not started |
| BE-BR-602 | Booking funnel backend events | P1 | Event stream supports conversion reporting | Not started |
| BE-BR-603 | No-show and completion metrics | P1 | Appointment outcomes queryable by segment | Not started |

## Backend signoff gate

- [ ] Domain entities approved
- [ ] API contracts approved
- [ ] Security/compliance controls approved
- [ ] Telehealth chat window timing behavior approved
- [ ] Operational observability baseline approved

