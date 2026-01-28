#!/bin/bash
# SYSTEM ENFORCEMENT: TypeScript errors are NEVER ignored
# The || true pattern is BANNED at the system level
# Prevents: Runtime errors from type mismatches

set -e

echo "🔍 Running TypeScript verification..."

# Run typecheck and capture output
TSC_OUTPUT=$(cd app && bun run typecheck 2>&1) || TSC_EXIT=$?

if [ "${TSC_EXIT:-0}" -ne 0 ]; then
    echo "❌ SYSTEM BLOCK: TypeScript errors detected"
    echo ""
    echo "$TSC_OUTPUT"
    echo ""
    echo "📝 TypeScript errors MUST be fixed. The '|| true' escape hatch has been removed."
    echo "   If you believe this is a false positive, open a PR with justification."
    echo ""
    echo "   Common fixes:"
    echo "   - Add proper type annotations"
    echo "   - Fix property access on potentially undefined values"
    echo "   - Update tsconfig.json if needed"
    exit 1
fi

# Count errors/warnings even if exit code was 0
ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
WARNING_COUNT=$(echo "$TSC_OUTPUT" | grep -c "warning" || true)

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "❌ SYSTEM BLOCK: $ERROR_COUNT TypeScript errors found"
    echo "$TSC_OUTPUT"
    echo ""
    echo "   TypeScript errors detected even though tsc exited with code 0."
    echo "   This should not happen. Check tsconfig.json configuration."
    exit 1
fi

echo "✅ TypeScript verification passed (0 errors, $WARNING_COUNT warnings)"
