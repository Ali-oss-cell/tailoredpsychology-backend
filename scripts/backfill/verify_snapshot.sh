#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <database_url>"
  exit 1
fi

DATABASE_URL="$1"

echo "Verifying snapshot row counts..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
select 'audit_events' as table_name, count(*) as row_count from audit_events
union all select 'notifications', count(*) from notifications
union all select 'notification_preferences', count(*) from notification_preferences
union all select 'analytics_events', count(*) from analytics_events
union all select 'booking_requests', count(*) from booking_requests
union all select 'booking_idempotency', count(*) from booking_idempotency
union all select 'appointments', count(*) from appointments
union all select 'intake_drafts', count(*) from intake_drafts
union all select 'chat_messages', count(*) from chat_messages
union all select 'chat_presence', count(*) from chat_presence
union all select 'intake_queue_assignments', count(*) from intake_queue_assignments;
SQL

echo "Checking migration table presence..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select to_regclass('public.pgmigrations') as pgmigrations_table;"

echo "Verification completed."
