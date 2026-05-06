# Data layer: PostgreSQL schema and relationships

**Historical DDL** lives in **`node-pg-migrate`** under `backend/migrations/` (`npm run db:migrate:legacy`). **New schema changes** should use **Prisma Migrate**: add folders under `backend/prisma/migrations/` (typically via `npx prisma migrate dev`) and apply with **`npm run db:migrate`**, which runs legacy migrate first, then **`prisma migrate deploy`**. The baseline migration (`20250502120000_*`) is a no-op `SELECT 1` so existing databases already built by legacy migrate do not get duplicate `CREATE` statements. On first use of Prisma Migrate against such a database, `prisma migrate deploy` returns **P3005** (schema not empty); `scripts/prisma-migrate-after-legacy.cjs` handles that by running **`prisma migrate resolve --applied`** for the baseline, then **`migrate deploy`** again. Repeat runs are idempotent. Introspection caveats (check constraints, expression indexes) are summarized in **`backend/prisma/SCHEMA_NOTES.md`**.

**Prisma** (`@prisma/client`, `backend/prisma/schema.prisma`) is the **runtime database client**: domain code uses **`PrismaService`**. **`DatabaseService`** probes connectivity with **`users.findFirst`** and migration state with **`pgmigrations.findFirst`** (no raw SQL). **`isEnabled()`** is true only after a successful Prisma startup ping when **`DATABASE_URL`** is set. After legacy or manual SQL changes, run **`npx prisma db pull`** (`npm run prisma:pull`), then **`npx prisma generate`** (or **`npm run build`**, which runs `prisma generate` first). Validate with **`npm run prisma:validate`** in CI and locally when editing the schema.

When **`DATABASE_URL` is unset**, the backend **falls back to in-memory Maps** for many domains (see logs at startup). That path is useful for quick demos but **does not enforce SQL constraints** and can diverge from production behaviour. For release validation, always run with **`DATABASE_URL` set** and migrations applied.

## Environment checklist (recommended setups)

| Setup | `DATABASE_URL` | `npm run db:migrate` | Purpose |
|--------|----------------|----------------------|---------|
| **Production-like** | Real Postgres URL | Yes (all migrations up) | Correct FKs, constraints, indexes; matches Docker Compose DB |
| **CI / local QA** | `postgres://…@localhost:5432/clink` (or test DB) | Yes | Same as above |
| **Fast smoke (memory)** | Unset | Skip | In-memory stores only; good for unit/e2e that mock DB |

Optional: after migrate, run **`npm run db:verify`** (see below) to confirm all expected tables exist.

## Entity overview (logical relationships)

Identity and profiles:

- **`users`** — all login accounts (`user_id`, `email`, `role`, …).
- **`patient_profiles`** — **1:1** with `users` where role is patient (`user_id` **FK → users**, `ON DELETE CASCADE`).
- **`psychologist_profiles`** — **1:1** with psychologist users (`user_id` **FK → users**).

Scheduling and intake (core patient ↔ clinician linkage):

- **`booking_requests`** — patient booking attempts (`patient_id`, **`clinician_id`** as **text**, `slot_id`, `state`, …).  
  **Note:** `clinician_id` uses **operational ids** such as `clinician_001`, **not** necessarily `users.user_id`. The app maps `clinician_*` ↔ `user_psychologist_*` in code.
- **`appointments`** — scheduled sessions (`patient_id`, **`clinician_id`** text, `status`, times).  
  **No FK** to `users` in baseline: referential integrity for patient/clinician ids is **enforced in application logic** and seeds.
- **`intake_drafts`** — intake JSON keyed by `patient_id` (aligned with patient user id).
- **`intake_queue_assignments`** — ops assignment (`queue_item_id`, `assigned_clinician_id`).

Clinical / PHI-adjacent:

- **`psychologist_notes`**, **`psychologist_profile_bio`** (+ optional **`profile_image_url`** column from later migration), **`session_videos`** — psychologist/patient/session linkage by **text ids** (`psychologist_id`, `patient_id`, `session_id`, `clinician_id`).
- **`referral_documents`** — referrals workflow (`patient_id`, status, SLA fields).
- **`patient_consents`**, **`patient_data_requests`**, retention/legal columns on **`users`** — consent and privacy workflows.

Operational:

- **`audit_events`**, **`notifications`**, **`analytics_events`**, **`telehealth_readiness`**, **`security_incidents`**, **`chat_messages`**, **`chat_presence`** — keyed by ids used in APIs.

## Referential integrity: what the database enforces vs the app

**Enforced in PostgreSQL (examples):**

- `patient_profiles.user_id` → `users.user_id`
- `psychologist_profiles.user_id` → `users.user_id`
- `booking_idempotency.booking_request_id` → `booking_requests`
- `chat_messages.appointment_id` → `appointments` (`ON DELETE CASCADE`)
- `chat_presence` → `appointments`
- Check constraints on enums (`appointments.status`, `booking_requests.state`, …)

**Typically application-layer only (text ids, no FK):**

- `appointments.patient_id`, `appointments.clinician_id` → allows flexible seeds and **clinician_*** vs **user_*** conventions; join to `users` is by convention.
- `psychologist_notes.psychologist_id` / `patient_id` / `session_id` — indexed for queries, not FK-linked to `appointments` in schema.

This split is intentional for iterative shipping but is the main place **orphan rows** can appear if seeds or imports disagree. Hardening option for later: add FKs where every child row is guaranteed to reference real parents (often after normalizing **one** id style for clinicians everywhere).

## Diagram (high level)

```mermaid
erDiagram
  users ||--o| patient_profiles : "user_id FK"
  users ||--o| psychologist_profiles : "user_id FK"
  booking_requests ||--o| booking_idempotency : "booking_request_id FK"
  appointments ||--o{ chat_messages : "appointment_id FK"
  appointments ||--o{ chat_presence : "appointment_id FK"
  users {
    text user_id PK
    text email
    text role
  }
  appointments {
    text appointment_id PK
    text patient_id
    text clinician_id
    text status
  }
```

## Verification script

From `backend/`:

```bash
DATABASE_URL="postgres://user:pass@host:5432/dbname" npm run db:verify
```

Exits `0` when expected public tables exist and migration history is present; exits `1` with a clear message otherwise.

## Related files

- Migrations: `backend/migrations/*.js`
- DB access: `backend/src/modules/core/database.service.ts`
- Prisma: `backend/prisma/schema.prisma`, `backend/src/modules/prisma/prisma.service.ts` (`PrismaService` extends `PrismaClient`; skips `$connect` when `DATABASE_URL` is unset, matching in-memory e2e behaviour)
- Dual-path services (example): `backend/src/modules/appointments/appointments.service.ts` (`databaseService.isEnabled()` branches)
