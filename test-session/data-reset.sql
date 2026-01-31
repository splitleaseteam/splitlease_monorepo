-- ============================================================================
-- E2E Test Data Reset Script
--
-- Execute via Supabase MCP: mcp__supabase__execute_sql
-- Target: splitlease-backend-dev (NEVER production)
--
-- This script cleans up test data created during E2E testing while
-- preserving test accounts for reuse.
-- ============================================================================

-- Configuration (modify as needed)
-- Test email pattern: guest.test.%@splitlease.com
-- Test user prefix: Test Guest, Test Host

-- ============================================================================
-- STEP 1: Identify test data (SELECT first, then DELETE)
-- ============================================================================

-- Preview proposals to delete (created by test accounts)
SELECT p.id, p.listing_id, p.user_id, u.email, p.created_at
FROM proposals p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com'
ORDER BY p.created_at DESC;

-- Preview rental applications to delete
SELECT ra.id, ra.proposal_id, ra.created_at
FROM rental_applications ra
JOIN proposals p ON ra.proposal_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com'
ORDER BY ra.created_at DESC;

-- ============================================================================
-- STEP 2: Delete test data (in correct order for FK constraints)
-- ============================================================================

-- Delete rental applications first (FK to proposals)
DELETE FROM rental_applications ra
WHERE ra.proposal_id IN (
  SELECT p.id FROM proposals p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- Delete proposals
DELETE FROM proposals p
WHERE p.user_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- Delete messages (if any)
DELETE FROM messages m
WHERE m.sender_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================

-- Confirm no test proposals remain
SELECT COUNT(*) as remaining_proposals
FROM proposals p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com';

-- Should return 0

-- ============================================================================
-- OPTIONAL: Delete test accounts (only if preserveTestAccounts = false)
-- ============================================================================

-- WARNING: This deletes the test accounts themselves
-- Only run if you want to recreate accounts fresh each session

-- DELETE FROM auth.users
-- WHERE email LIKE 'guest.test.%@splitlease.com'
--   OR email = 'guest.test@splitlease.com';
