# Clink Backend (NestJS + TypeScript)

This is the backend workspace for the NestJS migration.

## Project Structure

- `src/modules/*` -> domain modules (`auth`, `users`, `appointments`, `billing`, `services`, `resources`, `audit`, `core`)
- `src/common/*` -> cross-cutting guards/decorators/filters/interceptors/pipes
- `docs/BACKEND_SYSTEM_OVERVIEW.md` -> backend architecture and execution plan
- `docs/CLINK_PLATFORM_OVERVIEW.md` -> unified frontend/backend product map
- `docs/NEST_MIGRATION_EXECUTION_PLAN.md` -> phase-by-phase Nest migration playbook

## Run locally

```bash
npm install
npm run start:dev
```

## Run with Docker PostgreSQL

From repo root:

```bash
docker compose up -d postgres
cp backend/.env.example backend/.env
```

Then start backend:

```bash
npm --prefix backend run db:migrate
npm --prefix backend run start:dev
```

When `DATABASE_URL` is set, backend services use PostgreSQL persistence.
Run migrations before app startup to create/update schema.
If `DATABASE_URL` is missing, the app falls back to in-memory stores for local/dev compatibility.

## Migration commands

From `backend/` directory:

```bash
npm run db:migrate
npm run db:rollback
npm run db:create -- add-new-change
```

## Migration run order by environment

### Dev (local Docker PostgreSQL)

From repo root:

```bash
docker compose up -d postgres
cp backend/.env.example backend/.env
DATABASE_URL="postgres://clink:clink_dev_password@localhost:5432/clink" npm --prefix backend run db:migrate
npm --prefix backend run start:dev
```

### CI (test and verification pipeline)

```bash
docker compose up -d postgres
DATABASE_URL="postgres://clink:clink_dev_password@localhost:5432/clink" npm --prefix backend run db:migrate
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test -- --runInBand
```

### Prod (release/startup order)

```bash
# 1) deploy artifact/image
# 2) run migrations once
DATABASE_URL="postgres://<user>:<password>@<host>:5432/<db>" npm --prefix backend run db:migrate
# 3) start service
npm --prefix backend run start:prod
```

Rules:

- Always run `db:migrate` before service startup when using PostgreSQL.
- Never run `db:rollback` in automated production startup.
- Keep one migration runner per deploy (avoid concurrent migration jobs).

## Data backfill runbook (W9-06D)

- Runbook: `docs/W9_DATA_BACKFILL_RUNBOOK.md`
- Script templates:
  - `scripts/backfill/export_snapshot.sh`
  - `scripts/backfill/import_snapshot.sh`
  - `scripts/backfill/verify_snapshot.sh`

Before first use:

```bash
chmod +x scripts/backfill/*.sh
```

Default local port is `3001`.

Swagger docs are served at:

- `/docs`
- `/redoc`

## Next build steps

1. Add route contracts and DTOs per module.
2. Add authorization guard/decorators from centralized permission map.
3. Implement module-by-module migration from current Django contracts.
