# Prisma schema vs PostgreSQL (introspection caveats)

`backend/prisma/schema.prisma` is aligned with production via **`prisma db pull`**. Prisma cannot express every PostgreSQL feature; warnings from pull or migrate are documented here with the **authoritative DDL** in `backend/migrations/*.js`.

## Check constraints (enforced in DB, `String` in Prisma)

| Table | Constraint name | Allowed values / rule |
|--------|-----------------|------------------------|
| `booking_requests` | `booking_requests_state_check` | `'submitted','triage_review','matched_pending_confirmation','appointment_confirmed'` |
| `appointments` | `appointments_status_check` | `'scheduled','in_progress','completed','cancelled','no_show'` |
| `intake_drafts` | `intake_drafts_version_non_negative_check` | `draft_version >= 0` |
| `patient_profiles` | `patient_profiles_preferred_contact_method_chk` | `'email','sms','phone'` |
| `psychologist_profiles` | `psychologist_profiles_status_chk` | `'active','inactive'` |
| `psychologist_notes` | `psychologist_notes_status_chk` | `'draft','ready_for_signoff','signed'` |
| `referral_documents` | `referral_documents_status_check` | `'received','review_needed','approved','rejected','info_requested'` |
| `security_incidents` | `security_incidents_severity_check` | `'low','medium','high','critical'` |
| `security_incidents` | `security_incidents_impact_check` | `'low','moderate','severe'` |
| `security_incidents` | `security_incidents_status_check` | `'reported','triage','investigating','notification_assessment','notification_ready','closed'` |
| `security_incidents` | `security_incidents_ndb_assessment_check` | `'not_required','assessment_in_progress','eligible_for_notification','notifiable'` |
| `patient_data_requests` | `patient_data_requests_type_check` | `'access','correction'` |
| `patient_data_requests` | `patient_data_requests_status_check` | `'submitted','triage_review','in_progress','fulfilled','rejected','cancelled'` |
| `telehealth_readiness` | `telehealth_readiness_status_check` | `'ready','attention'` |

Application code and tests should respect these sets when writing strings.

## Expression and partial indexes (not first-class in Prisma)

- **`users`**: unique index on **`lower(email)`** — `CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))` (`1714214000000_users-and-patient-profiles.js`). Prisma still models `email` as a normal column; uniqueness is case-insensitive at the DB level.
- **`booking_requests`**: partial unique index **`booking_requests_active_slot_unique_idx`** for active states (`1714212000000_booking-slot-guard.js`). Not represented as a Prisma `@@unique`.

## Follow-up (optional hardening)

- Add Prisma **native enums** where rollouts can tolerate a migration that replaces unconstrained `String` columns (coordinate with `db:migrate:legacy` history).
- New constraints or indexes that Prisma cannot model should continue to ship as SQL in **`prisma/migrations/<timestamp>/migration.sql`** after the baseline, or temporarily in `backend/migrations/` if you keep extending legacy migrate—prefer consolidating on Prisma Migrate for new work.
