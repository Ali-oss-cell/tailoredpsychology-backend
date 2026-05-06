"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("telehealth_readiness", {
    appointment_id: {
      type: "text",
      notNull: true,
      references: "appointments",
      onDelete: "CASCADE",
    },
    user_id: { type: "text", notNull: true },
    overall_status: { type: "text", notNull: true },
    checks: { type: "jsonb", notNull: true, default: pgm.func("'[]'::jsonb") },
    updated_at: { type: "timestamptz", notNull: true },
  });
  pgm.addConstraint("telehealth_readiness", "telehealth_readiness_pk", {
    primaryKey: ["appointment_id", "user_id"],
  });
  pgm.createIndex("telehealth_readiness", ["appointment_id", "updated_at"], {
    name: "telehealth_readiness_appointment_updated_idx",
  });
  pgm.addConstraint("telehealth_readiness", "telehealth_readiness_status_check", {
    check: "overall_status in ('ready','attention')",
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropConstraint("telehealth_readiness", "telehealth_readiness_status_check", {
    ifExists: true,
  });
  pgm.dropIndex("telehealth_readiness", ["appointment_id", "updated_at"], {
    name: "telehealth_readiness_appointment_updated_idx",
    ifExists: true,
  });
  pgm.dropTable("telehealth_readiness", { ifExists: true });
};
