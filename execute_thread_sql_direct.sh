#!/bin/bash

# Direct SQL execution via psql
# This script requires psql to be installed

echo "Attempting to execute SQL statements directly..."

# Read SQL from file
SQL_FILE="supabase/migrations/20260130000001_fix_thread_participant_trigger.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: $SQL_FILE not found"
  exit 1
fi

echo "Executing SQL from: $SQL_FILE"
cat "$SQL_FILE"

echo ""
echo "To execute this, run:"
echo "psql -U postgres.qcfifybkaddcoimjroca -h aws-1-us-east-2.pooler.supabase.com -d postgres < $SQL_FILE"
