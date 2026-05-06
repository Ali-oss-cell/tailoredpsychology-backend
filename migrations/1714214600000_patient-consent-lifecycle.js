"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("patient_consents", {
    consent_id: { type: "text", primaryKey: true },
    user_id: { type: "text", notNull: true, references: "users(user_id)", onDelete: "cascade" },
    policy_version: { type: "text", notNull: true },
    accepted_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    withdrawn_at: { type: "timestamptz" },
    withdrawal_reason: { type: "text" },
  });
  pgm.createIndex("patient_consents", ["user_id", "accepted_at"], { name: "patient_consents_user_accepted_idx" });
  pgm.createIndex("patient_consents", ["user_id", "withdrawn_at"], { name: "patient_consents_user_withdrawn_idx" });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropIndex("patient_consents", ["user_id", "withdrawn_at"], { name: "patient_consents_user_withdrawn_idx", ifExists: true });
  pgm.dropIndex("patient_consents", ["user_id", "accepted_at"], { name: "patient_consents_user_accepted_idx", ifExists: true });
  pgm.dropTable("patient_consents", { ifExists: true });
};
