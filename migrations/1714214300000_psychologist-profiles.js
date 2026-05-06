"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("psychologist_profiles", {
    user_id: {
      type: "text",
      primaryKey: true,
      references: "users",
      onDelete: "CASCADE",
    },
    registration_number: { type: "text", notNull: true, default: "" },
    provider_number: { type: "text", notNull: true, default: "" },
    specialties: { type: "text[]", notNull: true, default: "{}" },
    status: { type: "text", notNull: true, default: "active" },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("psychologist_profiles", "psychologist_profiles_status_chk", {
    check: "status in ('active','inactive')",
  });

  pgm.sql(`
    INSERT INTO psychologist_profiles (user_id, registration_number, provider_number, specialties, status)
    VALUES
      ('user_psychologist_001', 'PSY-AHPRA-001', 'PRV-100001', ARRAY['anxiety','stress'], 'active')
    ON CONFLICT (user_id) DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("psychologist_profiles", { ifExists: true });
};
