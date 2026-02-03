-- ============================================================================
-- BULK FIX: Proposal Pricing Recalculation
-- ============================================================================
-- This script recalculates pricing fields for ALL proposals based on their
-- linked listing's pricing_list table.
--
-- Logic:
-- 1. Get nights_per_week from the proposal's "Nights Selected (Nights list)" array length
--    (or fallback to "nights per week (num)")
-- 2. Get weeks from "Reservation Span (Weeks)"
-- 3. Look up pricing_list arrays:
--    - "Nightly Price" array at index (nights_per_week - 1) for guest nightly rate
--    - "Host Compensation" array at index (nights_per_week - 1) for host nightly rate
-- 4. Calculate:
--    - `4 week compensation` = host_nightly_rate * nights_per_week * 4
--    - `Total Compensation (proposal - host)` = host_nightly_rate * nights_per_week * weeks
--    - `Total Price for Reservation (guest)` = guest_nightly_rate * nights_per_week * weeks
-- ============================================================================

-- ============================================================================
-- STEP 1: ANALYSIS - Count proposals that will be affected
-- ============================================================================

-- Count all proposals with linked pricing_list
SELECT
    'Proposals with pricing_list' as metric,
    COUNT(*) as count
FROM proposal p
JOIN listing l ON p."Listing" = l._id
JOIN pricing_list pl ON l.pricing_list = pl._id
WHERE p."Status" NOT IN ('Cancelled', 'Expired', 'Declined', 'Deleted')
  AND l.pricing_list IS NOT NULL;

-- ============================================================================
-- STEP 2: PREVIEW - Show sample proposals with current vs calculated values
-- ============================================================================

WITH proposal_pricing AS (
    SELECT
        p._id as proposal_id,
        p."Status" as status,
        l._id as listing_id,
        l."Name" as listing_name,

        -- Get nights_per_week from the nights array length
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) as nights_per_week,

        -- Get weeks from reservation span
        p."Reservation Span (Weeks)" as weeks,

        -- Current values
        p."4 week compensation" as current_4_week_compensation,
        p."Total Compensation (proposal - host)" as current_host_total,
        p."Total Price for Reservation (guest)" as current_guest_total,

        -- Get pricing arrays
        pl."Nightly Price" as nightly_price_array,
        pl."Host Compensation" as host_compensation_array

    FROM proposal p
    JOIN listing l ON p."Listing" = l._id
    JOIN pricing_list pl ON l.pricing_list = pl._id
    WHERE p."Status" NOT IN ('Cancelled', 'Expired', 'Declined', 'Deleted')
      AND l.pricing_list IS NOT NULL
),
calculated AS (
    SELECT
        pp.*,

        -- Extract guest nightly rate from array (0-indexed, so nights-1)
        (pp.nightly_price_array->(pp.nights_per_week - 1))::numeric as guest_nightly_rate,

        -- Extract host nightly rate from array (0-indexed, so nights-1)
        (pp.host_compensation_array->(pp.nights_per_week - 1))::numeric as host_nightly_rate,

        -- Calculate new values
        -- 4 week compensation = host_nightly_rate * nights_per_week * 4
        ((pp.host_compensation_array->(pp.nights_per_week - 1))::numeric * pp.nights_per_week * 4) as new_4_week_compensation,

        -- Total host compensation = host_nightly_rate * nights_per_week * weeks
        ((pp.host_compensation_array->(pp.nights_per_week - 1))::numeric * pp.nights_per_week * pp.weeks) as new_host_total,

        -- Total guest price = guest_nightly_rate * nights_per_week * weeks
        ((pp.nightly_price_array->(pp.nights_per_week - 1))::numeric * pp.nights_per_week * pp.weeks) as new_guest_total

    FROM proposal_pricing pp
    WHERE pp.nights_per_week IS NOT NULL
      AND pp.nights_per_week > 0
      AND pp.nights_per_week <= 7
      AND pp.weeks IS NOT NULL
      AND pp.weeks > 0
)
SELECT
    proposal_id,
    status,
    listing_name,
    nights_per_week,
    weeks,

    -- Current values
    current_4_week_compensation,
    current_host_total,
    current_guest_total,

    -- New calculated values
    ROUND(new_4_week_compensation, 2) as new_4_week_compensation,
    ROUND(new_host_total, 2) as new_host_total,
    ROUND(new_guest_total, 2) as new_guest_total,

    -- Delta
    ROUND(new_4_week_compensation - COALESCE(current_4_week_compensation, 0), 2) as delta_4_week,
    ROUND(new_host_total - COALESCE(current_host_total, 0), 2) as delta_host_total,
    ROUND(new_guest_total - COALESCE(current_guest_total::numeric, 0), 2) as delta_guest_total

FROM calculated
WHERE new_4_week_compensation IS NOT NULL
ORDER BY proposal_id
LIMIT 20;

-- ============================================================================
-- STEP 3: COUNT proposals that will actually be updated
-- ============================================================================

WITH to_update AS (
    SELECT
        p._id,
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) as nights_per_week,
        p."Reservation Span (Weeks)" as weeks,
        pl."Nightly Price" as nightly_price_array,
        pl."Host Compensation" as host_compensation_array
    FROM proposal p
    JOIN listing l ON p."Listing" = l._id
    JOIN pricing_list pl ON l.pricing_list = pl._id
    WHERE l.pricing_list IS NOT NULL
)
SELECT
    'Proposals to be updated' as metric,
    COUNT(*) as count
FROM to_update
WHERE nights_per_week IS NOT NULL
  AND nights_per_week > 0
  AND nights_per_week <= 7
  AND weeks IS NOT NULL
  AND weeks > 0
  AND (nightly_price_array->(nights_per_week - 1)) IS NOT NULL
  AND (host_compensation_array->(nights_per_week - 1)) IS NOT NULL;

-- ============================================================================
-- STEP 4: EXECUTE THE UPDATE (UNCOMMENT TO RUN)
-- ============================================================================

-- UPDATE proposal p
-- SET
--     "4 week compensation" = ROUND(
--         (pl."Host Compensation"->(
--             COALESCE(
--                 jsonb_array_length(p."Nights Selected (Nights list)"),
--                 (p."nights per week (num)")::int
--             ) - 1
--         ))::numeric *
--         COALESCE(
--             jsonb_array_length(p."Nights Selected (Nights list)"),
--             (p."nights per week (num)")::int
--         ) * 4,
--     0)::integer,
--
--     "Total Compensation (proposal - host)" = ROUND(
--         (pl."Host Compensation"->(
--             COALESCE(
--                 jsonb_array_length(p."Nights Selected (Nights list)"),
--                 (p."nights per week (num)")::int
--             ) - 1
--         ))::numeric *
--         COALESCE(
--             jsonb_array_length(p."Nights Selected (Nights list)"),
--             (p."nights per week (num)")::int
--         ) *
--         p."Reservation Span (Weeks)",
--     2),
--
--     "Total Price for Reservation (guest)" = ROUND(
--         (pl."Nightly Price"->(
--             COALESCE(
--                 jsonb_array_length(p."Nights Selected (Nights list)"),
--                 (p."nights per week (num)")::int
--             ) - 1
--         ))::numeric *
--         COALESCE(
--             jsonb_array_length(p."Nights Selected (Nights list)"),
--             (p."nights per week (num)")::int
--         ) *
--         p."Reservation Span (Weeks)",
--     2)
--
-- FROM listing l
-- JOIN pricing_list pl ON l.pricing_list = pl._id
-- WHERE p."Listing" = l._id
--   AND l.pricing_list IS NOT NULL
--   AND COALESCE(
--         jsonb_array_length(p."Nights Selected (Nights list)"),
--         (p."nights per week (num)")::int
--     ) IS NOT NULL
--   AND COALESCE(
--         jsonb_array_length(p."Nights Selected (Nights list)"),
--         (p."nights per week (num)")::int
--     ) > 0
--   AND COALESCE(
--         jsonb_array_length(p."Nights Selected (Nights list)"),
--         (p."nights per week (num)")::int
--     ) <= 7
--   AND p."Reservation Span (Weeks)" IS NOT NULL
--   AND p."Reservation Span (Weeks)" > 0
--   AND (pl."Nightly Price"->(
--         COALESCE(
--             jsonb_array_length(p."Nights Selected (Nights list)"),
--             (p."nights per week (num)")::int
--         ) - 1
--     )) IS NOT NULL
--   AND (pl."Host Compensation"->(
--         COALESCE(
--             jsonb_array_length(p."Nights Selected (Nights list)"),
--             (p."nights per week (num)")::int
--         ) - 1
--     )) IS NOT NULL;
