#!/bin/bash

# ==============================================================================
# Split Lease Production Rollback Script
# ==============================================================================
#
# Purpose: Automated rollback for production deployments
# Version: 1.0
# Date: 2026-01-29
#
# Usage:
#   ./scripts/rollback.sh [options]
#
# Options:
#   --dry-run           Show what would be done without executing
#   --execute           Execute the rollback (requires confirmation)
#   --frontend-only     Only rollback Cloudflare Pages
#   --functions-only    Only rollback Edge Functions
#   --database-only     Only rollback database migrations
#   --deployment-id ID  Specific Cloudflare deployment to rollback to
#   --help              Show this help message
#
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/.claude/rollback-$(date +%Y%m%d-%H%M%S).log"

# Default options
DRY_RUN=false
EXECUTE=false
FRONTEND_ONLY=false
FUNCTIONS_ONLY=false
DATABASE_ONLY=false
DEPLOYMENT_ID=""

# ==============================================================================
# Helper Functions
# ==============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)  color=$BLUE ;;
        WARN)  color=$YELLOW ;;
        ERROR) color=$RED ;;
        SUCCESS) color=$GREEN ;;
        *)     color=$NC ;;
    esac

    echo -e "${color}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

show_help() {
    head -30 "$0" | tail -25 | sed 's/^# //' | sed 's/^#//'
    exit 0
}

confirm() {
    local prompt="$1"
    local response

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY RUN] Would prompt: $prompt"
        return 0
    fi

    echo -e "${YELLOW}$prompt${NC}"
    read -r -p "Type 'yes' to confirm: " response

    if [ "$response" != "yes" ]; then
        log WARN "Operation cancelled by user"
        exit 1
    fi
}

check_prerequisites() {
    log INFO "Checking prerequisites..."

    # Check for required tools
    local required_tools=("supabase" "wrangler" "git" "curl")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log ERROR "Missing required tools: ${missing_tools[*]}"
        log ERROR "Please install missing tools before running rollback"
        exit 1
    fi

    # Check for required environment variables
    local required_vars=(
        "SUPABASE_PROJECT_ID_PROD"
        "SUPABASE_ACCESS_TOKEN_PROD"
        "CLOUDFLARE_ACCOUNT_ID"
        "CLOUDFLARE_API_TOKEN"
    )
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log WARN "Missing environment variables: ${missing_vars[*]}"
        log WARN "Some rollback operations may fail"
    fi

    log SUCCESS "Prerequisites check completed"
}

# ==============================================================================
# Cloudflare Pages Rollback
# ==============================================================================

get_previous_deployment() {
    log INFO "Fetching previous Cloudflare Pages deployments..."

    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
        log ERROR "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID required"
        return 1
    fi

    local deployments
    deployments=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/splitlease/deployments" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json")

    if echo "$deployments" | grep -q '"success":true'; then
        # Get the second deployment (first is current, second is previous)
        local prev_id
        prev_id=$(echo "$deployments" | jq -r '.result[1].id // empty')

        if [ -n "$prev_id" ]; then
            log INFO "Found previous deployment: $prev_id"
            echo "$prev_id"
        else
            log ERROR "No previous deployment found"
            return 1
        fi
    else
        log ERROR "Failed to fetch deployments: $(echo "$deployments" | jq -r '.errors[0].message // "Unknown error"')"
        return 1
    fi
}

rollback_frontend() {
    log INFO "=== Frontend Rollback (Cloudflare Pages) ==="

    local target_deployment

    if [ -n "$DEPLOYMENT_ID" ]; then
        target_deployment="$DEPLOYMENT_ID"
    else
        target_deployment=$(get_previous_deployment) || return 1
    fi

    log INFO "Rolling back to deployment: $target_deployment"

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY RUN] Would rollback Cloudflare Pages to deployment: $target_deployment"
        return 0
    fi

    # Cloudflare Pages rollback via API
    local response
    response=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/splitlease/deployments/${target_deployment}/rollback" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json")

    if echo "$response" | grep -q '"success":true'; then
        log SUCCESS "Frontend rollback successful!"
        log INFO "New production deployment: $(echo "$response" | jq -r '.result.id')"
    else
        log ERROR "Frontend rollback failed: $(echo "$response" | jq -r '.errors[0].message // "Unknown error"')"
        return 1
    fi
}

# ==============================================================================
# Edge Functions Rollback
# ==============================================================================

rollback_edge_functions() {
    log INFO "=== Edge Functions Rollback ==="

    if [ -z "${SUPABASE_ACCESS_TOKEN_PROD:-}" ] || [ -z "${SUPABASE_PROJECT_ID_PROD:-}" ]; then
        log ERROR "SUPABASE_ACCESS_TOKEN_PROD and SUPABASE_PROJECT_ID_PROD required"
        return 1
    fi

    # Get list of functions to redeploy from previous commit
    local previous_commit
    previous_commit=$(git rev-parse HEAD~1)

    log INFO "Rolling back to commit: $previous_commit"

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY RUN] Would checkout supabase/functions from commit: $previous_commit"
        log INFO "[DRY RUN] Would redeploy all Edge Functions"
        return 0
    fi

    # Create a temporary branch for rollback
    local rollback_branch="rollback-$(date +%Y%m%d-%H%M%S)"

    log INFO "Creating rollback branch: $rollback_branch"
    git checkout -b "$rollback_branch"

    # Checkout previous version of functions
    git checkout "$previous_commit" -- supabase/functions/

    # Deploy all functions
    log INFO "Deploying Edge Functions from previous version..."

    export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN_PROD}"

    if supabase functions deploy --project-ref "${SUPABASE_PROJECT_ID_PROD}"; then
        log SUCCESS "Edge Functions rollback successful!"
    else
        log ERROR "Edge Functions rollback failed"
        git checkout -
        git branch -D "$rollback_branch"
        return 1
    fi

    # Return to original branch
    git checkout -
    git branch -D "$rollback_branch"

    log SUCCESS "Edge Functions rolled back successfully"
}

# ==============================================================================
# Database Rollback
# ==============================================================================

rollback_database() {
    log INFO "=== Database Rollback ==="

    if [ -z "${SUPABASE_ACCESS_TOKEN_PROD:-}" ] || [ -z "${SUPABASE_PROJECT_ID_PROD:-}" ]; then
        log ERROR "SUPABASE_ACCESS_TOKEN_PROD and SUPABASE_PROJECT_ID_PROD required"
        return 1
    fi

    log WARN "DATABASE ROLLBACK IS DANGEROUS AND CANNOT BE AUTOMATED SAFELY"
    log WARN "Manual intervention required for database rollback"
    log INFO ""
    log INFO "Steps for manual database rollback:"
    log INFO "1. Identify the migrations to roll back"
    log INFO "2. Create and test DOWN migrations"
    log INFO "3. Apply DOWN migrations in reverse order"
    log INFO "4. Verify data integrity"
    log INFO ""
    log INFO "Recent migrations that may need rollback:"

    # List recent migrations
    ls -la "$PROJECT_ROOT/supabase/migrations/" | tail -10

    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY RUN] Would display migration rollback instructions"
        return 0
    fi

    log WARN ""
    log WARN "To rollback a specific migration, run:"
    log WARN "  supabase migration repair --status reverted <migration_version> --project-ref \$SUPABASE_PROJECT_ID_PROD"
    log WARN ""
    log WARN "Then apply the DOWN migration manually via SQL editor"

    confirm "Have you reviewed the database rollback requirements? This step requires manual action."
}

# ==============================================================================
# Verification
# ==============================================================================

verify_rollback() {
    log INFO "=== Verifying Rollback ==="

    local errors=0

    if [ "$FRONTEND_ONLY" = true ] || [ "$FUNCTIONS_ONLY" = false ] && [ "$DATABASE_ONLY" = false ]; then
        # Verify frontend
        log INFO "Verifying frontend deployment..."
        local site_status
        site_status=$(curl -s -o /dev/null -w "%{http_code}" "https://split.lease")

        if [ "$site_status" = "200" ]; then
            log SUCCESS "Frontend is responding (HTTP $site_status)"
        else
            log ERROR "Frontend verification failed (HTTP $site_status)"
            ((errors++))
        fi
    fi

    if [ "$FUNCTIONS_ONLY" = true ] || [ "$FRONTEND_ONLY" = false ] && [ "$DATABASE_ONLY" = false ]; then
        # Verify Edge Functions
        log INFO "Verifying Edge Functions..."

        local project_url="${SUPABASE_PROJECT_URL_PROD:-https://qcfifybkaddcoimjroca.supabase.co}"
        local anon_key="${SUPABASE_ANON_KEY_PROD:-}"

        if [ -n "$anon_key" ]; then
            local functions=("auth-user" "proposal" "listing")

            for func in "${functions[@]}"; do
                local func_status
                func_status=$(curl -s -o /dev/null -w "%{http_code}" \
                    --max-time 10 \
                    -X POST "$project_url/functions/v1/$func" \
                    -H "Authorization: Bearer $anon_key" \
                    -H "Content-Type: application/json" \
                    -d '{"action":"health","payload":{}}')

                if [[ "$func_status" =~ ^[24][0-9][0-9]$ ]]; then
                    log SUCCESS "Edge Function '$func' is responding (HTTP $func_status)"
                else
                    log ERROR "Edge Function '$func' verification failed (HTTP $func_status)"
                    ((errors++))
                fi
            done
        else
            log WARN "SUPABASE_ANON_KEY_PROD not set, skipping Edge Function verification"
        fi
    fi

    if [ $errors -gt 0 ]; then
        log ERROR "Rollback verification completed with $errors error(s)"
        return 1
    else
        log SUCCESS "Rollback verification completed successfully"
        return 0
    fi
}

# ==============================================================================
# Notification
# ==============================================================================

send_notification() {
    local status=$1
    local message=$2

    # Send to Slack if webhook is configured
    if [ -n "${SLACK_WEBHOOK_DATABASE_WEBHOOK:-}" ]; then
        local emoji
        case $status in
            success) emoji=":white_check_mark:" ;;
            error)   emoji=":x:" ;;
            *)       emoji=":information_source:" ;;
        esac

        curl -s -X POST "$SLACK_WEBHOOK_DATABASE_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$emoji *Production Rollback* - $message\"}" \
            > /dev/null 2>&1 || true
    fi
}

# ==============================================================================
# Main Execution
# ==============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --execute)
                EXECUTE=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --functions-only)
                FUNCTIONS_ONLY=true
                shift
                ;;
            --database-only)
                DATABASE_ONLY=true
                shift
                ;;
            --deployment-id)
                DEPLOYMENT_ID="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                ;;
            *)
                log ERROR "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

main() {
    parse_args "$@"

    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"

    log INFO "=============================================="
    log INFO "Split Lease Production Rollback"
    log INFO "=============================================="
    log INFO "Timestamp: $(date)"
    log INFO "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "EXECUTE")"
    log INFO "Log file: $LOG_FILE"
    log INFO "=============================================="

    if [ "$DRY_RUN" = false ] && [ "$EXECUTE" = false ]; then
        log ERROR "You must specify either --dry-run or --execute"
        log INFO "Use --dry-run first to preview changes"
        exit 1
    fi

    if [ "$EXECUTE" = true ]; then
        confirm "WARNING: You are about to rollback production. This action may cause service disruption."
    fi

    check_prerequisites

    local rollback_errors=0

    # Execute rollback based on options
    if [ "$FRONTEND_ONLY" = true ]; then
        rollback_frontend || ((rollback_errors++))
    elif [ "$FUNCTIONS_ONLY" = true ]; then
        rollback_edge_functions || ((rollback_errors++))
    elif [ "$DATABASE_ONLY" = true ]; then
        rollback_database || ((rollback_errors++))
    else
        # Full rollback
        log INFO "Executing full production rollback..."

        rollback_frontend || ((rollback_errors++))
        rollback_edge_functions || ((rollback_errors++))
        rollback_database || ((rollback_errors++))
    fi

    # Verification
    if [ "$DRY_RUN" = false ]; then
        verify_rollback || ((rollback_errors++))
    fi

    # Summary
    log INFO "=============================================="
    if [ $rollback_errors -gt 0 ]; then
        log ERROR "Rollback completed with $rollback_errors error(s)"
        send_notification "error" "Rollback completed with errors. Check logs: $LOG_FILE"
        exit 1
    else
        log SUCCESS "Rollback completed successfully!"
        send_notification "success" "Production rollback completed successfully"
        exit 0
    fi
}

main "$@"
