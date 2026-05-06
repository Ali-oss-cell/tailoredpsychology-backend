#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <database_url> <input_sql_file>"
  exit 1
fi

DATABASE_URL="$1"
INPUT_FILE="$2"

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Input file not found: $INPUT_FILE"
  exit 1
fi

echo "Importing snapshot from $INPUT_FILE"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
\i $INPUT_FILE
COMMIT;
SQL

echo "Snapshot import completed."
