#!/bin/bash

# CI/CD Script: Health Check for Edge Functions
# Purpose: Verify deployed Edge Function is operational
# Usage: ./health-check.sh <function-name> <project-url> <anon-key>

set -e

FUNCTION_NAME=$1
PROJECT_URL=$2
ANON_KEY=$3

if [ -z "$FUNCTION_NAME" ] || [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ]; then
  echo "❌ Usage: ./health-check.sh <function-name> <project-url> <anon-key>"
  exit 1
fi

FUNCTION_URL="${PROJECT_URL}/functions/v1/${FUNCTION_NAME}"

echo "🏥 Health check: ${FUNCTION_NAME}"
echo "🔗 URL: ${FUNCTION_URL}"
echo ""

# Different health check payloads based on function
case "$FUNCTION_NAME" in
  "auth-user")
    PAYLOAD='{"action":"validate","payload":{"token":"health-check","user_id":"health-check"}}'
    ;;
  "proposal"|"listing"|"messages")
    PAYLOAD='{"action":"get","payload":{"id":"health-check-test"}}'
    ;;
  *)
    # Generic health check - most functions should handle unknown actions gracefully
    PAYLOAD='{"action":"health","payload":{}}'
    ;;
esac

# Make request with timeout
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 10 \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📊 HTTP Status: $HTTP_CODE"

# Accept 2xx, 4xx (function is responding, even if rejecting our test payload)
# Reject 5xx (server errors indicate deployment issues)
if [[ "$HTTP_CODE" =~ ^[24][0-9][0-9]$ ]]; then
  echo "✅ Health check passed - function is responding"
  exit 0
else
  echo "❌ Health check failed - function returned $HTTP_CODE"
  exit 1
fi
