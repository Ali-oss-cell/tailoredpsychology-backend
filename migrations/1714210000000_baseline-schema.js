"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("audit_events", {
    event_id: { type: "text", primaryKey: true },
    actor_user_id: { type: "text", notNull: true },
    actor_role: { type: "text", notNull: true },
    action: { type: "text", notNull: true },
    target_type: { type: "text", notNull: true },
    target_id: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    occurred_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("notifications", {
    notification_id: { type: "text", primaryKey: true },
    recipient_user_id: { type: "text", notNull: true },
    recipient_role: { type: "text", notNull: true },
    type: { type: "text", notNull: true },
    title: { type: "text", notNull: true },
    body: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    read_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("notification_preferences", {
    user_id: { type: "text", primaryKey: true },
    in_app_enabled: { type: "boolean", notNull: true },
    booking_submitted: { type: "boolean", notNull: true },
    booking_confirmed: { type: "boolean", notNull: true },
    chat_window_open: { type: "boolean", notNull: true },
    session_starting_soon: { type: "boolean", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("analytics_events", {
    event_id: { type: "text", primaryKey: true },
    name: { type: "text", notNull: true },
    actor_user_id: { type: "text", notNull: true },
    actor_role: { type: "text", notNull: true },
    target_id: { type: "text", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    idempotency_key: { type: "text", unique: true },
    occurred_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("booking_requests", {
    booking_request_id: { type: "text", primaryKey: true },
    patient_id: { type: "text", notNull: true },
    clinician_id: { type: "text", notNull: true },
    slot_id: { type: "text", notNull: true },
    appointment_date: { type: "date", notNull: true },
    referral_document_id: { type: "text", notNull: true, default: "" },
    timezone: { type: "text", notNull: true },
    notes: { type: "text", notNull: true, default: "" },
    state: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("booking_idempotency", {
    idempotency_key: { type: "text", primaryKey: true },
    booking_request_id: {
      type: "text",
      notNull: true,
      references: "booking_requests",
      onDelete: "CASCADE",
    },
  });

  pgm.createTable("appointments", {
    appointment_id: { type: "text", primaryKey: true },
    patient_id: { type: "text", notNull: true },
    clinician_id: { type: "text", notNull: true },
    scheduled_start_at: { type: "timestamptz", notNull: true },
    scheduled_end_at: { type: "timestamptz", notNull: true },
    status: { type: "text", notNull: true },
    chat_window_open_at: { type: "timestamptz", notNull: true },
    chat_window_close_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("intake_drafts", {
    patient_id: { type: "text", primaryKey: true },
    draft_version: { type: "integer", notNull: true },
    data: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    updated_at: { type: "timestamptz", notNull: true },
    committed_at: { type: "timestamptz" },
  });

  pgm.createTable("chat_messages", {
    message_id: { type: "text", primaryKey: true },
    appointment_id: {
      type: "text",
      notNull: true,
      references: "appointments",
      onDelete: "CASCADE",
    },
    author_user_id: { type: "text", notNull: true },
    author_role: { type: "text", notNull: true },
    message: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("chat_presence", {
    appointment_id: {
      type: "text",
      notNull: true,
      references: "appointments",
      onDelete: "CASCADE",
    },
    user_id: { type: "text", notNull: true },
    joined_at: { type: "timestamptz", notNull: true },
  });
  pgm.addConstraint("chat_presence", "chat_presence_pk", {
    primaryKey: ["appointment_id", "user_id"],
  });

  pgm.createTable("intake_queue_assignments", {
    queue_item_id: { type: "text", primaryKey: true },
    assigned_clinician_id: { type: "text", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("intake_queue_assignments", { ifExists: true });
  pgm.dropTable("chat_presence", { ifExists: true });
  pgm.dropTable("chat_messages", { ifExists: true });
  pgm.dropTable("intake_drafts", { ifExists: true });
  pgm.dropTable("appointments", { ifExists: true });
  pgm.dropTable("booking_idempotency", { ifExists: true });
  pgm.dropTable("booking_requests", { ifExists: true });
  pgm.dropTable("analytics_events", { ifExists: true });
  pgm.dropTable("notification_preferences", { ifExists: true });
  pgm.dropTable("notifications", { ifExists: true });
  pgm.dropTable("audit_events", { ifExists: true });
};
