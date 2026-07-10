# API Contract

Canonical contract definitions for Clink backend APIs.

## 1) Versioning and Base Path

- Base path: `/api`
- Versioning model: URL-stable within v1 contract set; breaking changes require explicit deprecation window.
- Contract status labels:
  - `canonical`: primary supported contract
  - `compat`: temporary compatibility surface
  - `deprecated`: scheduled for removal

## 2) Shared Response Envelope Rules

### 2.1 Success responses

- `2xx` response body is endpoint-specific DTO/schema.
- Response examples and DTO fields are defined in Swagger decorators.

### 2.2 Error envelope

All domain/validation/auth errors must map to:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

For future domain codes, include:

```json
{
  "statusCode": 409,
  "message": "Lifecycle transition is not allowed",
  "error": "Conflict",
  "code": "LIFECYCLE_TRANSITION_DENIED"
}
```

`code` is optional in current auth scope and becomes required for domain-level conflicts in upcoming modules.

## 3) Auth Contracts (W8A-02)

### POST `/api/auth/login`

- **Status:** `canonical`
- **Request DTO:** `LoginRequestDto`
  - `email` (email, required)
  - `password` (string, min length 8, required)
- **Response DTO:** `AuthSessionDto`
  - `accessToken`
  - `tokenType` = `Bearer`
  - `expiresInSeconds`
  - `user` (`CurrentUserDto`)
- **Error cases:**
  - `400` validation failure
  - `401` invalid credentials
- **Retryability:** safe to retry with same credentials (idempotent from state perspective).

### POST `/api/auth/logout`

- **Status:** `canonical`
- **Request:** no body
- **Response:**
  - `message` (string)
  - `revoked` (boolean; `false` in Sprint 1 contract-level logout)
- **Error cases:** none expected in current contract
- **Retryability:** safe/idempotent in current implementation.

### GET `/api/auth/me`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response DTO:** `CurrentUserDto` (includes `updatedAt`; for `patient` role includes `patientContactProfile`: phone, preferred contact channel, accessibility notes, emergency contact)
- **Error cases:**
  - `401` missing/invalid/expired token
- **Retryability:** safe read endpoint.

### GET `/api/patients/me/profile`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response DTO:** `CurrentUserDto` (identical to `GET /api/auth/me`; convenience route for patient clients)
- **Error cases:**
  - `401` missing/invalid/expired token
- **Retryability:** safe read endpoint.

### PATCH `/api/auth/profile`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Request DTO:** `UpdateProfileDto`
  - `displayName` (string, 1–120 chars, required)
  - `patientContactProfile` (optional object; **patients only** — partial update: only keys present are merged)
    - `phoneMobile` (string, max 40)
    - `preferredContactMethod` (`email` | `sms` | `phone`)
    - `accessibilityNotes` (string, max 2000)
    - `emergencyContactName` (string, max 120)
    - `emergencyContactPhone` (string, max 40)
    - `emergencyContactRelationship` (string, max 80)
- **Response DTO:** `CurrentUserDto` (includes `patientContactProfile` for `patient` role when stored)
- **Error cases:**
  - `400` non-patient sends `patientContactProfile` with any field set
  - `401` missing/invalid token
  - `404` user record missing
- **Audit:** emits `auth_profile_updated`
- **Retryability:** safe idempotent write for provided fields.

### POST `/api/auth/change-password`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Request DTO:** `ChangePasswordDto`
  - `currentPassword` (string, min 8)
  - `newPassword` (string, min 8, must differ from current)
- **Response:** `{ message: string }`
- **Error cases:**
  - `400` validation or new password equals current
  - `401` current password incorrect
  - `404` user record missing
- **Audit:** emits `auth_password_changed` or `auth_password_change_failed`
- **Retryability:** not idempotent; client should re-login after success.

## 4) Security and Operational Notes

- **Password storage:** user passwords are stored as **Argon2id** strings with prefix `$argon2id$` (see `password-crypto.util.ts`). `POST /auth/register` and `POST /auth/change-password` persist only derived keys; `POST /auth/login` verifies with constant-time comparison. Legacy `v1.scrypt$` hashes remain login-compatible and are rehashed to Argon2id on successful login. PostgreSQL demo accounts are upgraded to Argon2id by migration `1714214200000_rehash-demo-passwords-argon2.js` (idempotent).
- JWT secret source: `AUTH_JWT_SECRET` env var (fallback dev-only secret in current non-prod baseline).
- JWT TTL source: `AUTH_JWT_EXPIRES_IN` (seconds, default `3600`).
- Swagger auth scheme: bearer token enabled globally.
- Telehealth readiness reminder scheduler:
  - `READINESS_REMINDERS_ENABLED=true` enables automatic cron dispatch.
  - `READINESS_REMINDERS_CRON` controls cadence (default `*/5 * * * *`).
  - Scheduler invokes the same dispatch logic as `POST /api/ops/readiness-reminders/dispatch`.
- Twilio join handoff credentials:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_API_KEY`
  - `TWILIO_API_SECRET`
- Telehealth readiness reminder scheduler:
  - `READINESS_REMINDERS_ENABLED=true` enables automatic cron dispatch.
  - `READINESS_REMINDERS_CRON` controls cadence (default `*/5 * * * *`).
  - Scheduler invokes the same dispatch logic as `POST /api/ops/readiness-reminders/dispatch`.

## 5) Availability Contract (W8B-01)

### GET `/api/clinicians/availability`

- **Status:** `canonical`
- **Request query params:**
  - `startDate` (ISO date/datetime, required)
  - `endDate` (ISO date/datetime, required)
  - `clinicianId` (optional, must match known clinician)
  - `timezone` (optional IANA timezone, default `Australia/Sydney`)
- **Normalization rules:**
  - `startDate`/`endDate` are normalized to calendar dates in the requested timezone before range checks.
  - Maximum date window is 31 days (inclusive).
- **Response DTO:** `ClinicianAvailabilityResponseDto[]`
  - Each item includes `clinicianId`, `clinicianName`, `slots[]` (`AvailabilitySlotDto`).
  - When PostgreSQL + psychologist profiles are available, optional fields are populated from `psychologist_profiles` / `psychologist_profile_bio`: `specialties[]`, `bio`, `profileImageUrl` (from `profile_image_url` when set). For the three seeded bookable `clinician_00*` ids, a stable default portrait URL is still returned when the DB has no image so patients always see a face in booking.
- **Error cases:**
  - `400` invalid date range or invalid timezone
  - `404` unknown `clinicianId`
- **Retryability:** safe read endpoint.

## 6) Booking Request Contract (W8B-03)

### POST `/api/booking-requests`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only create in current Sprint 1 scope
- **Request DTO:** `CreateBookingRequestDto`
  - `clinicianId` (required)
  - `slotId` (required)
  - `appointmentDate` (required)
  - `notes` (optional)
  - `idempotencyKey` (optional, enables replay-safe create)
  - `timezone` (optional IANA timezone, default `Australia/Sydney`)
  - `referralDocumentId` (optional, links uploaded referral to booking request)
- **Response DTO:** `BookingRequestCreatedResponseDto`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-patient role attempts create
  - `409` selected slot is unavailable/invalid
- **Retryability:** retry-safe when `idempotencyKey` is provided.

### GET `/api/booking-requests/:id/status`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `BookingRequestStatusDto`
- **Linked referral:** includes `referralDocumentId` when associated at submit time
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized patient ownership access
  - `404` unknown booking request
- **Retryability:** safe read endpoint.

## 7) Referral Upload Contract (W8B-05/W8B-06)

### POST `/api/documents/referrals`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only in Sprint 1 scope
- **Content type:** `multipart/form-data`
- **Request fields:**
  - `file` (required, PDF only, max 8MB)
  - `sourceType` (optional)
  - `referralDate` (optional)
  - `notes` (optional)
- **Response DTO:** `ReferralDocumentDto`
  - `documentId`, `status`, `fileName`, `fileSize`, `mimeType`, `uploadedAt`
- **Error cases:**
  - `400` missing file, invalid mime type, or oversized file
  - `401` missing/invalid bearer token
  - `403` non-patient role attempts upload
- **Retryability:** safe to retry by re-uploading same document; current contract does not deduplicate file hash.

## 7.1) Referral Review Queue Contract (W11B-01)

### GET `/api/ops/referrals`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `practice_manager` and `admin` only
- **Query params (optional):**
  - `status` (`received|review_needed|approved|rejected|info_requested`)
  - `owner` (`all|unreviewed|mine`)
  - `overdue` (`all|overdue|on-track`)
- **Response DTO:** `ReferralQueueItemDto[]`
  - includes lifecycle + SLA metadata: `dueAt`, `overdue`, `assignedOwnerUserId`
  - includes review metadata (`reviewedBy`, `reviewedAt`, `reviewReason`, `reviewNotes`)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role forbidden
- **Retryability:** safe read endpoint.

### POST `/api/ops/referrals/:id/approve`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `practice_manager` and `admin` only
- **Request DTO:** `ReferralReviewActionDto`
  - `reason` (optional, max 500)
  - `notes` (optional, max 1000)
- **Response DTO:** `ReferralQueueItemDto`
- **State transition:** sets referral status to `approved`
- **Assignment model:** action assigns `assignedOwnerUserId` to the acting ops user.
- **Audit event:** `referral_approved`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role forbidden
  - `404` referral not found
  - `409` referral already in terminal/duplicate target state

### POST `/api/ops/referrals/:id/reject`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `practice_manager` and `admin` only
- **Request DTO:** `ReferralReviewActionDto`
- **Response DTO:** `ReferralQueueItemDto`
- **State transition:** sets referral status to `rejected`
- **Assignment model:** action assigns `assignedOwnerUserId` to the acting ops user.
- **Audit event:** `referral_rejected`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role forbidden
  - `404` referral not found
  - `409` referral already in terminal/duplicate target state

### POST `/api/ops/referrals/:id/request-info`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `practice_manager` and `admin` only
- **Request DTO:** `ReferralReviewActionDto`
- **Response DTO:** `ReferralQueueItemDto`
- **State transition:** sets referral status to `info_requested`
- **Assignment model:** action assigns `assignedOwnerUserId` to the acting ops user.
- **Audit event:** `referral_info_requested`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role forbidden
  - `404` referral not found
  - `409` referral already in terminal/duplicate target state

## 7.2) Patient Full Data Export PDF Contract (W11F-01)

### POST `/api/patients/me/data-export`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only
- **Response DTO:** `CreateDataExportResponseDto`
  - `jobId`
  - `status` (`queued`)
- **Audit events:** `patient_data_export_requested`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-patient role attempts export request

### GET `/api/patients/me/data-export/:jobId`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only and owner-only job access
- **Response DTO:** `DataExportStatusDto`
  - `jobId`, `status` (`queued|processing|ready|failed`), `requestedAt`, `completedAt`, `expiresAt`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-patient role attempts access
  - `404` unknown export job id

### GET `/api/patients/me/data-export/:jobId/download`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only and owner-only job access
- **Response:** `application/pdf` attachment
- **Audit events:** `patient_data_export_downloaded`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-patient role attempts access
  - `404` unknown export job id
  - `409` export not ready or expired

### Psychologist-scoped patient export (assignment-guarded)

- `POST /api/psychologists/:id/patients/:patientId/data-export`
- `GET /api/psychologists/:id/patients/:patientId/data-export/:jobId`
- `GET /api/psychologists/:id/patients/:patientId/data-export/:jobId/download`
- **Role guard:** authenticated psychologist owner only (`user.sub === :id`)
- **Assignment guard:** psychologist must be assigned to `:patientId` via session ownership.
- **Audit events:**
  - `psychologist_patient_data_export_requested`
  - `psychologist_patient_data_export_generated`
  - `psychologist_patient_data_export_downloaded`
- **Error cases:** `401` unauthorized, `403` non-owner/non-assigned psychologist, `404` unknown job, `409` legal hold / not ready / expired.

## 7.3) Admin Psychologist User Management Contract (W11G-01)

### GET `/api/admin/users/psychologists`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `AdminPsychologistUserDto[]`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-admin role attempts access

### POST `/api/admin/users/psychologists`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Request DTO:** `CreateAdminPsychologistUserDto`
- **Response DTO:** `AdminPsychologistUserDto`
- **Audit event:** `admin_psychologist_created`
- **Error cases:**
  - `400` email already exists / invalid payload
  - `401` missing/invalid bearer token
  - `403` non-admin role attempts access

### PATCH `/api/admin/users/psychologists/:id`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Request DTO:** `UpdateAdminPsychologistUserDto`
- **Response DTO:** `AdminPsychologistUserDto`
- **Audit event:** `admin_psychologist_updated`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-admin role attempts access
  - `404` psychologist account not found

## 7.4) Patient Soft Delete + Retention Enforcement Contract (W11H-01)

### POST `/api/admin/patients/:id/soft-delete`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Request DTO:** `PatientRetentionReasonDto`
- **Response DTO:** `PatientRetentionStatusDto`
- **Behavior:** sets `deletedAt`, `deletionReason`, `deletedByUserId`, computes `lastInteractionAt` and `retentionUntil`.
- **Audit event:** `patient_soft_deleted`

### POST `/api/admin/patients/:id/restore`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `PatientRetentionStatusDto`
- **Behavior:** clears soft-delete markers and restores account access.
- **Audit event:** `patient_restored`

### POST `/api/admin/patients/:id/legal-hold`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Request DTO:** `PatientRetentionReasonDto`
- **Response DTO:** `PatientRetentionStatusDto`
- **Behavior:** enables legal hold; blocks purge regardless of retention age.
- **Audit event:** `patient_legal_hold_enabled`

### POST `/api/admin/patients/:id/legal-hold/remove`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `PatientRetentionStatusDto`
- **Audit event:** `patient_legal_hold_removed`

### GET `/api/admin/patients/:id/retention-status`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `PatientRetentionStatusDto`

### GET `/api/admin/patients/purge-eligible?at=<iso>`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `PatientRetentionStatusDto[]`
- **Behavior:** returns soft-deleted patients where `retentionUntil <= at` and `legalHoldActive = false`.

### POST `/api/admin/patients/:id/purge`

- **Status:** `canonical` (feature-flagged execution)
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` only
- **Response DTO:** `PatientRetentionStatusDto`
- **Behavior:** policy checks must pass (`deletedAt`, `retentionUntil <= now`, `legalHoldActive=false`). Final execution requires `W11H_ENABLE_PURGE_EXECUTION=true`.
- **Audit events:** `patient_purge_denied_policy` or `patient_purged`

### Authentication policy change (W11H-01)

- Soft-deleted patients cannot authenticate: login returns `401` with account deactivated semantics and emits `auth_login_failed` (`reason=account_soft_deleted`).
- Legal hold restrictions:
  - Purge remains blocked while legal hold is active.
  - Patient data export endpoints are blocked while legal hold is active.
- Break-glass access (admin-only, justification required):
  - `POST /api/admin/patients/:id/break-glass-access`
  - `GET /api/admin/patients/:id/break-glass-access`
  - Break-glass can be granted only when legal hold is active, is time-limited, and is always audited.

## 7.5) Wave 12 Psychologist Notes + Context + Profile + Videos Contracts

### Notes domain

- `GET /api/psychologists/:id/notes`
- `GET /api/psychologists/:id/notes/:noteId`
- `POST /api/psychologists/:id/notes`
- `PATCH /api/psychologists/:id/notes/:noteId`
- `POST /api/psychologists/:id/notes/:noteId/sign`
- Status model: `draft`, `ready_for_signoff`, `signed`.
- Signed notes are immutable to edit (`403`).
- Access: owner psychologist, `admin`, `practice_manager`.
- Audit events:
  - `psychologist_note_created`
  - `psychologist_note_updated`
  - `psychologist_note_signed`
- Clinical sign-off minimum dataset enforcement:
  - sign-off requires non-empty `clinicalDataset` fields:
    - `presentingConcerns`
    - `riskAssessment`
    - `interventionsApplied`
    - `progressEvaluation`
    - `followUpPlan`
  - when missing, API returns `400` with stable payload:
    - `code=CLINICAL_MINIMUM_DATASET_MISSING`
    - `missingFields` array

### Psychologist patient context packet

- `GET /api/psychologists/:id/patients/:patientId/context`
- Returns clinician-safe packet: patient display identity, risk level, referral/readiness status, and care signals.

### Psychologist referral visibility

- `GET /api/psychologists/:id/referrals`
- Returns referral records scoped to patients assigned to the requesting psychologist.
- Response DTO: `PsychologistReferralDto[]` (`documentId`, `patientId`, `status`, `sourceType`, `uploadedAt`, `dueAt`).

### Psychologist profile

- `GET /api/psychologists/me/profile`
- `PATCH /api/psychologists/me/profile`
- Persisted operational profile fields: display identity, registration/provider numbers, specialties, status, bio, `profileImageUrl`.

### Session video library

- `GET /api/psychologists/:id/session-videos`
- `GET /api/patients/:id/session-videos`
- `GET /api/session-videos/:videoId/access`
- Listing payload (`SessionVideoItemDto`) includes governance fields:
  - `policyStatus`: `active | hold | purge_pending`
  - `canDownload`: role + owner constrained eligibility
  - `policyReason`: explicit denial reason when blocked
  - `watermarkRequired`: always `true` for protected recordings
  - `watermarkText`: visual watermark contract text
- Access token contract:
  - short-lived (5 minutes) tokenized download grant only
  - owner-only download policy: owner patient + assigned psychologist
  - `admin`/`practice_manager`: metadata visibility only, no download grant
- Retention and legal controls:
  - `hold` (legal hold active) blocks token issuance
  - `purge_pending` (soft-deleted, not purged) blocks token issuance
  - blocked attempts return `409` with `code=SESSION_VIDEO_DOWNLOAD_BLOCKED`
- Audit events:
  - `session_video_listed`
  - `session_video_access_granted`
  - `session_video_access_denied`
  - `session_video_download_initiated`

## 7.6) Admin Ops Hardening Snapshot Contracts

- `GET /api/admin/ops/appointments`
- `GET /api/admin/ops/patients`
- `GET /api/admin/ops/staff`
- `GET /api/admin/ops/settings`
- `GET /api/admin/ops/resources`
- `GET /api/admin/ops/billing`
- `GET /api/admin/ops/analytics-summary`
- Access: `admin` only.
- These endpoints provide route-level governance snapshots for admin hardening pages.

## 7.7) Wave 13 Consent Lifecycle Contract (W13A-01)

- `GET /api/auth/consents`
  - Returns current consent lifecycle status for authenticated patient.
- `POST /api/auth/consents/accept`
  - Accepts a versioned policy for authenticated patient.
  - Payload: `{ policyVersion: string }`
- `POST /api/auth/consents/withdraw`
  - Withdraws active consent for authenticated patient.
  - Payload: `{ reason: string }`
- Re-consent enforcement:
  - Patient `accountSetupComplete` is false when re-consent is required.
  - Re-consent is required when there is no active consent or active consent version is outdated.
- Audit events:
  - `consent_accepted`
  - `consent_withdrawn`

## 7.8) Wave 13 Patient Access/Correction Requests (W13C-01)

- `POST /api/patients/me/data-requests`
  - patient creates an `access` or `correction` request with details.
- `GET /api/patients/me/data-requests`
  - patient lists own requests.
- `GET /api/patients/me/data-requests/:id`
  - patient reads own request detail only.
- `GET /api/admin/patient-data-requests`
  - admin/practice_manager triage queue list.
- `POST /api/admin/patient-data-requests/:id/actions`
  - triage transition actions: `assign`, `start_review`, `fulfill`, `reject`, `cancel`.
- Lifecycle statuses:
  - `submitted` -> `triage_review` -> `in_progress` -> terminal (`fulfilled|rejected|cancelled`)
- Compliance fields:
  - `slaDueAt`
  - `triageOwnerUserId`
  - `triagedAt`
  - `resolvedAt`
- Invalid transitions return `409 Conflict`.
- Audit events:
  - `patient_data_request_created`
  - `patient_data_request_status_changed`

## 7.9) Wave 13 Security Incident Register + NDB Workflow Foundation (W13B-02)

- `POST /api/admin/security-incidents`
  - Creates incident register entry with severity, impact, and personal-data indicator.
- `GET /api/admin/security-incidents`
  - Lists incident register queue sorted by most recently updated.
- `PATCH /api/admin/security-incidents/:id`
  - Updates status/impact/NDB assessment/owner/resolution notes.
- Access:
  - `admin` only for all security incident endpoints.
- Workflow statuses:
  - `reported` -> `triage` -> `investigating` -> `notification_assessment` -> `notification_ready` -> `closed`
  - invalid transitions return `409 Conflict`.
- NDB workflow support:
  - `ndbAssessment`: `not_required | assessment_in_progress | eligible_for_notification | notifiable`
- Audit events:
  - `security_incident_created`
  - `security_incident_updated`

## 8) Pre-Session Window Contract (W8C-01)

### GET `/api/appointments/:id/pre-session-window`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `TelehealthSessionWindowDto`
  - `appointmentId`
  - `status`: `locked | open | closed`
  - `opensAt`, `closesAt`, `now`
  - `reason` (frontend-ready explanation)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
- **Retryability:** safe read endpoint.

## 9) Chat Window Contract (W8C-02)

### GET `/api/appointments/:id/chat-window`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `ChatWindowDto`
  - `appointmentId`, `status` (`locked|open|closed`)
  - `opensAt`, `closesAt`, `reason`
  - `messageCount`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
- **Retryability:** safe read endpoint.

### POST `/api/appointments/:id/chat/messages`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Request DTO:** `CreateChatMessageDto`
  - `message` (required, max 2000 chars)
- **Response DTO:** `ChatMessageDto`
- **Window rules:** message send is allowed only when chat window is `open`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
  - `409` chat window not open
- **Retryability:** not idempotent; clients should avoid automatic retries without user intent.

## 10) Realtime Event Contract (W8C-02/W8C-03)

### Socket Namespace

- **Transport:** Socket.IO WebSocket namespace `/chat`
- **Auth:** handshake token in `auth.token` as `Bearer <jwt>`
- **Room model:** one room per `appointmentId`
- **Access rules:** same as REST chat routes (owner patient or privileged roles)

### Client -> Server Events

- `chat:join`
  - payload: `{ appointmentId: string }`
  - ack success: `{ ok: true, appointmentId, window, messages, presence }`
  - ack failure: `{ ok: false, error }`
- `chat:send`
  - payload: `{ appointmentId: string, message: string }`
  - ack success: `{ ok: true, message, window }`
  - ack failure: `{ ok: false, error }`

### Server -> Client Events

- `chat:message`
  - payload: `ChatMessageDto`
- `chat:presence`
  - payload: `{ appointmentId: string, onlineUserIds: string[] }`
- `chat:window`
  - payload: `ChatWindowDto`
- `chat:error`
  - payload: `{ code?: string, message: string }`

### Realtime fallback contract

- If socket connect/join fails, clients must:
  - read state via `GET /api/appointments/:id/chat-window`
  - send via `POST /api/appointments/:id/chat/messages`

## 11) Audit Events Contract (W8D-01)

### GET `/api/audit/events`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Query filters (optional):**
  - `action`
  - `targetType`
  - `targetId`
  - `actorUserId`
  - `from` (ISO datetime)
  - `to` (ISO datetime)
- **Response DTO:** `AuditEventDto[]`
  - `eventId`
  - `actorUserId`
  - `actorRole`
  - `action`
  - `targetType`
  - `targetId`
  - `metadata`
  - `occurredAt`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed to read audit events
- **Retryability:** safe read endpoint.

## 12) Cross-Device Intake Draft Contract (W8D-02)

### GET `/api/patients/:id/intake-latest`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `IntakeDraftDto`
  - `patientId`
  - `draftVersion`
  - `data` (latest merged draft payload)
  - `updatedAt`
  - `committed`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
- **Retryability:** safe read endpoint.

### POST `/api/patients/:id/intake-delta`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient only (write)
- **Request DTO:** `SaveIntakeDraftDto`
  - `baseVersion` (optional; defaults to current version when omitted)
  - `delta` object to merge into latest draft data
- **Response DTO:** `IntakeDraftSavedResponseDto`
  - `patientId`, `draftVersion`, `updatedAt`, `saved`
- **Conflict behavior:** returns `409` with conflict payload when `baseVersion` is stale
  - `code: "DRAFT_VERSION_CONFLICT"`
  - `currentVersion`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-owner write attempt
  - `409` version conflict
- **Retryability:** retryable after refreshing latest draft/version.

### POST `/api/patients/:id/intake-draft/commit`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient only (write)
- **Response DTO:** `IntakeDraftSavedResponseDto`
- **Side effect (patient profile sync):** after a successful commit, the server merges intake `patientIdentity` (legal `fullName` → account `displayName`, `mobile` → profile phone, `preferredContactMethod`) and `telehealthSafety` emergency contact fields into the patient’s persisted account profile (`users` + `patient_profiles` in PostgreSQL mode, or the in-memory user store when DB is disabled). Accessibility notes in the account profile are not overwritten from intake.
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-owner write attempt
  - `404` no draft exists
- **Retryability:** safe to retry after successful save flow.

## 13) Notifications Contract (W8D-03)

### GET `/api/notifications`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response DTO:** `NotificationDto[]`
- **Behavior:** returns current user notifications ordered newest-first.
- **Error cases:**
  - `401` missing/invalid bearer token
- **Retryability:** safe read endpoint.

### PATCH `/api/notifications/:id/read`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response DTO:** `NotificationDto` (with `readAt` set)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `404` notification not found for current user
- **Retryability:** safe to retry; idempotent once already read.

### GET `/api/notifications/preferences`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response DTO:** `NotificationPreferenceDto`
- **Error cases:**
  - `401` missing/invalid bearer token
- **Retryability:** safe read endpoint.

### POST `/api/notifications/preferences`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Request/Response DTO:** `NotificationPreferenceDto`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `400` invalid preference payload
- **Retryability:** retry-safe write (latest payload wins).

## 14) Ops Intake Queue Contract (W8D-04)

### GET `/api/ops/intake-queue`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Query filters (optional):**
  - `state`
  - `risk` (`none` | `urgent_support_needed`)
  - `referralStatus` (`missing_referral` | `linked_referral`)
  - `medicareUncertain` (`true` | `false`)
  - `staleHours` (numeric)
  - `assignedClinicianId`
- **Response DTO:** `IntakeQueueItemDto[]`
  - `queueItemId`, `sourceType`, `sourceId`
  - `patientId`, `state`, `risk`
  - `referralStatus`, `medicareUncertain`
  - `assignedClinicianId`, `updatedAt`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
- **Retryability:** safe read endpoint.

### POST `/api/ops/intake-queue/:id/assign`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Request DTO:** `AssignIntakeQueueItemDto`
  - `assignedClinicianId`
- **Response DTO:** `IntakeQueueItemDto`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
  - `404` queue item not found
- **Retryability:** retry-safe assignment update (latest write wins).

## 15) Analytics Events Contract (W8E-01)

### POST `/api/analytics/events`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Request DTO:** `CreateAnalyticsEventDto`
  - `name` (`intake_started`, `intake_submitted`, `booking_requested`, `booking_confirmed`, `session_started`, `session_completed`, `session_no_show`)
  - `targetId`
  - `idempotencyKey` (optional, recommended)
  - `metadata` (optional)
  - `actorUserId` and `actorRole` optional (defaults to token actor)
- **Response DTO:** `AnalyticsEventDto`
- **Deduplication:** if same `idempotencyKey` repeats, existing event is returned (no duplicate insert)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `400` invalid event schema
- **Retryability:** retry-safe with idempotency key.

### GET `/api/analytics/events`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Response DTO:** `AnalyticsEventDto[]`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
- **Retryability:** safe read endpoint.

## 16) Persistence and Concurrency Guarantees (W9-06C)

### Runtime persistence mode

- When `DATABASE_URL` is set and reachable, contracts run in PostgreSQL persistence mode.
- When `DATABASE_URL` is missing, contracts run in in-memory fallback mode for local/dev compatibility.
- **Users:** authenticated identities and role-specific profiles persist in PostgreSQL tables `users`, `patient_profiles`, and `psychologist_profiles` (migrations `1714214000000_users-and-patient-profiles.js` and `1714214300000_psychologist-profiles.js`) when the database is enabled; otherwise the process uses the in-memory stub user repository.
- Health endpoint `GET /api/health` reports:
  - `database.mode` (`postgresql` | `in_memory_fallback`)
  - `database.connected` (boolean)
  - `database.migrationsReady` (boolean; migration state table present)
  - `readinessReminders.enabled` (boolean)
  - `readinessReminders.cron` (string cron expression)

### Migration readiness contract

- PostgreSQL deployments must run `db:migrate` before app startup.
- Missing migration state is reported as degraded readiness through `GET /api/health`.

### Booking write atomicity

- `POST /api/booking-requests` persists booking request, idempotency record, and appointment in one DB transaction in PostgreSQL mode.
- On transaction failure, no partial write is committed.

### Slot concurrency and conflict mapping

- Active slot uniqueness is enforced in DB by partial unique index:
  - `booking_requests_active_slot_unique_idx` on `(clinician_id, appointment_date, slot_id)`
  - applies for states: `submitted`, `triage_review`, `matched_pending_confirmation`
- Concurrent same-slot create requests guarantee exactly one success and one conflict outcome.
- Conflict contract:
  - `409 Conflict`
  - message: `Selected slot is no longer available`

### Idempotency semantics

- `POST /api/booking-requests` with `idempotencyKey` is replay-safe for same actor scope.
- Duplicate idempotency key returns existing booking create response (`idempotentReplay: true`) when prior create exists.
- `POST /api/analytics/events` remains idempotent by `idempotencyKey` (existing record returned on replay).

## 17) Wave 10 Contracts (Realtime + Projections)

### GET `/api/notifications/stream-token`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Response:**
  - `socketToken` (short-lived JWT used for `/notifications` socket handshake)
  - `expiresInSeconds`
- **Error cases:**
  - `401` missing/invalid bearer token
- **Retryability:** safe read endpoint.

### Notifications Socket Namespace `/notifications`

- **Status:** `canonical`
- **Handshake auth:** `auth.token = Bearer <socketToken>`
- **Events:**
  - client -> server: `notifications:subscribe` `{}` ack `{ ok: true } | { ok: false, error }`
  - server -> client: `notifications:new` payload `NotificationDto`
- **Fallback:** clients should continue periodic `GET /api/notifications` polling when socket connect/subscribe fails.

### GET `/api/patients/me/care-team`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** patient-only
- **Summary:** Lists psychologists/clinicians linked to the authenticated patient through **appointment history** (deduped by `clinicianId`). Surfaces display identity and registration fields when the mapped psychologist account exists.
- **Response DTO:** `PatientCareClinicianDto[]`
  - `clinicianId`, `psychologistUserId`, `displayName`, `specialties[]`, `accountStatus`, optional `registrationNumber`, `providerNumber`, optional `bio`, optional `profileImageUrl`, `nextSessionAt`, `lastSessionAt`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-patient role
- **Retryability:** safe read endpoint.

### GET `/api/patients/:id/journey-timeline`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `PatientJourneyTimelineDto`
  - `patientId`
  - `steps[]` with:
    - `key` (`intake_started`, `intake_submitted`, `booking_requested`, `booking_confirmed`, `session_started`, `session_completed`, `session_no_show`)
    - `status` (`pending` | `done`)
    - `occurredAt?`
    - `label`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
- **Retryability:** safe read endpoint.

### GET `/api/patients/:id/appointments`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** same as journey timeline (owner patient or privileged roles)
- **Response DTO:** `PatientAppointmentsListResponseDto` with `upcoming[]` and `past[]` (`PatientAppointmentSummaryDto` each: `appointmentId`, `clinicianName`, `sessionTypeLabel`, `scheduledStartAt`, `scheduledEndAt`, `status`, `statusLabel`)
- **Retryability:** safe read endpoint.

### GET `/api/patients/:id/sessions`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged ops roles (`practice_manager`, `admin`)
- **Response DTO:** `SessionSummaryDto[]`
  - each row: `sessionId`, `scheduledStartAt`, `scheduledEndAt`, `status`, `clinicianId`, `patientId`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
- **Retryability:** safe read endpoint.

### GET `/api/patients/:id/mood-checkins`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Query:** optional `limit` (default 14, max 100)
- **Access rules:** same as journey timeline
- **Response DTO:** `MoodCheckinsListResponseDto` with `items[]` (`id`, `moodLabel`, `createdAt`)
- **Retryability:** safe read endpoint.

### POST `/api/patients/:id/mood-checkins`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient only
- **Body:** `CreateMoodCheckinDto` (`moodLabel` string, 1–200 chars)
- **Response DTO:** `MoodCheckinItemDto`
- **Retryability:** write; safe to retry for distinct entries.

### GET `/api/psychologists/:id/pre-session-workspace`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owning psychologist, `practice_manager`, or `admin`
- **Response DTO:** `PsychologistPreSessionWorkspaceDto`
  - `psychologistId`
  - `items[]`:
    - `appointmentId`
    - `patientId`
    - `startsAt`
    - `risk`
    - `referralStatus`
    - `intakeState`
    - `readinessStatus` (`ready` | `attention` | `unknown`)
    - `readinessUpdatedAt?`
    - `actions[]`
- **Query filters (optional):**
  - `readinessStatus` (`ready` | `attention` | `unknown`)
  - `staleMinutes` (integer; includes items with missing/older readiness checks)
  - `sortBy` (`startsAt` | `readinessUpdatedAt` | `readinessStatus`)
  - `sortOrder` (`asc` | `desc`)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role/ownership denied
- **Retryability:** safe read endpoint.
- **Demo note:** stub user `user_psychologist_001` is mapped to clinician `clinician_001` when resolving appointment rows.

### GET `/api/psychologists/:id/sessions`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** assigned psychologist self (`id === auth.sub`) or privileged ops roles (`practice_manager`, `admin`)
- **Response DTO:** `SessionSummaryDto[]`
  - each row: `sessionId`, `scheduledStartAt`, `scheduledEndAt`, `status`, `clinicianId`, `patientId`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
- **Retryability:** safe read endpoint.

### GET `/api/sessions/:sessionId`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient, assigned psychologist, or privileged ops roles (`practice_manager`, `admin`)
- **Response DTO:** `SessionDetailDto`
  - `sessionId`, `patientId`, `clinicianId`, `scheduledStartAt`, `scheduledEndAt`, `status`, `sessionTypeLabel`, `viewerAccessMode`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership/assignment access
  - `404` unknown session id
- **Retryability:** safe read endpoint.

### GET `/api/ops/insights`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Response DTO:** `OpsInsightsDto`
  - `queueTotal`
  - `urgentRiskCount`
  - `staleQueueCount`
  - `bookingRequestedCount`
  - `bookingConfirmedCount`
  - `sessionNoShowCount`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
- **Retryability:** safe read endpoint.

### GET `/api/appointments/:id/readiness`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `TelehealthReadinessDto`
  - `appointmentId`
  - `overallStatus` (`ready` | `attention`)
  - `guidance` (user-facing preflight reminder)
  - `checks[]`:
    - `key` (`camera` | `microphone` | `network` | `session_window`)
    - `status` (`pass` | `review`)
    - `message`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
- **Retryability:** safe read endpoint.

### POST `/api/appointments/:id/readiness`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient only (save browser-side preflight outcomes)
- **Request DTO:** `SaveTelehealthReadinessDto`
  - `overallStatus` (`ready` | `attention`)
  - `checks[]` with:
    - `key` (`camera` | `microphone` | `network` | `session_window`)
    - `status` (`pass` | `review`)
    - `message`
- **Response DTO:** `TelehealthReadinessDto`
  - includes persisted `updatedAt`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` non-owner or non-patient write attempt
  - `404` unknown appointment id
- **Retryability:** retry-safe write; latest save overwrites prior readiness snapshot.

### GET `/api/appointments/:id`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Response DTO:** `AppointmentDetailsDto`
  - `appointmentId`
  - `patientId`
  - `clinicianId`
  - `scheduledStartAt`
  - `scheduledEndAt`
  - `status`
  - `chatWindowStatus` (`locked` | `open` | `closed`)
  - `canJoinNow`
  - `canManage`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
- **Retryability:** safe read endpoint.

### POST `/api/appointments/:id/manage`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged ops roles (`practice_manager`, `admin`)
- **Request DTO:** `ManageAppointmentDto`
  - `action` (`cancel` | `reschedule`)
  - `scheduledStartAt?` (required when action is `reschedule`)
- **Response DTO:** `AppointmentDetailsDto` (latest appointment state after mutation)
- **Behavior:**
  - `cancel`: transitions scheduled appointment to `cancelled`
  - `reschedule`: updates start/end/chat window timestamps and keeps `status=scheduled`
  - records audit event (`appointment_cancelled` / `appointment_rescheduled`)
- **Error cases:**
  - `400` invalid reschedule payload or policy violation (examples: missing `scheduledStartAt` for `reschedule`, invalid timestamp, patient new start less than 1 hour from now, patient within 2 hours of current session start, new start beyond 180-day horizon; ops roles use a 5-minute minimum lead instead of 1 hour)
  - `401` missing/invalid bearer token
  - `403` unauthorized manage access
  - `404` unknown appointment id
  - `409` invalid transition (already cancelled/completed/no_show)
- **Retryability:** retry-safe write endpoint.

### POST `/api/appointments/:id/join-attempt`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Request DTO:** `CreateJoinAttemptDto`
  - `channel` (`video` | `chat`)
  - `acknowledgementNote?` (optional warning acknowledgement context)
- **Response DTO:** `JoinAttemptDecisionDto`
  - `appointmentId`
  - `allowed` (warn-and-allow mode still blocks when session window is not open)
  - `policyMode` (`warn_allow`)
  - `readinessStatus` (`ready` | `attention` | `unknown`)
  - `windowStatus` (`locked` | `open` | `closed`)
  - `reasons[]` (policy reason codes for warning/decision)
  - `recordedAt`
- **Audit behavior:**
  - persists `join_attempt_allowed` or `join_attempt_warned` event on every request
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
- **Retryability:** retry-safe read/write decision endpoint; each call records an audit event.

### POST `/api/appointments/:id/join-session`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Access rules:** owner patient or privileged roles (`psychologist`, `practice_manager`, `admin`)
- **Request DTO:** `CreateJoinSessionDto`
  - `channel` (`video` | `chat`)
  - `overrideReason?` (clinician/admin context for warning override)
- **Response DTO:** `JoinSessionTokenDto`
  - `appointmentId`
  - `roomName` (appointment-scoped Twilio room)
  - `participantIdentity`
  - `accessToken` (short-lived Twilio token)
  - `expiresAt`
  - `policyMode`
  - `warnings[]`
- **Behavior:**
  - re-evaluates join policy before token minting
  - blocks when session window is not open
  - records `session_join_granted` / `session_join_denied` audit events
  - records join funnel analytics (`join_success` / `join_failed`)
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` unauthorized ownership access
  - `404` unknown appointment id
  - `409` session cannot be joined now
- **Retryability:** retry-safe; each request issues a fresh token when allowed.

### POST `/api/ops/readiness-reminders/dispatch`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Behavior:**
  - scans upcoming scheduled appointments
  - dispatches patient reminder for T-30/T-10 window with readiness deep-link
  - dispatches psychologist escalation at T-10 if readiness is still `attention`/missing
  - deduplicates by `(recipient, type=session_starting_soon, appointmentId, reminderWindow, escalation?)`
- **Response DTO:** `ReadinessReminderDispatchDto`
  - `scannedAppointments`
  - `dispatchedCount`
  - `escalatedCount`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
- **Retryability:** retry-safe; duplicate reminders are suppressed for the same reminder window.

### GET `/api/ops/telehealth-insights`

- **Status:** `canonical`
- **Auth:** `Authorization: Bearer <token>`
- **Role guard:** `admin` and `practice_manager` only
- **Response DTO:** `TelehealthInsightsDto`
  - `totalJoinAttempts`
  - `warnedJoinCount`
  - `warnedJoinRate`
  - `failedJoinCount`
  - `lateJoinCount`
  - `recoveryRate`
- **Error cases:**
  - `401` missing/invalid bearer token
  - `403` role not allowed
- **Retryability:** safe read endpoint.
