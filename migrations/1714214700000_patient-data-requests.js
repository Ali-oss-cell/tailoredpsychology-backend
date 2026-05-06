exports.up = (pgm) => {
  pgm.createTable("patient_data_requests", {
    request_id: { type: "text", notNull: true, primaryKey: true },
    patient_id: { type: "text", notNull: true },
    request_type: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "submitted" },
    details: { type: "text", notNull: true },
    requested_correction: { type: "text" },
    triage_owner_user_id: { type: "text" },
    resolution_notes: { type: "text" },
    sla_due_at: { type: "timestamptz", notNull: true },
    triaged_at: { type: "timestamptz" },
    resolved_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("patient_data_requests", "patient_data_requests_type_check", {
    check: "request_type in ('access','correction')",
  });

  pgm.addConstraint("patient_data_requests", "patient_data_requests_status_check", {
    check: "status in ('submitted','triage_review','in_progress','fulfilled','rejected','cancelled')",
  });

  pgm.createIndex("patient_data_requests", ["patient_id", "updated_at"], {
    name: "idx_patient_data_requests_patient_updated_at",
  });
  pgm.createIndex("patient_data_requests", ["status", "updated_at"], {
    name: "idx_patient_data_requests_status_updated_at",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("patient_data_requests");
};
