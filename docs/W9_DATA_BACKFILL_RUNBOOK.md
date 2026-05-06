# W9 Data Backfill Runbook

This runbook defines a safe, repeatable process to move existing non-production snapshot data into PostgreSQL after migration rollout.

## Scope

Tables in scope:

- `audit_events`
- `notifications`
- `notification_preferences`
- `analytics_events`
- `booking_requests`
- `booking_idempotency`
- `appointments`
- `intake_drafts`
- `chat_messages`
- `chat_presence`
- `intake_queue_assignments`

Out of scope:

- production data migration from legacy systems (requires dedicated migration project)
- any backfill that modifies auth credential sources

## Folder layout

- `backend/scripts/backfill/export_snapshot.sh`
- `backend/scripts/backfill/import_snapshot.sh`
- `backend/scripts/backfill/verify_snapshot.sh`
- `backend/backfills/` (generated data dumps, gitignored)

## Preconditions

1. PostgreSQL is running and reachable.
2. Migrations are up-to-date (`npm run db:migrate`).
3. `DATABASE_URL` points to target DB.
4. A backup point exists before import.

## Execution order

1. Export current table snapshots (source environment).
2. Import snapshots into target environment inside a transaction.
3. Verify row counts and key integrity checks.
4. Start backend and validate `/api/health`.

## Commands

From `backend/`:

```bash
mkdir -p backfills
bash scripts/backfill/export_snapshot.sh "$DATABASE_URL" "backfills/dev_snapshot_$(date +%Y%m%d_%H%M%S).sql"
bash scripts/backfill/import_snapshot.sh "$DATABASE_URL" "backfills/dev_snapshot_20260427_000000.sql"
bash scripts/backfill/verify_snapshot.sh "$DATABASE_URL"
```

## Safety rules

- Never run import directly on production without backup + approval.
- Never run concurrent imports into the same DB.
- Use maintenance windows for large snapshots.
- Keep imported snapshots out of git history.

## Rollback plan

If import fails:

1. `import_snapshot.sh` transaction will rollback automatically.
2. restore DB from pre-import backup if partial external side effects occurred.

## Verification checklist

- [ ] `GET /api/health` returns DB connected and migrations ready.
- [ ] Key row counts are non-zero where expected.
- [ ] Booking create still enforces `409` on same-slot conflicts.
- [ ] Audit and notification reads return expected records.

