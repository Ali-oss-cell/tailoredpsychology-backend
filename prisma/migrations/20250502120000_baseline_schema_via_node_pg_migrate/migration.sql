-- Baseline migration for Prisma Migrate.
-- The live schema is (and was) created by node-pg-migrate under `backend/migrations/`.
-- This file intentionally does not CREATE objects, so it is safe to run on databases
-- that already match `prisma/schema.prisma` after `npm run db:migrate:legacy`.
-- New DDL: add follow-up folders here via `npx prisma migrate dev` (or hand-authored SQL
-- in a new timestamped directory) and run `npx prisma migrate deploy` in CI/prod.
SELECT 1;
