# Clink Platform Overview (Unified, Enhanced)

Unified product and system overview across frontend and backend, rewritten for execution clarity during NestJS migration.

## 1) Product Summary

Clink is an Australian psychology clinic platform with role-based experiences for:

- public visitors
- patients
- psychologists
- practice managers
- admins

Core pillars:

- discovery and onboarding
- clinical booking and telehealth delivery
- billing and Medicare workflows
- documentation, notes, recordings, and transcripts
- privacy, consent, and compliance operations

## 2) Current Capability Coverage

## Frontend (current shipped scope)

- Public site and conversion journey:
  - homepage, services, about, contact, telehealth requirements, rebates
  - public resources and privacy policy
  - guided "get matched" flow
- Auth and route protection:
  - login/register/password reset
  - role-aware protected routing and redirect behavior
- Patient experience:
  - setup wizard and booking readiness
  - multi-step booking flow (service, clinician, slot, details, payment, confirmation)
  - appointments, invoices, account, resources, recordings
- Psychologist experience:
  - dashboard, schedule, caseload, notes, profile, recordings
- Manager and admin operations:
  - user/staff/patient/appointment management
  - billing and analytics views
  - referrals, data-deletion queue, audit-focused workflows
- Shared session UX:
  - video session room
  - cross-role recordings area

## Backend (legacy Django/DRF shipped scope)

- `users`: auth, profile, dashboards, setup wizard, referral queue, progress notes, notifications
- `appointments`: booking, availability, scheduling actions, video/token, recordings/transcripts
- `services`: catalog, clinician profiles, specialization and availability
- `billing` + `payments`: invoices, claims, payment intents, webhook, receipts
- `resources`: content delivery and management
- `audit`: audit logs with filtering/stats
- `core`: health/version, contact, support utility endpoints

## 3) End-to-End Flow Coverage

Supported operational journeys:

1. Public discovery -> register/login -> patient setup -> booking -> payment -> session -> recording/transcript follow-up
2. Psychologist flow -> schedule + caseload + notes + patient record access/export
3. Manager/admin flow -> practice/system-wide oversight across users, appointments, billing, resources, referrals
4. Compliance flow -> consent capture, privacy actions, data requests/deletion, audit traceability

## 4) Known Strengths

- Strong multi-role product surface already proven.
- Full booking + session + payment path exists.
- Contract discipline already present (`API_CONTRACT.md`, `API_CONTRACT_MATRIX.md`).
- Compliance and governance features are not an afterthought.

## 5) Primary Enhancement Opportunities

1. Contract governance: standardize canonical vs compatibility endpoints.
2. Reliability: idempotency + concurrency control on critical write paths.
3. Maintainability: move from large view/controller surfaces to bounded Nest modules and service-layer use cases.
4. Operability: define SLO dashboards and runbook-linked alerts.
5. Policy consistency: central role/permission model with single guard strategy.

## 6) Target State (NestJS)

Platform will be organized by bounded modules:

- `AuthModule`
- `UsersModule`
- `AppointmentsModule`
- `BillingModule`
- `ServicesModule`
- `ResourcesModule`
- `AuditModule`
- `CoreModule`

Cross-cutting standards:

- consistent DTO validation and error envelope
- centralized authorization decorators/guards
- endpoint lifecycle tags (`canonical`, `compat`, `deprecated`)
- idempotency policy for booking/payment/session finalization

## 7) Delivery KPIs (recommended)

- Endpoint governance:
  - 100% routes classified as canonical/compat/deprecated
  - 0 undocumented aliases
- Reliability:
  - duplicate booking/payment incidents < 0.1%
  - 100% critical writes protected by idempotency semantics
- Maintainability:
  - critical domain files below agreed complexity threshold
  - unit + integration coverage goals met per module
- Operability:
  - dashboard for latency, error rate, queue depth, auth failures
  - runbook-linked alerts for payment/referral/transcript backlogs

## 8) Documentation Source of Truth

- This file: platform map and capability status
- `BACKEND_SYSTEM_OVERVIEW.md`: backend architecture and 90-day execution plan
- `API_CONTRACT.md`: endpoint behavior semantics
- `API_CONTRACT_MATRIX.md`: endpoint/method status and lifecycle tags

Update these documents together whenever route behavior, ownership, lifecycle, or role access changes.
