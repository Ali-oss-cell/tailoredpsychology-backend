"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable(
    "referral_documents",
    {
      document_id: { type: "text", primaryKey: true },
      patient_id: { type: "text", notNull: true },
      status: { type: "text", notNull: true },
      file_name: { type: "text", notNull: true },
      file_size: { type: "integer", notNull: true },
      mime_type: { type: "text", notNull: true },
      source_type: { type: "text" },
      referral_date: { type: "date" },
      notes: { type: "text" },
      uploaded_at: { type: "timestamptz", notNull: true },
      due_at: { type: "timestamptz", notNull: true },
      assigned_owner_user_id: { type: "text" },
      reviewed_by: { type: "text" },
      reviewed_at: { type: "timestamptz" },
      review_reason: { type: "text" },
      review_notes: { type: "text" },
    },
    { ifNotExists: true },
  );

  pgm.addConstraint("referral_documents", "referral_documents_status_check", {
    check: "status in ('received','review_needed','approved','rejected','info_requested')",
  });

  pgm.createIndex("referral_documents", ["status", "uploaded_at"], {
    name: "idx_referral_documents_status_uploaded_at",
    ifNotExists: true,
  });
  pgm.createIndex("referral_documents", ["assigned_owner_user_id"], {
    name: "idx_referral_documents_assigned_owner",
    ifNotExists: true,
  });
  pgm.createIndex("referral_documents", ["due_at"], {
    name: "idx_referral_documents_due_at",
    ifNotExists: true,
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("referral_documents", { ifExists: true });
};
