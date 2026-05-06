"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.addColumns("users", {
    deleted_at: { type: "timestamptz" },
    deletion_reason: { type: "text" },
    deleted_by_user_id: { type: "text" },
    legal_hold_active: { type: "boolean", notNull: true, default: false },
    legal_hold_reason: { type: "text" },
    legal_hold_set_by_user_id: { type: "text" },
    legal_hold_set_at: { type: "timestamptz" },
    retention_until: { type: "timestamptz" },
    purged_at: { type: "timestamptz" },
    last_interaction_at: { type: "timestamptz" },
  });

  pgm.createIndex("users", ["deleted_at"], { name: "users_deleted_at_idx" });
  pgm.createIndex("users", ["legal_hold_active"], { name: "users_legal_hold_active_idx" });
  pgm.createIndex("users", ["retention_until"], { name: "users_retention_until_idx" });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropIndex("users", ["retention_until"], { name: "users_retention_until_idx", ifExists: true });
  pgm.dropIndex("users", ["legal_hold_active"], { name: "users_legal_hold_active_idx", ifExists: true });
  pgm.dropIndex("users", ["deleted_at"], { name: "users_deleted_at_idx", ifExists: true });
  pgm.dropColumns("users", [
    "deleted_at",
    "deletion_reason",
    "deleted_by_user_id",
    "legal_hold_active",
    "legal_hold_reason",
    "legal_hold_set_by_user_id",
    "legal_hold_set_at",
    "retention_until",
    "purged_at",
    "last_interaction_at",
  ]);
};
