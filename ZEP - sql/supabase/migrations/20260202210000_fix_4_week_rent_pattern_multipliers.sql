-- Fix 4 week rent field with pattern-aware multipliers
-- The previous calculation always used 4 as the multiplier, but different
-- week patterns should have different multipliers:
-- - Every week: 4 weeks
-- - One week on, one week off: 2 weeks
-- - Two weeks on, two weeks off: 2 weeks
-- - 2on2off: 2 weeks
-- - One week on, three weeks off: 1 week

UPDATE proposal
SET "4 week rent" = "proposal nightly price" * "nights per week (num)" *
  CASE
    WHEN "week selection" = 'Every week' THEN 4
    WHEN "week selection" IN ('One week on, one week off', 'Two weeks on, two weeks off', '2on2off') THEN 2
    WHEN "week selection" = 'One week on, three weeks off' THEN 1
    ELSE 4
  END
WHERE "proposal nightly price" IS NOT NULL
  AND "nights per week (num)" IS NOT NULL
  AND "nights per week (num)" > 0;
