"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("psychologist_notes", {
    note_id: { type: "text", primaryKey: true },
    psychologist_id: { type: "text", notNull: true },
    patient_id: { type: "text", notNull: true },
    session_id: { type: "text", notNull: true },
    status: { type: "text", notNull: true },
    body: { type: "text", notNull: true, default: "" },
    signed_at: { type: "timestamptz" },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("psychologist_notes", "psychologist_notes_status_chk", {
    check: "status in ('draft','ready_for_signoff','signed')",
  });
  pgm.createIndex("psychologist_notes", ["psychologist_id", "updated_at"], { name: "psychologist_notes_psychologist_updated_idx" });
  pgm.createIndex("psychologist_notes", ["patient_id", "updated_at"], { name: "psychologist_notes_patient_updated_idx" });

  pgm.createTable("psychologist_profile_bio", {
    psychologist_id: { type: "text", primaryKey: true },
    bio: { type: "text", notNull: true, default: "" },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("session_videos", {
    video_id: { type: "text", primaryKey: true },
    session_id: { type: "text", notNull: true },
    patient_id: { type: "text", notNull: true },
    clinician_id: { type: "text", notNull: true },
    session_date: { type: "timestamptz", notNull: true },
    download_url: { type: "text", notNull: true },
    transcript_ready: { type: "boolean", notNull: true, default: false },
  });
  pgm.createIndex("session_videos", ["patient_id", "session_date"], { name: "session_videos_patient_date_idx" });
  pgm.createIndex("session_videos", ["clinician_id", "session_date"], { name: "session_videos_clinician_date_idx" });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropIndex("session_videos", ["clinician_id", "session_date"], { name: "session_videos_clinician_date_idx", ifExists: true });
  pgm.dropIndex("session_videos", ["patient_id", "session_date"], { name: "session_videos_patient_date_idx", ifExists: true });
  pgm.dropTable("session_videos", { ifExists: true });
  pgm.dropTable("psychologist_profile_bio", { ifExists: true });
  pgm.dropIndex("psychologist_notes", ["patient_id", "updated_at"], { name: "psychologist_notes_patient_updated_idx", ifExists: true });
  pgm.dropIndex("psychologist_notes", ["psychologist_id", "updated_at"], {
    name: "psychologist_notes_psychologist_updated_idx",
    ifExists: true,
  });
  pgm.dropConstraint("psychologist_notes", "psychologist_notes_status_chk", { ifExists: true });
  pgm.dropTable("psychologist_notes", { ifExists: true });
};
