"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    create unique index if not exists booking_requests_active_slot_unique_idx
    on booking_requests (clinician_id, appointment_date, slot_id)
    where state in ('submitted', 'triage_review', 'matched_pending_confirmation');
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`
    drop index if exists booking_requests_active_slot_unique_idx;
  `);
};
