# Retention and Deletion Policy (Australia)

This document defines the backend policy for patient data retention, soft deletion, legal hold, and purge eligibility.

It is intended as an implementation and governance baseline for Wave 11 (`W11H-01`), not legal advice.

---

## 1) Purpose

- Protect patient privacy and safety.
- Meet Australian recordkeeping expectations for health data.
- Prevent irreversible deletion before minimum retention windows.
- Ensure deletion behavior is auditable and role-controlled.

---

## 2) Policy Baseline (AU)

Default operational baseline (until jurisdiction-specific legal sign-off overrides):

- **Adults:** retain records for **minimum 7 years** from last health service interaction.
- **Minors:** retain records until the person turns **25 years old**.
- **Legal/complaint hold:** retain beyond baseline when complaint, claim, investigation, or legal process exists.

Notes:

- Australian obligations can vary by jurisdiction and provider context.  
- This policy must be reviewed with legal/compliance before enabling physical purge automation in production.

---

## 3) Scope of Data Covered

This policy applies to all patient-linked records, including but not limited to:

- account/profile data
- intake drafts and committed intake payloads
- booking requests and appointments
- session metadata
- psychologist notes linked to patient
- referral document metadata
- notifications and audit references involving patient identifiers
- session video metadata and access logs

If data is stored in external systems (video/object storage), equivalent retention and purge controls must be enforced there as well.

---

## 4) Lifecycle States

## 4.1 Active

- Patient account is active and visible in normal app flows.
- Standard read/write behavior applies by role.

## 4.2 Soft Deleted

- Account is marked deleted but data is retained.
- Patient is blocked from login and normal access.
- Records are excluded from standard operational lists unless explicitly requested by privileged workflows.
- No physical deletion occurs at this stage.

## 4.3 Legal Hold

- Any soft-deleted or active record can be placed on hold.
- Purge is blocked while hold is active, regardless of retention age.
- Hold requires reason, actor, and timestamps.

## 4.4 Purge Eligible

- Record passed required retention age and has no legal hold.
- Becomes eligible for deletion workflow.
- Eligibility does not imply immediate deletion; approval and execution controls still apply.

---

## 5) Retention Clock Rules

Retention clock starts from the latest clinically relevant event:

- latest appointment end time, or
- latest signed clinical note timestamp, or
- latest referral/clinical activity timestamp (if later).

For minors, compute both:

- date when person turns 25, and
- 7 years from last interaction,

then use whichever date is later.

Derived field:

- `retentionUntil` (UTC timestamp/date) per patient.

---

## 6) Deletion Semantics

## 6.1 Soft Delete (default action)

Soft delete updates patient state fields:

- `deletedAt`
- `deletionReason`
- `deletedByUserId`
- optional `deletionTicketId` / `caseId`

Behavior:

- disable authentication and token issuance for deleted account.
- hide from default clinical/admin queues.
- keep data available for compliance exports/audit and authorized legal workflows.

## 6.2 Hard Delete (restricted)

Allowed only when:

- current time >= `retentionUntil`
- legal hold is not active
- policy approval controls are satisfied

Hard delete execution must:

- remove or irreversibly anonymize data across all systems
- emit purge audit event with batch/job traceability
- produce purge report artifact

---

## 7) Role and Permission Model

Minimum permission expectations:

- `admin`: may soft delete, restore, place/remove hold, approve purge workflow.
- `practice_manager`: may request deletion workflow but cannot execute hard purge by default.
- `psychologist`: no deletion rights.
- `patient`: may request deletion, cannot execute.

Recommended explicit permissions (example):

- `patient.delete.request`
- `patient.delete.soft`
- `patient.delete.restore`
- `patient.delete.hold.manage`
- `patient.delete.purge.execute`

---

## 8) API Contract Outline (Proposed)

Patient/account deletion:

- `POST /api/admin/patients/:id/soft-delete`
- `POST /api/admin/patients/:id/restore`

Hold management:

- `POST /api/admin/patients/:id/legal-hold`
- `DELETE /api/admin/patients/:id/legal-hold`

Retention visibility:

- `GET /api/admin/patients/:id/retention-status`
- `GET /api/admin/patients/purge-eligible`

Purge execution (restricted):

- `POST /api/admin/patients/:id/purge`

All write endpoints must emit auditable events and return stable error codes for policy violations.

---

## 9) Audit and Logging Requirements

Required audit events:

- `patient_soft_deleted`
- `patient_restored`
- `patient_legal_hold_enabled`
- `patient_legal_hold_removed`
- `patient_purge_approved`
- `patient_purged`
- `patient_purge_denied_policy`

Audit metadata minimum:

- actor user ID + role
- target patient ID
- timestamp
- reason code + free-text note
- request correlation ID

PII-safe logging:

- do not log full clinical payloads in app logs
- log identifiers and policy outcomes only

---

## 10) Session Video Retention Alignment

Session videos and derived artifacts must follow the same patient retention lifecycle:

- on soft delete: block new playback access except privileged compliance/legal workflows
- on legal hold: preserve content and access evidence
- on purge: delete video objects, derivatives, transcripts, and revoke access tokens

Video deletion must be idempotent and auditable.

---

## 11) Operational Jobs

Required scheduled jobs:

1. **Retention computation job**
   - recalculates `retentionUntil` for changed patient records.
2. **Purge eligibility job**
   - marks candidates where retention elapsed and no hold exists.
3. **Generated export cleanup job**
   - removes temporary export artifacts after configured TTL.
4. **Purge execution job** (optional queued mode)
   - performs controlled hard delete with retries and reports.

---

## 12) Data Model Additions (Proposed)

Patient-level fields:

- `deleted_at timestamptz null`
- `deletion_reason text null`
- `deleted_by_user_id text null`
- `legal_hold_active boolean not null default false`
- `legal_hold_reason text null`
- `legal_hold_set_by_user_id text null`
- `legal_hold_set_at timestamptz null`
- `retention_until timestamptz null`
- `purged_at timestamptz null`

Indexing:

- index on `deleted_at`
- index on `legal_hold_active`
- index on `retention_until`

---

## 13) Test Plan Requirements

Backend:

- soft delete blocks patient login
- soft-deleted patient excluded from standard lists
- retention date calculations for adult/minor scenarios
- legal hold blocks purge even after retention date
- purge denied before retention date
- purge success path emits full audit chain

Frontend/admin:

- deletion actions show warning + reason capture
- retention status is visible to authorized users
- purge UI only enabled for eligible/no-hold records

---

## 14) Open Compliance Decisions

Before production rollout, confirm with legal/compliance:

1. Jurisdiction policy table (NSW/VIC/ACT/other) and conflict rule.
2. Exact definition of "last health service interaction".
3. Whether any records require indefinite retention by category.
4. Approved hard-delete vs irreversible anonymization strategy.
5. Governance workflow for purge approval (single vs dual control).

---

## 15) Implementation Order

1. Add schema fields + migrations.
2. Implement soft delete + restore endpoints and role guards.
3. Implement retention calculator and retention status endpoint.
4. Implement legal hold endpoints.
5. Implement purge eligibility computation.
6. Implement hard purge execution (behind feature flag).
7. Wire session video retention/deletion parity.
8. Complete API docs, matrix, and e2e tests.

---

## 16) Wave 13 Governance Cross-Links

To keep retention/deletion controls aligned with broader compliance governance, treat these contracts as linked controls:

- Consent lifecycle: `GET/POST /api/auth/consents*` (account setup + re-consent enforcement).
- Legal hold + break-glass: `POST/GET /api/admin/patients/:id/break-glass-access`.
- Session video governance: `GET /api/session-videos/:videoId/access` with `active|hold|purge_pending` policy status.
- Patient access/correction requests:
  - `POST/GET /api/patients/me/data-requests`
  - `GET /api/patients/me/data-requests/:id`
  - `GET/POST /api/admin/patient-data-requests*`
- Security incident + NDB workflow:
  - `POST/GET /api/admin/security-incidents`
  - `PATCH /api/admin/security-incidents/:id`

These cross-links ensure retention-state decisions, privacy-rights workflows, breach workflows, and video governance remain policy-consistent and auditable.

