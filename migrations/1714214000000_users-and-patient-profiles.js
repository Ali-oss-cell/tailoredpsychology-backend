"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("users", {
    user_id: { type: "text", primaryKey: true },
    email: { type: "text", notNull: true },
    display_name: { type: "text", notNull: true },
    role: { type: "text", notNull: true },
    password: { type: "text", notNull: true },
    account_onboarding_complete: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.sql("CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));");

  pgm.createTable("patient_profiles", {
    user_id: {
      type: "text",
      primaryKey: true,
      references: "users",
      onDelete: "CASCADE",
    },
    phone_mobile: { type: "text", notNull: true, default: "" },
    preferred_contact_method: { type: "text", notNull: true, default: "email" },
    accessibility_notes: { type: "text", notNull: true, default: "" },
    emergency_contact_name: { type: "text", notNull: true, default: "" },
    emergency_contact_phone: { type: "text", notNull: true, default: "" },
    emergency_contact_relationship: { type: "text", notNull: true, default: "" },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("patient_profiles", "patient_profiles_preferred_contact_method_chk", {
    check: "preferred_contact_method in ('email','sms','phone')",
  });

  pgm.sql(`
    INSERT INTO users (user_id, email, display_name, role, password, account_onboarding_complete)
    VALUES
      ('user_patient_001', 'patient@clink.test', 'Patient Demo', 'patient', '$argon2id$v=19$m=19456,t=2,p=1$SAnCqXx//k8DBFUjbtMAbQ$kxTakLr/H8P4TzdT33/ylXKNmojL7jUvVenA4SJuS4Q', true),
      ('user_psychologist_001', 'psychologist@clink.test', 'Psychologist Demo', 'psychologist', '$argon2id$v=19$m=19456,t=2,p=1$OLypc/hC+/QU3O/QcpDvCg$O0Ca5AP+G8KQ1z7x4lFzfaBRGZPCF+k7YmGTe4rXTLM', true),
      ('user_patient_002', 'patient2@clink.test', 'Patient Two Demo', 'patient', '$argon2id$v=19$m=19456,t=2,p=1$NoxgV7oyri7dMPWSkOC9EA$6bldXm4Ifppti/hGPtFWIP5WrMV1s6Lw7VUz2WM4w20', true),
      ('user_manager_001', 'manager@clink.test', 'Practice Manager Demo', 'practice_manager', '$argon2id$v=19$m=19456,t=2,p=1$qpjuJy+QuAk7/4AnQY4pLQ$Epi7GRCpXav3lxNg9/RMMtal7plwq6upBy0Ct83c2YM', true),
      ('user_admin_001', 'admin@clink.test', 'Admin Demo', 'admin', '$argon2id$v=19$m=19456,t=2,p=1$OXkJN5Y18gSO+ggmYG85yQ$u5PIeWNI4nBBgv1gltew4MYy5lburJ7ZEpQy+D1beYs', true)
    ON CONFLICT (user_id) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO patient_profiles (user_id, phone_mobile, preferred_contact_method, accessibility_notes, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
    VALUES
      ('user_patient_001', '+61 400 000 000', 'email', '', 'Jamie Chen', '+61 400 000 001', 'Partner'),
      ('user_patient_002', '', 'email', '', '', '', '')
    ON CONFLICT (user_id) DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("patient_profiles", { ifExists: true });
  pgm.sql("DROP INDEX IF EXISTS users_email_lower_unique;");
  pgm.dropTable("users", { ifExists: true });
};
