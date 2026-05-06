"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createIndex("audit_events", ["target_type", "target_id", "occurred_at"], {
    name: "audit_events_target_lookup_idx",
  });
  pgm.createIndex("audit_events", ["actor_user_id", "occurred_at"], {
    name: "audit_events_actor_lookup_idx",
  });

  pgm.createIndex("notifications", ["recipient_user_id", "created_at"], {
    name: "notifications_recipient_created_idx",
  });
  pgm.createIndex("notifications", ["recipient_user_id", "read_at", "created_at"], {
    name: "notifications_unread_lookup_idx",
  });

  pgm.createIndex("analytics_events", ["name", "occurred_at"], {
    name: "analytics_events_name_occurred_idx",
  });
  pgm.createIndex("analytics_events", ["target_id", "occurred_at"], {
    name: "analytics_events_target_occurred_idx",
  });

  pgm.createIndex("booking_requests", ["patient_id", "updated_at"], {
    name: "booking_requests_patient_updated_idx",
  });
  pgm.createIndex("booking_requests", ["clinician_id", "appointment_date", "slot_id"], {
    name: "booking_requests_clinician_date_slot_idx",
  });
  pgm.createIndex("booking_requests", ["state", "updated_at"], {
    name: "booking_requests_state_updated_idx",
  });

  pgm.createIndex("appointments", ["patient_id", "scheduled_start_at"], {
    name: "appointments_patient_start_idx",
  });
  pgm.createIndex("appointments", ["clinician_id", "scheduled_start_at"], {
    name: "appointments_clinician_start_idx",
  });
  pgm.createIndex("appointments", ["chat_window_open_at", "chat_window_close_at"], {
    name: "appointments_chat_window_idx",
  });

  pgm.createIndex("intake_drafts", ["updated_at"], {
    name: "intake_drafts_updated_idx",
  });

  pgm.createIndex("chat_messages", ["appointment_id", "created_at"], {
    name: "chat_messages_appointment_created_idx",
  });
  pgm.createIndex("chat_presence", ["appointment_id", "joined_at"], {
    name: "chat_presence_appointment_joined_idx",
  });

  pgm.createIndex("intake_queue_assignments", ["assigned_clinician_id", "updated_at"], {
    name: "intake_queue_assignments_clinician_updated_idx",
  });

  pgm.addConstraint("booking_requests", "booking_requests_state_check", {
    check:
      "state in ('submitted','triage_review','matched_pending_confirmation','appointment_confirmed')",
  });
  pgm.addConstraint("appointments", "appointments_status_check", {
    check: "status in ('scheduled','in_progress','completed','cancelled','no_show')",
  });
  pgm.addConstraint("intake_drafts", "intake_drafts_version_non_negative_check", {
    check: "draft_version >= 0",
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropConstraint("intake_drafts", "intake_drafts_version_non_negative_check", {
    ifExists: true,
  });
  pgm.dropConstraint("appointments", "appointments_status_check", { ifExists: true });
  pgm.dropConstraint("booking_requests", "booking_requests_state_check", { ifExists: true });

  pgm.dropIndex("intake_queue_assignments", ["assigned_clinician_id", "updated_at"], {
    name: "intake_queue_assignments_clinician_updated_idx",
    ifExists: true,
  });
  pgm.dropIndex("chat_presence", ["appointment_id", "joined_at"], {
    name: "chat_presence_appointment_joined_idx",
    ifExists: true,
  });
  pgm.dropIndex("chat_messages", ["appointment_id", "created_at"], {
    name: "chat_messages_appointment_created_idx",
    ifExists: true,
  });
  pgm.dropIndex("intake_drafts", ["updated_at"], {
    name: "intake_drafts_updated_idx",
    ifExists: true,
  });
  pgm.dropIndex("appointments", ["chat_window_open_at", "chat_window_close_at"], {
    name: "appointments_chat_window_idx",
    ifExists: true,
  });
  pgm.dropIndex("appointments", ["clinician_id", "scheduled_start_at"], {
    name: "appointments_clinician_start_idx",
    ifExists: true,
  });
  pgm.dropIndex("appointments", ["patient_id", "scheduled_start_at"], {
    name: "appointments_patient_start_idx",
    ifExists: true,
  });
  pgm.dropIndex("booking_requests", ["state", "updated_at"], {
    name: "booking_requests_state_updated_idx",
    ifExists: true,
  });
  pgm.dropIndex("booking_requests", ["clinician_id", "appointment_date", "slot_id"], {
    name: "booking_requests_clinician_date_slot_idx",
    ifExists: true,
  });
  pgm.dropIndex("booking_requests", ["patient_id", "updated_at"], {
    name: "booking_requests_patient_updated_idx",
    ifExists: true,
  });
  pgm.dropIndex("analytics_events", ["target_id", "occurred_at"], {
    name: "analytics_events_target_occurred_idx",
    ifExists: true,
  });
  pgm.dropIndex("analytics_events", ["name", "occurred_at"], {
    name: "analytics_events_name_occurred_idx",
    ifExists: true,
  });
  pgm.dropIndex("notifications", ["recipient_user_id", "read_at", "created_at"], {
    name: "notifications_unread_lookup_idx",
    ifExists: true,
  });
  pgm.dropIndex("notifications", ["recipient_user_id", "created_at"], {
    name: "notifications_recipient_created_idx",
    ifExists: true,
  });
  pgm.dropIndex("audit_events", ["actor_user_id", "occurred_at"], {
    name: "audit_events_actor_lookup_idx",
    ifExists: true,
  });
  pgm.dropIndex("audit_events", ["target_type", "target_id", "occurred_at"], {
    name: "audit_events_target_lookup_idx",
    ifExists: true,
  });
};
