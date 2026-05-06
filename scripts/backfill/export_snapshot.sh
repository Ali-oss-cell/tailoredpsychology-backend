#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <database_url> <output_sql_file>"
  exit 1
fi

DATABASE_URL="$1"
OUTPUT_FILE="$2"

TABLES=(
  audit_events
  notifications
  notification_preferences
  analytics_events
  booking_requests
  booking_idempotency
  appointments
  intake_drafts
  chat_messages
  chat_presence
  intake_queue_assignments
)

echo "-- Clink snapshot export" > "$OUTPUT_FILE"
echo "-- Generated at: $(date -Iseconds)" >> "$OUTPUT_FILE"

for table in "${TABLES[@]}"; do
  echo "-- Exporting ${table}"
  pg_dump "$DATABASE_URL" --data-only --inserts --column-inserts --table="$table" >> "$OUTPUT_FILE"
done

echo "Snapshot exported to $OUTPUT_FILE"
