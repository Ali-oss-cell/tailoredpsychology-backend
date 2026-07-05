-- Appointment state machine: actual session timestamps, optimistic-lock version,
-- and an auditable transition history table.

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "actual_started_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "actual_ended_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- Speeds up the no-show / auto-complete sweep (WHERE status = ? AND scheduled_end_at < ?).
CREATE INDEX IF NOT EXISTS "appointments_status_end_idx"
  ON "appointments"("status", "scheduled_end_at");

CREATE TABLE IF NOT EXISTS "appointment_transitions" (
  "transition_id" TEXT NOT NULL,
  "appointment_id" TEXT NOT NULL,
  "from_status" TEXT NOT NULL,
  "to_status" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_transitions_pkey" PRIMARY KEY ("transition_id")
);

CREATE INDEX IF NOT EXISTS "appointment_transitions_appt_time_idx"
  ON "appointment_transitions"("appointment_id", "occurred_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointment_transitions_appointment_id_fkey'
  ) THEN
    ALTER TABLE "appointment_transitions"
      ADD CONSTRAINT "appointment_transitions_appointment_id_fkey"
      FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
