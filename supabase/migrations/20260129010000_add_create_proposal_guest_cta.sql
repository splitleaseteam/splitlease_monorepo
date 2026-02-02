-- Migration: Add create_proposal_guest CTA
-- Date: 2026-01-29
-- Purpose: Add the missing CTA record that enables the "Create Proposal" button
--          in the messaging page for guests who are inquiring about listings
--
-- Note: This CTA already exists in DEV (ID: 37, created 2026-01-16) but was
--       never synced to PRODUCTION.

-- Insert the create_proposal_guest CTA if it doesn't already exist
-- Values match the DEV database record exactly
INSERT INTO reference_table.os_messaging_cta (
    name,
    display,
    message,
    button_text,
    is_proposal_cta,
    is_lease_cta,
    is_review_cta,
    is_house_manual_cta,
    visible_to_guest_only,
    visible_to_host_only
)
SELECT
    'create_proposal_guest',
    'Create Proposal (Guest View)',
    'Interested in [Listing name]? Submit a proposal to [Host name] to start the booking process.',
    'Create Proposal',
    true,   -- is_proposal_cta (matches DEV)
    false,
    false,
    false,
    true,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM reference_table.os_messaging_cta
    WHERE name = 'create_proposal_guest'
);

-- Verify the insert
DO $$
DECLARE
    cta_count integer;
BEGIN
    SELECT COUNT(*) INTO cta_count
    FROM reference_table.os_messaging_cta
    WHERE name = 'create_proposal_guest';

    IF cta_count = 0 THEN
        RAISE EXCEPTION 'Failed to insert create_proposal_guest CTA';
    ELSE
        RAISE NOTICE 'create_proposal_guest CTA exists (count: %)', cta_count;
    END IF;
END $$;
