exports.up = (pgm) => {
  pgm.createTable("security_incidents", {
    incident_id: { type: "text", notNull: true, primaryKey: true },
    title: { type: "text", notNull: true },
    summary: { type: "text", notNull: true },
    severity: { type: "text", notNull: true },
    impact: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "reported" },
    ndb_assessment: { type: "text", notNull: true, default: "assessment_in_progress" },
    contains_personal_data: { type: "boolean", notNull: true },
    assigned_owner_user_id: { type: "text" },
    resolution_notes: { type: "text" },
    detected_at: { type: "timestamptz", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    closed_at: { type: "timestamptz" },
  });

  pgm.addConstraint("security_incidents", "security_incidents_severity_check", {
    check: "severity in ('low','medium','high','critical')",
  });
  pgm.addConstraint("security_incidents", "security_incidents_impact_check", {
    check: "impact in ('low','moderate','severe')",
  });
  pgm.addConstraint("security_incidents", "security_incidents_status_check", {
    check: "status in ('reported','triage','investigating','notification_assessment','notification_ready','closed')",
  });
  pgm.addConstraint("security_incidents", "security_incidents_ndb_assessment_check", {
    check: "ndb_assessment in ('not_required','assessment_in_progress','eligible_for_notification','notifiable')",
  });

  pgm.createIndex("security_incidents", ["status", "updated_at"], {
    name: "idx_security_incidents_status_updated_at",
  });
  pgm.createIndex("security_incidents", ["severity", "updated_at"], {
    name: "idx_security_incidents_severity_updated_at",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("security_incidents");
};
