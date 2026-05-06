# Nest Migration Execution Plan

Actionable migration plan from legacy Django/DRF backend to NestJS TypeScript without feature regressions.

## Scope and Principles

- Preserve frontend behavior and contracts during migration windows.
- Prefer phased module cutover over big-bang rewrite.
- Keep compatibility endpoints explicit and time-bounded.
- Treat booking, payments, and privacy operations as risk-critical.

## Phase 0 - Foundations (Week 1)

## Objectives

- Establish Nest project conventions and cross-cutting standards.

## Deliverables

- Module skeletons under `src/modules/*`
- common guards/decorators/filters/interceptors baseline
- validation + error envelope standard
- OpenAPI setup and docs exposure

## Exit criteria

- New modules compile and boot.
- Docs build includes all currently migrated controllers.

## Phase 1 - Contract governance and mapping (Weeks 1-2)

## Objectives

- Create one migration map from Django endpoints to Nest endpoints.

## Deliverables

- route-by-route matrix with:
  - legacy path
  - target Nest controller/action
  - lifecycle status (`canonical`, `compat`, `deprecated`)
  - removal target date for compat routes

## Exit criteria

- 100% of active endpoints mapped and status-tagged.

## Phase 2 - Low-risk module migration (Weeks 2-4)

## Suggested order

1. `CoreModule`
2. `ResourcesModule`
3. `ServicesModule`
4. `AuditModule` (read paths first)

## Exit criteria

- Functional parity for mapped endpoints.
- Contract tests pass against Nest responses.

## Phase 3 - Identity and onboarding migration (Weeks 4-6)

## Modules

- `AuthModule`
- `UsersModule` (including setup wizard, referrals, notifications)

## Risk controls

- Central role/permission guard coverage
- backward-compatible response envelopes where required

## Exit criteria

- Login/setup/referral workflows pass end-to-end smoke tests.
- No role access regressions in mixed-role endpoints.

## Phase 4 - Critical-flow migration (Weeks 6-9)

## Modules

- `AppointmentsModule`
- `BillingModule`

## Risk controls

- idempotency keys for booking/payment/complete
- concurrent request tests for session transitions
- webhook reconciliation checks for payment states

## Exit criteria

- booking -> payment -> confirmation flow stable in production-like load test
- duplicate charge/booking protection verified

## Phase 5 - Cutover and deprecation (Weeks 9-10)

## Objectives

- Shift frontend and integrations to canonical Nest endpoints.

## Deliverables

- deprecation notices finalized
- compat endpoint traffic reduced to threshold
- controlled removal of deprecated routes

## Exit criteria

- No high-severity errors from removed compat paths.
- all critical dashboards and alerts green.

## Testing Strategy

- Contract tests per endpoint (status code, shape, error model)
- Concurrency tests for booking/payment/session completion
- Permission matrix tests for all protected routes
- End-to-end smoke suite for top business journeys

## Operational Readiness

- SLO dashboard: latency, error rate, queue depth, auth failure ratio
- Alert coverage:
  - payment failures
  - referral backlog
  - transcript processing backlog
- Runbook links required for each production alert

## Ownership Template (per work item)

- Owner:
- Module:
- Priority:
- Dependencies:
- Target date:
- KPI:
- Risk if delayed:
