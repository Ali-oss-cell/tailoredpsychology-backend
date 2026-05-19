-- Persist patient mood check-ins when PostgreSQL is enabled (Wave 19 / PG-05).
CREATE TABLE IF NOT EXISTS patient_mood_checkins (
  checkin_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mood_label TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS patient_mood_checkins_patient_created_idx
  ON patient_mood_checkins (patient_id, created_at DESC);
