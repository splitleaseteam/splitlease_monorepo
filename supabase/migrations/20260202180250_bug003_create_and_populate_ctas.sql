-- BUG-003 Fix: Insert missing CTAs into reference_table.os_messaging_cta
-- Root Cause: Missing CTAs cause message creation to fail silently
--
-- Required CTAs:
-- 1. fill_out_rental_application
-- 2. view_proposal_host
-- 3. view_proposal_guest
-- 4. create_proposal_guest
-- 5. new_inquiry_host_view
--
-- Note: The `display` column has a unique constraint and FK references from _message table
-- We use ON CONFLICT DO NOTHING to avoid updating existing CTAs (which would break FK constraints)

-- Insert the 5 required CTAs with template messages
-- If CTA already exists (by name), skip it - don't update
INSERT INTO reference_table.os_messaging_cta (
  name,
  display,
  message,
  button_text,
  is_proposal_cta,
  visible_to_guest_only,
  visible_to_host_only
)
VALUES
  (
    'fill_out_rental_application',
    'Fill out Rental Application',
    'Hi [Guest name]! Your proposal for [Listing name] has been submitted. Please complete your rental application to continue.',
    'Complete Application',
    true,
    true,
    false
  ),
  (
    'view_proposal_host',
    'View Proposal (Host)',
    'Hi [Host name]! [Guest name] has submitted a proposal for [Listing name]. Review their request and respond.',
    'View Proposal',
    true,
    false,
    true
  ),
  (
    'view_proposal_guest',
    'View Proposal (Guest)',
    'Your proposal for [Listing name] is being reviewed by the host.',
    'View Status',
    true,
    true,
    false
  ),
  (
    'create_proposal_guest',
    'Create Proposal',
    'Hi [Guest name]! Start a conversation with [Host name] about [Listing name].',
    'Create Proposal',
    false,
    true,
    false
  ),
  (
    'new_inquiry_host_view',
    'New Inquiry',
    'Hi [Host name]! [Guest name] is interested in [Listing name].',
    'View Inquiry',
    false,
    false,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
DO $$
DECLARE
  cta_count INTEGER;
  cta_names TEXT;
BEGIN
  SELECT COUNT(*), string_agg(name, ', ')
  INTO cta_count, cta_names
  FROM reference_table.os_messaging_cta
  WHERE name IN (
    'fill_out_rental_application',
    'view_proposal_host',
    'view_proposal_guest',
    'create_proposal_guest',
    'new_inquiry_host_view'
  );

  RAISE NOTICE 'BUG-003 Fix Complete: % of 5 required CTAs now exist', cta_count;
  RAISE NOTICE 'CTAs present: %', cta_names;

  IF cta_count < 5 THEN
    RAISE WARNING 'BUG-003 Fix: Not all CTAs were inserted. Found % of 5.', cta_count;
  END IF;
END $$;
