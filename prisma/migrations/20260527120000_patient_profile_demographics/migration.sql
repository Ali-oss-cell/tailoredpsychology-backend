-- Durable patient demographics on patient_profiles (merged from intake on commit)

ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "date_of_birth" TEXT NOT NULL DEFAULT '';
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "indigenous_status" TEXT NOT NULL DEFAULT '';
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "suburb" TEXT NOT NULL DEFAULT '';
