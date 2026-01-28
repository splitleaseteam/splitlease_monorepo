#!/bin/bash
# ==================================================================
# SYSTEM: Configure GitHub Branch Protection Rules
# ==================================================================
# Run once during initial setup with admin privileges
#
# Requires: GITHUB_TOKEN environment variable with admin:repo scope
#
# Usage:
#   export GITHUB_TOKEN="ghp_your_token_here"
#   ./scripts/setup-branch-protection.sh

set -e

REPO_OWNER="splitleaseteam"
REPO_NAME="splitlease"
BRANCH="main"

# ==================================================================
# Verify prerequisites
# ==================================================================
echo "🔒 Setting up branch protection for $REPO_OWNER/$REPO_NAME/$BRANCH"
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable required"
    echo ""
    echo "Get a token from: https://github.com/settings/tokens"
    echo "Required scope: admin:repo"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=\"ghp_your_token_here\""
    echo "  ./scripts/setup-branch-protection.sh"
    echo ""
    exit 1
fi

# Test GitHub API access
echo "🔍 Testing GitHub API access..."
API_TEST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME" | jq -r '.full_name // "error"')

if [ "$API_TEST" = "error" ]; then
    echo "❌ Failed to access GitHub API"
    echo "   Check your token and repository access"
    exit 1
fi

echo "✅ GitHub API access confirmed: $API_TEST"
echo ""

# ==================================================================
# Configure branch protection
# ==================================================================
echo "📝 Configuring branch protection rules..."
echo ""

PROTECTION_RULES='{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Build & Deploy to Cloudflare Pages",
      "SYSTEM CHECK - Verify tests actually ran",
      "SYSTEM CHECK - TypeScript verification",
      "SYSTEM CHECK - Edge Function Registry Sync"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}'

RESPONSE=$(curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
  -d "$PROTECTION_RULES")

# Check if successful
if echo "$RESPONSE" | jq -e '.url' > /dev/null 2>&1; then
    echo "✅ Branch protection configured successfully!"
    echo ""
    echo "📋 Protection Rules Active:"
    echo "   ✅ Pull requests required (1 approval)"
    echo "   ✅ Status checks must pass before merge"
    echo "   ✅ Admins must follow these rules (no bypass)"
    echo "   ✅ Force push disabled"
    echo "   ✅ Branch deletion disabled"
    echo "   ✅ Conversation resolution required"
    echo ""
    echo "🔐 What this means:"
    echo "   - No direct commits to main (must use PRs)"
    echo "   - All CI checks must pass"
    echo "   - At least 1 team member must approve"
    echo "   - Even admins can't bypass these rules"
    echo ""
else
    echo "❌ Failed to configure branch protection"
    echo ""
    echo "Response from GitHub:"
    echo "$RESPONSE" | jq '.'
    echo ""
    exit 1
fi

# ==================================================================
# Verify configuration
# ==================================================================
echo "🔍 Verifying configuration..."
VERIFICATION=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection")

if echo "$VERIFICATION" | jq -e '.enforce_admins.enabled' > /dev/null 2>&1; then
    echo "✅ Verification passed"
    echo ""
    echo "📊 Current Protection Status:"
    echo "$VERIFICATION" | jq '{
        enforce_admins: .enforce_admins.enabled,
        required_pr_reviews: .required_pull_request_reviews.required_approving_review_count,
        required_status_checks: .required_status_checks.contexts
    }'
else
    echo "⚠️  Could not verify configuration"
fi

echo ""
echo "✅ Branch protection setup complete!"
echo ""
