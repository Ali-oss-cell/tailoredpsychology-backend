# API Contract Matrix

## Auth Endpoints (W8A-02)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/auth/login` | POST | canonical | No | `AuthSessionDto` | `400` validation, `401` invalid credentials | Retryable |
| `/api/auth/register` | POST | canonical | No | `AuthSessionDto` | `400` validation, `400` email already exists | Retryable with new email; on success may create an in-app `account_welcome` notification when notification preferences allow it |
| `/api/auth/logout` | POST | canonical | No (current) | `{ message, revoked }` | N/A (current) | Retryable, idempotent |
| `/api/auth/me` | GET | canonical | Yes (Bearer JWT) | `CurrentUserDto` (`accountSetupComplete` for patients = display name + required intake identity + consents in latest intake draft; optional `patientContactProfile` for patients) | `401` missing/invalid token | Retryable, safe read |
| `/api/auth/profile` | PATCH | canonical | Yes (Bearer JWT) | `CurrentUserDto` (optional `patientContactProfile` merge for patients) | `400` patient-only fields on non-patient, `401`, `404` | Retryable write |
| `/api/auth/onboarding-complete` | POST | canonical | Yes (Bearer JWT) | `CurrentUserDto` (same as GET `/auth/me`; no state change) | `401` unauthorized | Retryable; compatibility endpoint only |
| `/api/auth/change-password` | POST | canonical | Yes (Bearer JWT) | `{ message }` | `400` validation, `401` wrong current password, `404` user missing | Retry with care after lockout policy |
| `/api/auth/consents` | GET | canonical | Yes (Bearer JWT) | `ConsentStatusDto` | `400` non-patient role, `401` unauthorized | Retryable, safe read |
| `/api/auth/consents/accept` | POST | canonical | Yes (Bearer JWT) | `ConsentStatusDto` | `400` validation/non-patient role, `401` unauthorized | Retryable write |
| `/api/auth/consents/withdraw` | POST | canonical | Yes (Bearer JWT) | `ConsentStatusDto` | `400` validation/non-patient role, `401` unauthorized | Retryable write |
| `/api/patients/me/profile` | GET | canonical | Yes (Bearer JWT) | `CurrentUserDto` (same body as `GET /api/auth/me`) | `401` missing/invalid token | Retryable, safe read |

## Billing Endpoints (patient portal)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/billing/invoices` | GET | canonical | Yes (Bearer JWT) | `InvoiceSummaryDto[]` | `401` unauthorized, `403` non-patient | Retryable, safe read |
| `/api/billing/invoices/:invoiceId/download` | GET | canonical | Yes (Bearer JWT) | `text/plain` attachment (placeholder stub) | `401` unauthorized, `403` non-patient, `404` invoice not found | Retryable, safe read |

## Core Runtime Endpoints (W9-06A/W9-06C)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/health` | GET | canonical | No | `{ status, timestamp, database: { mode, connected, migrationsReady }, readinessReminders: { enabled, cron } }` | N/A (current) | Retryable, safe read |

## Availability Endpoints (W8B-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/clinicians/availability` | GET | canonical | No (current) | `ClinicianAvailabilityResponseDto[]` (optional `specialties`, `bio`, `profileImageUrl` when DB profiles exist) | `400` invalid range/timezone, `404` clinician not found | Retryable, safe read |

## Booking Request Endpoints (W8B-03)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/booking-requests` | POST | canonical | Yes (Bearer JWT) | `BookingRequestCreatedResponseDto` | `401` unauthorized, `403` role forbidden, `409` slot conflict | Retryable with idempotency key; supports optional `referralDocumentId` |
| `/api/booking-requests/:id/status` | GET | canonical | Yes (Bearer JWT) | `BookingRequestStatusDto` | `401` unauthorized, `403` ownership forbidden, `404` not found | Retryable, safe read; includes `referralDocumentId` when linked |

Booking runtime guarantees (PostgreSQL mode):

- booking create path is atomic (booking request + idempotency row + appointment in one transaction)
- active slot uniqueness enforced by DB partial unique index
- concurrent same-slot create behavior is protected by e2e regression test

## Referral Document Endpoints (W8B-05/W8B-06)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/documents/referrals` | POST | canonical | Yes (Bearer JWT) | `ReferralDocumentDto` | `400` invalid/missing file, `401` unauthorized, `403` role forbidden | Retryable via re-upload |
| `/api/ops/referrals` | GET | canonical | Yes (Bearer JWT) | `ReferralQueueItemDto[]` (supports `status`/`owner`/`overdue` query filters; includes `dueAt`, `overdue`, `assignedOwnerUserId`) | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only) | Retryable, safe read |
| `/api/ops/referrals/:id/approve` | POST | canonical | Yes (Bearer JWT) | `ReferralQueueItemDto` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only), `404` referral not found, `409` duplicate/terminal transition | Not idempotent |
| `/api/ops/referrals/:id/reject` | POST | canonical | Yes (Bearer JWT) | `ReferralQueueItemDto` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only), `404` referral not found, `409` duplicate/terminal transition | Not idempotent |
| `/api/ops/referrals/:id/request-info` | POST | canonical | Yes (Bearer JWT) | `ReferralQueueItemDto` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only), `404` referral not found, `409` duplicate/terminal transition | Not idempotent |

## Patient Data Export Endpoints (W11F-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/patients/me/data-export` | POST | canonical | Yes (Bearer JWT) | `CreateDataExportResponseDto` | `401` unauthorized, `403` role forbidden (patient only), `409` legal hold active | Retryable by creating a new job |
| `/api/patients/me/data-export/:jobId` | GET | canonical | Yes (Bearer JWT) | `DataExportStatusDto` | `401` unauthorized, `403` role forbidden/ownership denied, `404` job not found, `409` legal hold active | Retryable, safe read |
| `/api/patients/me/data-export/:jobId/download` | GET | canonical | Yes (Bearer JWT) | `application/pdf` download | `401` unauthorized, `403` role forbidden/ownership denied, `404` job not found, `409` export not ready/expired/legal hold active | Retryable after status is `ready` |
| `/api/psychologists/:id/patients/:patientId/data-export` | POST | canonical | Yes (Bearer JWT) | `CreateDataExportResponseDto` | `401` unauthorized, `403` non-owner/non-assigned psychologist, `409` legal hold active | Retryable by creating new job |
| `/api/psychologists/:id/patients/:patientId/data-export/:jobId` | GET | canonical | Yes (Bearer JWT) | `DataExportStatusDto` | `401` unauthorized, `403` non-owner/non-assigned psychologist, `404` job not found, `409` legal hold active | Retryable, safe read |
| `/api/psychologists/:id/patients/:patientId/data-export/:jobId/download` | GET | canonical | Yes (Bearer JWT) | `application/pdf` download | `401` unauthorized, `403` non-owner/non-assigned psychologist, `404` job not found, `409` not ready/expired/legal hold active | Retryable after status is `ready` |

## Admin Psychologist User Management (W11G-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/admin/users/psychologists` | GET | canonical | Yes (Bearer JWT) | `AdminPsychologistUserDto[]` | `401` unauthorized, `403` role forbidden (admin only) | Retryable, safe read |
| `/api/admin/users/psychologists` | POST | canonical | Yes (Bearer JWT) | `AdminPsychologistUserDto` | `400` validation/email conflict, `401` unauthorized, `403` role forbidden (admin only) | Retryable with corrected payload |
| `/api/admin/users/psychologists/:id` | PATCH | canonical | Yes (Bearer JWT) | `AdminPsychologistUserDto` | `401` unauthorized, `403` role forbidden (admin only), `404` psychologist not found | Retryable with corrected target/payload |

## Patient Soft Delete + Retention (W11H-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/admin/patients/:id/soft-delete` | POST | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `400` invalid reason, `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable with corrected payload |
| `/api/admin/patients/:id/restore` | POST | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable |
| `/api/admin/patients/:id/legal-hold` | POST | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `400` invalid reason, `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable with corrected payload |
| `/api/admin/patients/:id/legal-hold/remove` | POST | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable |
| `/api/admin/patients/:id/retention-status` | GET | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable, safe read |
| `/api/admin/patients/purge-eligible` | GET | canonical | Yes (Bearer JWT) | `PatientRetentionStatusDto[]` | `401` unauthorized, `403` role forbidden (admin only) | Retryable, safe read |
| `/api/admin/patients/:id/purge` | POST | canonical (feature-flagged execution) | Yes (Bearer JWT) | `PatientRetentionStatusDto` | `400` policy blocked/feature flag disabled, `401` unauthorized, `403` role forbidden (admin only), `404` patient not found | Retryable when policy conditions are met |
| `/api/admin/patients/:id/break-glass-access` | POST | canonical | Yes (Bearer JWT) | `BreakGlassAccessStatusDto` | `400` legal-hold inactive/invalid justification, `401` unauthorized, `403` role forbidden (admin only) | Retryable with corrected preconditions |
| `/api/admin/patients/:id/break-glass-access` | GET | canonical | Yes (Bearer JWT) | `BreakGlassAccessStatusDto` | `401` unauthorized, `403` role forbidden (admin only) | Retryable, safe read |

## Wave 12 Psychologist Notes + Profile + Context + Videos

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/psychologists/:id/notes` | GET | canonical | Yes (Bearer JWT) | `PsychologistNoteDto[]` | `401` unauthorized, `403` role/ownership forbidden | Retryable, safe read |
| `/api/psychologists/:id/notes/:noteId` | GET | canonical | Yes (Bearer JWT) | `PsychologistNoteDto` | `401` unauthorized, `403` role/ownership forbidden, `404` note missing | Retryable, safe read |
| `/api/psychologists/:id/notes` | POST | canonical | Yes (Bearer JWT) | `PsychologistNoteDto` | `400` validation, `401` unauthorized, `403` role/ownership forbidden | Retryable write |
| `/api/psychologists/:id/notes/:noteId` | PATCH | canonical | Yes (Bearer JWT) | `PsychologistNoteDto` | `400` validation, `401` unauthorized, `403` signed immutable/forbidden, `404` note missing | Retryable write |
| `/api/psychologists/:id/notes/:noteId/sign` | POST | canonical | Yes (Bearer JWT) | `PsychologistNoteDto` | `400` `CLINICAL_MINIMUM_DATASET_MISSING`, `401` unauthorized, `403` role/ownership forbidden, `404` note missing | Retryable write (idempotent final state) |
| `/api/psychologists/:id/patients/:patientId/context` | GET | canonical | Yes (Bearer JWT) | `PsychologistPatientContextDto` | `401` unauthorized, `403` role/ownership forbidden, `404` patient missing | Retryable, safe read |
| `/api/psychologists/:id/referrals` | GET | canonical | Yes (Bearer JWT) | `PsychologistReferralDto[]` | `401` unauthorized, `403` role/ownership forbidden | Retryable, safe read |
| `/api/psychologists/me/profile` | GET | canonical | Yes (Bearer JWT) | `PsychologistProfileDto` | `401` unauthorized, `403` psychologist only, `404` missing profile | Retryable, safe read |
| `/api/psychologists/me/profile` | PATCH | canonical | Yes (Bearer JWT) | `PsychologistProfileDto` | `400` validation, `401` unauthorized, `403` psychologist only, `404` missing profile | Retryable write |
| `/api/psychologists/:id/session-videos` | GET | canonical | Yes (Bearer JWT) | `SessionVideoItemDto[]` | `401` unauthorized, `403` role/ownership forbidden | Retryable, safe read |
| `/api/patients/:id/session-videos` | GET | canonical | Yes (Bearer JWT) | `SessionVideoItemDto[]` | `401` unauthorized, `403` role/ownership forbidden | Retryable, safe read |
| `/api/session-videos/:videoId/access` | GET | canonical | Yes (Bearer JWT) | `SessionVideoAccessDto` | `401` unauthorized, `404` video/session missing, `409` `SESSION_VIDEO_DOWNLOAD_BLOCKED` (`hold`/`purge_pending`) | Retryable read (policy-bound) |
| `/api/patients/me/data-requests` | POST | canonical | Yes (Bearer JWT) | `PatientDataRequestDto` | `400` validation, `401` unauthorized, `403` patient-only | Retryable write |
| `/api/patients/me/data-requests` | GET | canonical | Yes (Bearer JWT) | `PatientDataRequestDto[]` | `401` unauthorized, `403` patient-only | Retryable, safe read |
| `/api/patients/me/data-requests/:id` | GET | canonical | Yes (Bearer JWT) | `PatientDataRequestDto` | `401` unauthorized, `403` ownership forbidden, `404` request missing | Retryable, safe read |
| `/api/admin/patient-data-requests` | GET | canonical | Yes (Bearer JWT) | `PatientDataRequestDto[]` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager`) | Retryable, safe read |
| `/api/admin/patient-data-requests/:id/actions` | POST | canonical | Yes (Bearer JWT) | `PatientDataRequestDto` | `400` validation, `401` unauthorized, `403` role forbidden, `404` request missing, `409` invalid transition | Retryable write |
| `/api/admin/security-incidents` | POST | canonical | Yes (Bearer JWT) | `SecurityIncidentDto` | `400` validation, `401` unauthorized, `403` admin-only | Retryable write |
| `/api/admin/security-incidents` | GET | canonical | Yes (Bearer JWT) | `SecurityIncidentDto[]` | `401` unauthorized, `403` admin-only | Retryable, safe read |
| `/api/admin/security-incidents/:id` | PATCH | canonical | Yes (Bearer JWT) | `SecurityIncidentDto` | `400` validation, `401` unauthorized, `403` admin-only, `404` incident missing, `409` invalid transition | Retryable write |

## Admin Ops Hardening Endpoints

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/admin/ops/appointments` | GET | canonical | Yes (Bearer JWT) | `object[]` governance snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/patients` | GET | canonical | Yes (Bearer JWT) | `object[]` governance snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/staff` | GET | canonical | Yes (Bearer JWT) | `object[]` governance snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/settings` | GET | canonical | Yes (Bearer JWT) | `object[]` governance snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/resources` | GET | canonical | Yes (Bearer JWT) | `object[]` governance snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/billing` | GET | canonical | Yes (Bearer JWT) | `object` billing snapshot | `401` unauthorized, `403` admin only | Retryable, safe read |
| `/api/admin/ops/analytics-summary` | GET | canonical | Yes (Bearer JWT) | `object` analytics aggregates | `401` unauthorized, `403` admin only | Retryable, safe read |

## Pre-Session Window Endpoints (W8C-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/appointments/:id/pre-session-window` | GET | canonical | Yes (Bearer JWT) | `TelehealthSessionWindowDto` | `401` unauthorized, `403` ownership forbidden, `404` appointment not found | Retryable, safe read |

## Chat Window Endpoints (W8C-02)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/appointments/:id/chat-window` | GET | canonical | Yes (Bearer JWT) | `ChatWindowDto` | `401` unauthorized, `403` ownership forbidden, `404` appointment not found | Retryable, safe read |
| `/api/appointments/:id/chat/messages` | POST | canonical | Yes (Bearer JWT) | `ChatMessageDto` | `401` unauthorized, `403` ownership forbidden, `404` appointment not found, `409` chat window not open | Not idempotent |

## Audit Endpoints (W8D-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/audit/events` | GET | canonical | Yes (Bearer JWT) | `AuditEventDto[]` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only) | Retryable, safe read |

## Intake Draft Endpoints (W8D-02)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/patients/:id/intake-latest` | GET | canonical | Yes (Bearer JWT) | `IntakeDraftDto` | `401` unauthorized, `403` ownership forbidden | Retryable, safe read |
| `/api/patients/:id/intake-delta` | POST | canonical | Yes (Bearer JWT) | `IntakeDraftSavedResponseDto` | `401` unauthorized, `403` owner-only write, `409` `DRAFT_VERSION_CONFLICT` | Retryable after refresh |
| `/api/patients/:id/intake-draft/commit` | POST | canonical | Yes (Bearer JWT) | `IntakeDraftSavedResponseDto` (side effect: merges `patientIdentity` + `telehealthSafety` emergency fields into stored `users` / `patient_profiles` when PostgreSQL enabled, or stub user store in fallback) | `401` unauthorized, `403` owner-only write, `404` draft missing | Retryable |

## Notifications Endpoints (W8D-03)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/notifications` | GET | canonical | Yes (Bearer JWT) | `NotificationDto[]` (`type` includes `booking_submitted`, `booking_confirmed`, `chat_window_open`, `session_starting_soon`, `account_welcome`) | `401` unauthorized | Retryable, safe read |
| `/api/notifications/:id/read` | PATCH | canonical | Yes (Bearer JWT) | `NotificationDto` | `401` unauthorized, `404` notification not found | Retryable, idempotent |
| `/api/notifications/preferences` | GET | canonical | Yes (Bearer JWT) | `NotificationPreferenceDto` | `401` unauthorized | Retryable, safe read |
| `/api/notifications/preferences` | POST | canonical | Yes (Bearer JWT) | `NotificationPreferenceDto` | `401` unauthorized, `400` validation | Retryable write |

## Notifications Realtime Endpoints (W10A-01)

| Endpoint/Channel | Method/Direction | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/notifications/stream-token` | GET | canonical | Yes (Bearer JWT) | `{ socketToken, expiresInSeconds }` | `401` unauthorized | Retryable, safe read |
| `/notifications` namespace + `notifications:subscribe` | Client -> Server | canonical | Yes (socket token in handshake) | `{ ok: true }` | `{ ok: false, error }` | Retryable |
| `notifications:new` | Server -> Client | canonical | N/A | `NotificationDto` payload | N/A | N/A |

## Ops Intake Queue Endpoints (W8D-04)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/ops/intake-queue` | GET | canonical | Yes (Bearer JWT) | `IntakeQueueItemDto[]` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only) | Retryable, safe read |
| `/api/ops/intake-queue/:id/assign` | POST | canonical | Yes (Bearer JWT) | `IntakeQueueItemDto` | `401` unauthorized, `403` role forbidden, `404` queue item not found | Retryable write |

## Wave 10 Projection Endpoints

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/patients/:id/journey-timeline` | GET | canonical | Yes (Bearer JWT) | `PatientJourneyTimelineDto` | `401` unauthorized, `403` ownership/role forbidden | Retryable, safe read |
| `/api/patients/:id/appointments` | GET | canonical | Yes (Bearer JWT) | `PatientAppointmentsListResponseDto` (`upcoming` / `past` arrays of `PatientAppointmentSummaryDto`) | `401` unauthorized, `403` ownership/role forbidden | Retryable, safe read |
| `/api/patients/me/care-team` | GET | canonical | Yes (Bearer JWT) | `PatientCareClinicianDto[]` (optional `bio`, `profileImageUrl`) | `401` unauthorized, `403` role forbidden (patient only) | Retryable, safe read |
| `/api/patients/:id/sessions` | GET | canonical | Yes (Bearer JWT) | `SessionSummaryDto[]` | `401` unauthorized, `403` ownership/role forbidden | Retryable, safe read |
| `/api/patients/:id/mood-checkins` | GET | canonical | Yes (Bearer JWT) | `MoodCheckinsListResponseDto` | `401` unauthorized, `403` ownership/role forbidden | Retryable, safe read |
| `/api/patients/:id/mood-checkins` | POST | canonical | Yes (Bearer JWT) | `MoodCheckinItemDto` | `401` unauthorized, `403` owner patient only, `400` validation | Retryable write |
| `/api/psychologists/:id/pre-session-workspace` | GET | canonical | Yes (Bearer JWT) | `PsychologistPreSessionWorkspaceDto` | `401` unauthorized, `403` role/ownership forbidden | Retryable, safe read (supports readiness filters/sort) |
| `/api/psychologists/:id/sessions` | GET | canonical | Yes (Bearer JWT) | `SessionSummaryDto[]` | `401` unauthorized, `403` ownership/role forbidden | Retryable, safe read |
| `/api/sessions/:id` | GET | canonical | Yes (Bearer JWT) | `SessionDetailDto` | `401` unauthorized, `403` ownership/assignment forbidden, `404` session not found | Retryable, safe read |
| `/api/ops/insights` | GET | canonical | Yes (Bearer JWT) | `OpsInsightsDto` | `401` unauthorized, `403` role forbidden | Retryable, safe read |
| `/api/appointments/:id/readiness` | GET | canonical | Yes (Bearer JWT) | `TelehealthReadinessDto` | `401` unauthorized, `403` ownership/role forbidden, `404` appointment not found | Retryable, safe read |
| `/api/appointments/:id/readiness` | POST | canonical | Yes (Bearer JWT) | `TelehealthReadinessDto` | `401` unauthorized, `403` owner-patient only, `404` appointment not found | Retryable write (latest update wins) |
| `/api/appointments/:id` | GET | canonical | Yes (Bearer JWT) | `AppointmentDetailsDto` | `401` unauthorized, `403` ownership/role forbidden, `404` appointment not found | Retryable, safe read |
| `/api/appointments/:id/manage` | POST | canonical | Yes (Bearer JWT) | `AppointmentDetailsDto` | `400` reschedule validation (patient min lead, 2h lock before original start, max horizon), `401` unauthorized, `403` manage denied, `404` appointment not found, `409` invalid state transition | Retryable write |
| `/api/appointments/:id/join-attempt` | POST | canonical | Yes (Bearer JWT) | `JoinAttemptDecisionDto` | `401` unauthorized, `403` ownership/role forbidden, `404` appointment not found | Retryable decision call (audit event recorded each attempt) |
| `/api/appointments/:id/join-session` | POST | canonical | Yes (Bearer JWT) | `JoinSessionTokenDto` | `401` unauthorized, `403` ownership/role forbidden, `404` appointment not found, `409` session cannot be joined now | Retryable write (new token on each allowed request) |
| `/api/ops/telehealth-insights` | GET | canonical | Yes (Bearer JWT) | `TelehealthInsightsDto` | `401` unauthorized, `403` role forbidden | Retryable, safe read |
| `/api/ops/readiness-reminders/dispatch` | POST | canonical | Yes (Bearer JWT) | `ReadinessReminderDispatchDto` | `401` unauthorized, `403` role forbidden | Retryable write (window-level dedupe) |

## Analytics Endpoints (W8E-01)

| Endpoint | Method | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/api/analytics/events` | POST | canonical | Yes (Bearer JWT) | `AnalyticsEventDto` | `401` unauthorized, `400` validation | Retry-safe with idempotency key |
| `/api/analytics/events` | GET | canonical | Yes (Bearer JWT) | `AnalyticsEventDto[]` | `401` unauthorized, `403` role forbidden (`admin`/`practice_manager` only) | Retryable, safe read |

## Realtime Chat Events (W8C-02/W8C-03)

| Channel | Direction | Contract status | Auth required | Success response | Error responses | Retryability |
|---|---|---|---|---|---|---|
| `/chat` namespace handshake | Client -> Server | canonical | Yes (Bearer JWT in handshake) | socket connected | unauthorized handshake disconnect | Client should reconnect with valid token |
| `chat:join` | Client -> Server | canonical | Yes | `{ ok: true, appointmentId, window, messages, presence }` | `{ ok: false, error }` | Retryable |
| `chat:send` | Client -> Server | canonical | Yes | `{ ok: true, message, window }` | `{ ok: false, error }` (`403/404/409` equivalents) | Retryable by explicit user action |
| `chat:message` / `chat:presence` / `chat:window` | Server -> Client | canonical | N/A | broadcast event payloads | N/A | N/A |

## Error Envelope Baseline

| Scenario | HTTP status | `error` | `message` example | `code` |
|---|---|---|---|---|
| Validation failure | 400 | `Bad Request` | `password must be longer than or equal to 8 characters` | optional |
| Invalid credentials | 401 | `Unauthorized` | `Invalid credentials` | optional |
| Invalid/missing token | 401 | `Unauthorized` | `Unauthorized` | optional |
| Role forbidden | 403 | `Forbidden` | `Only patients can create booking requests` | optional |
| Referral upload role forbidden | 403 | `Forbidden` | `Only patients can upload referral documents` | optional |
| Referral review role forbidden | 403 | `Forbidden` | `Only admin and practice_manager can review referrals` | optional |
| Data export role forbidden | 403 | `Forbidden` | `Only patients can request and download personal exports` | optional |
| Admin psychologist management role forbidden | 403 | `Forbidden` | `Only admin can manage psychologist accounts` | optional |
| Admin patient retention management role forbidden | 403 | `Forbidden` | `Only admin can manage patient deletion and retention controls` | optional |
| Admin ops governance role forbidden | 403 | `Forbidden` | `Only admin can access admin ops governance endpoints` | optional |
| Break-glass unavailable without legal hold | 400 | `Bad Request` | `Break-glass access is only available while legal hold is active` | optional |
| Consent lifecycle non-patient role | 400 | `Bad Request` | `Consent lifecycle is only applicable to patient accounts` | optional |
| Clinical note minimum dataset missing | 400 | `Bad Request` | `Cannot sign note until all required clinical dataset fields are complete.` | `CLINICAL_MINIMUM_DATASET_MISSING` |
| Export blocked by legal hold | 409 | `Conflict` | `Data export is blocked while legal hold is active` | optional |
| Appointment window ownership denied | 403 | `Forbidden` | `You cannot access this appointment window` | optional |
| Unknown clinician filter | 404 | `Not Found` | `Clinician not found` | optional |
| Unknown appointment id | 404 | `Not Found` | `Appointment not found` | optional |
| Booking ownership denied | 403 | `Forbidden` | `You cannot access this booking request` | optional |
| Slot conflict | 409 | `Conflict` | `Selected slot is no longer available` | optional |
| Migration state missing (health readiness) | 200 (`status=degraded`) | N/A | `status: degraded` and `database.migrationsReady: false` | N/A |
| Chat window closed/locked | 409 | `Conflict` | `Chat window is not open for this appointment` | optional |
| Audit endpoint role denied | 403 | `Forbidden` | `Only admin and practice_manager can read audit events` | optional |
| Intake draft version conflict | 409 | `Conflict` | `Draft has changed on another device. Refresh and retry.` | `DRAFT_VERSION_CONFLICT` |
| Notification missing | 404 | `Not Found` | `Notification not found` | optional |
| Intake queue role denied | 403 | `Forbidden` | `Only admin and practice_manager can access intake queue` | optional |
| Intake queue item missing | 404 | `Not Found` | `Queue item not found` | optional |
| Analytics read role denied | 403 | `Forbidden` | `Only admin and practice_manager can read analytics events` | optional |
| Future invalid transition | 409 | `Conflict` | `Lifecycle transition is not allowed` | `LIFECYCLE_TRANSITION_DENIED` |

## Demo psychologist workspace mapping

- In stub mode, auth user `user_psychologist_001` is mapped to seeded clinician id `clinician_001` when resolving workspace appointment rows so the dashboard matches booking seed data.

## Ownership and Governance

- Contract owner: Backend
- Consumer owners: Frontend + Ops tooling
- Update process:
  1. Update Swagger DTOs/controllers
  2. Update this matrix + `API_CONTRACT.md`
  3. Add/adjust e2e tests for changed behavior

## Persistence Governance Notes (W9)

- PostgreSQL environments must execute `db:migrate` before service startup.
- In-memory fallback mode is allowed for local/dev without `DATABASE_URL`.
- Production/CI runtime should treat degraded `/api/health` (DB connected false or migrationsReady false) as not-ready.
