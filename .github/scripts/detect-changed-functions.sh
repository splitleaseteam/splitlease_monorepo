#!/bin/bash

# CI/CD Script: Detect Changed Supabase Edge Functions
# Purpose: Identify which Edge Functions need deployment based on git changes
# Usage: Called by GitHub Actions workflows to optimize deployment speed

set -e  # Exit on error

echo "🔍 Detecting changed Edge Functions..."

# Get list of changed files between HEAD and previous commit
# Using HEAD~1 for single commits, or compare with base branch for PRs
if [ -n "$GITHUB_BASE_REF" ]; then
  # Pull request - compare with base branch
  BASE="origin/$GITHUB_BASE_REF"
  echo "📋 Comparing with base branch: $BASE"
else
  # Direct push - compare with previous commit
  BASE="HEAD~1"
  echo "📋 Comparing with previous commit: HEAD~1"
fi

CHANGED_FILES=$(git diff --name-only "$BASE" HEAD -- supabase/functions/ || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No Edge Function changes detected"
  echo "deploy_all=false" >> "$GITHUB_OUTPUT"
  echo "changed_functions=[]" >> "$GITHUB_OUTPUT"
  echo "has_changes=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "📝 Changed files:"
echo "$CHANGED_FILES"
echo ""

# Check if _shared directory changed
if echo "$CHANGED_FILES" | grep -q "supabase/functions/_shared"; then
  echo "⚠️  _shared/ directory changed - deploying ALL functions for safety"
  echo "deploy_all=true" >> "$GITHUB_OUTPUT"
  echo "changed_functions=[]" >> "$GITHUB_OUTPUT"
  echo "has_changes=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Extract unique function names (top-level directories under supabase/functions/)
CHANGED_FUNCTIONS=$(echo "$CHANGED_FILES" | \
  grep -E '^supabase/functions/[^/]+/' | \
  sed 's|supabase/functions/\([^/]*\)/.*|\1|' | \
  sort -u | \
  grep -v '^_shared$' || echo "")

if [ -z "$CHANGED_FUNCTIONS" ]; then
  echo "✅ No function-specific changes (only root-level config files)"
  echo "deploy_all=false" >> "$GITHUB_OUTPUT"
  echo "changed_functions=[]" >> "$GITHUB_OUTPUT"
  echo "has_changes=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Convert to JSON array for GitHub Actions matrix strategy
# Example: ["auth-user", "proposal", "listing"]
FUNCTIONS_JSON=$(echo "$CHANGED_FUNCTIONS" | jq -R -s -c 'split("\n") | map(select(length > 0))')

echo "✅ Changed functions detected:"
echo "$CHANGED_FUNCTIONS"
echo ""
echo "📦 JSON output for matrix: $FUNCTIONS_JSON"

echo "deploy_all=false" >> "$GITHUB_OUTPUT"
echo "changed_functions=$FUNCTIONS_JSON" >> "$GITHUB_OUTPUT"
echo "has_changes=true" >> "$GITHUB_OUTPUT"

echo ""
echo "🎯 Summary:"
echo "  - Deploy All: false"
echo "  - Changed Functions: $(echo "$CHANGED_FUNCTIONS" | wc -l | tr -d ' ')"
echo "  - Function List: $FUNCTIONS_JSON"
