-- Wave 21: durable patient invoices + password reset tokens

CREATE TABLE IF NOT EXISTS "patient_invoices" (
    "invoice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "patient_invoices_pkey" PRIMARY KEY ("invoice_id")
);

CREATE INDEX IF NOT EXISTS "patient_invoices_patient_issued_idx" ON "patient_invoices"("patient_id", "issued_at" DESC);

ALTER TABLE "patient_invoices" ADD CONSTRAINT "patient_invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("token_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_created_idx" ON "password_reset_tokens"("user_id", "created_at" DESC);

ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
