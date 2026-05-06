# Backend System Overview (NestJS v2)

Professional architecture map and execution plan for migrating and operating the Clink backend on NestJS + TypeScript.

## A) Executive Summary

### Current state snapshot

- **Platform direction:** clear domain boundaries and strong compliance focus.
- **Main migration goal:** move from Django/DRF routes to Nest modules without contract regressions.
- **Primary risk zones:** booking/payment concurrency, mixed-role authorization drift, and compatibility endpoint sprawl.

### Top 5 risks now

1. Duplicate route contracts during migration causing frontend confusion.
2. Missing idempotency on booking/payment write paths.
3. Role and permission drift in shared manager/admin endpoints.
4. Oversized modules reducing testability and release confidence.
5. Operational blind spots without SLO-driven dashboards and queue alerts.

### 90-day target outcomes

- Endpoint catalog fully tagged as `canonical`, `compat`, or `deprecated`.
- Booking/payment/session critical mutations idempotent and concurrency-tested.
- Nest modules fully split by bounded context and backed by service-layer tests.
- Core observability and compliance retention automation operational.

## B) Nest Architecture Snapshot

## Module ownership

- `AuthModule` -> JWT, login/register/reset, consent endpoints, onboarding access gates
- `UsersModule` -> user CRUD, profile/security, mixed-role user admin
- `ServicesModule` -> services catalog, clinician profiles, directory filters
- `AppointmentsModule` -> booking, availability, scheduling, session lifecycle, media hooks
- `BillingModule` -> invoices, payments, claims, webhook handling, receipts
- `ResourcesModule` -> resource content management and delivery
- `AuditModule` -> audit log query APIs and compliance reports
- `CoreModule` -> health/version/system contact/utilities

## Cross-cutting layers

- `common/guards` -> role and permission guards
- `common/decorators` -> current user, permissions metadata
- `common/filters` -> consistent error envelope
- `common/interceptors` -> request tracing and response normalization
- `common/pipes` -> validation and contract safety

## C) Domain Health Cards

## Auth and users

- **Status:** mature behavior, migrate with minimal contract changes.
- **Key risk:** permission drift on mixed-role endpoints.
- **Next actions:** central permission map, route metadata decorators, and auth contract tests.

## Appointments and sessions

- **Status:** function-rich but state-transition heavy.
- **Key risk:** race conditions in booking/pay/complete flows.
- **Next actions:** idempotency keys, optimistic locking strategy, and transition-state test matrix.

## Billing and payments

- **Status:** canonical payment contract direction is strong.
- **Key risk:** webhook reconciliation and duplicate submissions.
- **Next actions:** event reconciliation spec, failure matrix, operator runbooks.

## Services and directory

- **Status:** good domain boundaries possible early.
- **Key risk:** identity contract mismatch (`user_id` vs `profile_id`).
- **Next actions:** single response contract helper and unified pagination/filter docs.

## Resources

- **Status:** straightforward CRUD lifecycle.
- **Key risk:** limited editorial governance for regulated updates.
- **Next actions:** publication state machine and audit trail hooks.

## Audit and core

- **Status:** strong operational utility footprint.
- **Key risk:** retention cost and query scaling.
- **Next actions:** retention automation and archival policy jobs.

## D) 90-Day Execution Plan

## Phase A: Contract governance (high value, low risk)

- Add status tags in matrix: `canonical`, `compat`, `deprecated`.
- Remove route ambiguity where multiple aliases are no longer needed.
- Publish deprecation timeline with owner and target date.

**KPIs**
- 100% endpoint status coverage.
- 0 undocumented compatibility aliases.

## Phase B: Reliability hardening

- Enforce idempotency keys for booking/payment/complete mutations.
- Standardize write-error envelope and retry semantics.
- Add concurrent request test suites for booking/payment/session transitions.

**KPIs**
- Duplicate booking and duplicate charge incidence < 0.1%.
- 100% critical write routes protected by idempotency middleware/guard.

## Phase C: Module decomposition and testability

- Split large controllers/services by bounded context:
  - `appointments/booking`
  - `appointments/session`
  - `appointments/artifacts`
- Move business logic into use-case services.
- Keep controllers thin and transport-focused.

**KPIs**
- No critical service file over agreed complexity threshold.
- Core flow unit/integration coverage target reached.

## Phase D: Operability and compliance automation

- Define SLOs: latency, error rate, queue depth, auth failures.
- Add runbook-linked alerts for referrals, payments, transcript backlog.
- Implement retention and archival jobs aligned with privacy policy.

**KPIs**
- SLO dashboard live and reviewed weekly.
- Alert-to-runbook mapping complete.
- Retention jobs scheduled and monitored.

## E) Engineering Governance Standards

## API lifecycle

- `canonical`: actively maintained, frontend target.
- `compat`: temporary alias for migration transition.
- `deprecated`: scheduled for removal with announced timeline.

## Versioning policy

- Add explicit versioning only when backward compatibility cannot be preserved.
- Keep additive changes non-breaking where possible.

## Error contract

- Single error envelope across all modules with stable codes and operator/debug fields.

## Idempotency policy

- Required for all financial and booking-critical mutation endpoints.
- Replay behavior and expiry window documented.

## Authorization policy

- Route-level guard required for protected endpoints.
- Permission checks centralized and tested; no page-specific ad hoc role checks.

## F) Owner Map

| Module | Primary ownership | Main risk |
|---|---|---|
| `AuthModule` + `UsersModule` | Identity and access team | Permission drift across shared endpoints |
| `AppointmentsModule` | Scheduling and session team | Concurrency and state-transition complexity |
| `BillingModule` | Financial integrity team | Webhook consistency and duplicate submission risk |
| `ServicesModule` | Directory and catalog team | Identity contract consistency |
| `ResourcesModule` | Content operations | Editorial governance and auditability |
| `AuditModule` | Compliance and security | Data retention and query performance |
| `CoreModule` | Platform operations | Observability and support tooling maturity |

## G) Operating Rhythm

- `API_CONTRACT.md`: behavior semantics.
- `API_CONTRACT_MATRIX.md`: route/method status and lifecycle.
- `BACKEND_SYSTEM_OVERVIEW.md`: executive architecture and execution roadmap.

Update all three together whenever route behavior, ownership, or lifecycle status changes.
