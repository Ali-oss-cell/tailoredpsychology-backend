-- Booking payment: link invoices to bookings and record Stripe checkout + webhook idempotency

ALTER TABLE "patient_invoices"
  ADD COLUMN IF NOT EXISTS "booking_request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "appointment_id" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_invoices_stripe_checkout_session_id_key"
  ON "patient_invoices"("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "patient_invoices_booking_request_idx"
  ON "patient_invoices"("booking_request_id");

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "event_id" TEXT NOT NULL,
  "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("event_id")
);
