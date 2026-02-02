# Daily Agreement Number Migration Plan

**Date**: 2026-01-29
**Status**: Ready for Review
**Classification**: BUILD

---

## Executive Summary

Migrate agreement number generation from total-count-based (`SL-XXXXX`) to date-based daily counter (`YYYYMMDD-XXXX`) format per Bubble CORE-create-agreement-number workflow.

---

## Requirements Document Corrections

### Issues Identified in Source Document

| Issue | Bubble Spec | Correction for Supabase |
|-------|-------------|------------------------|
| **Format code "1028.58"** | Bubble-specific formatting magic number | Use `String(n).padStart(4, '0')` - standard JS |
| **how_many_zeros = 1,2,3** | 3 separate conditional steps | **Simplify**: Always use 4-digit padding (`0001`-`9999`) |
| **3-second delay** | `+ seconds: 3` scheduling | **Remove**: Use atomic DB increment instead |
| **Race conditions** | Relies on Bubble's internal handling | **Add**: PostgreSQL `UPSERT` with atomic increment |
| **≥1000 gap** | No handling for 1000+ leases/day | **Handle**: Let it overflow to 5+ digits naturally |
| **Daily Counter table** | Separate Bubble data type | **Create**: New `daily_counter` Supabase table |

### Simplified Zero-Padding Decision

**Bubble's Complex Logic (UNNECESSARY):**
```
count < 10   → 3 zeros → 000X
count < 100  → 2 zeros → 00XX
count < 1000 → 1 zero  → 0XXX
```

**Our Approach (SIMPLER):**
```
Always → 4 digits → XXXX (0001, 0042, 0999, 1234, 9999)
> 9999 → Let overflow naturally → 10000+
```

This simplification:
- Eliminates 3 conditional code paths
- Provides consistent 4-digit format through 9,999 daily leases
- No realistic scenario hits 10,000+ leases/day

---

## Architecture

### Current State

```
supabase/functions/lease/
├── index.ts                    # Main entry point
├── handlers/
│   └── create.ts               # Lease creation (line 179-187 uses old format)
└── lib/
    └── agreementNumber.ts      # Current SL-XXXXX generator
```

**Current Flow (lines 179-187 in create.ts):**
```typescript
const { count: leaseCount } = await supabase
  .from('bookings_leases')
  .select('*', { count: 'exact', head: true });

const agreementNumber = generateAgreementNumber(leaseCount || 0);
// Returns: SL-00042
```

### Target State

```
supabase/
├── migrations/
│   └── 20260129_create_daily_counter.sql    # NEW: Table + atomic function
└── functions/lease/
    └── lib/
        └── agreementNumber.ts                # MODIFY: Date-based generator
```

**New Flow:**
```typescript
const agreementNumber = await generateDailyAgreementNumber(supabase);
// Returns: 20260129-0042
```

---

## Implementation Steps

### Step 1: Create Database Migration

**File**: `supabase/migrations/20260129_create_daily_counter.sql`

```sql
-- Daily Counter table for date-based agreement numbers
CREATE TABLE IF NOT EXISTS daily_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_date DATE NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX idx_daily_counter_date ON daily_counter(counter_date);

-- RLS policies (service role only - internal use)
ALTER TABLE daily_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON daily_counter
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic increment function (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_daily_counter(target_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number INTEGER;
BEGIN
  -- Insert new row or increment existing, return the new value
  INSERT INTO daily_counter (counter_date, last_number, created_at, modified_at)
  VALUES (target_date, 1, NOW(), NOW())
  ON CONFLICT (counter_date)
  DO UPDATE SET
    last_number = daily_counter.last_number + 1,
    modified_at = NOW()
  RETURNING last_number INTO new_number;

  RETURN new_number;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION increment_daily_counter(DATE) TO service_role;
```

### Step 2: Update agreementNumber.ts

**File**: `supabase/functions/lease/lib/agreementNumber.ts`

Replace current implementation with:

```typescript
/**
 * Agreement Number Generator for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Generates lease agreement numbers in the format: YYYYMMDD-XXXX
 * Based on daily sequential counter (resets each day).
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Generate date-based agreement number: YYYYMMDD-XXXX
 *
 * Uses atomic database increment to prevent race conditions.
 * Counter resets to 0001 each new day.
 *
 * @param supabase - Supabase client with service role
 * @returns Agreement number string (e.g., "20260129-0042")
 */
export async function generateDailyAgreementNumber(
  supabase: SupabaseClient
): Promise<string> {
  // Get today's date in YYYYMMDD format
  const today = new Date();
  const dateString = formatDateYYYYMMDD(today);
  const dateOnly = today.toISOString().split('T')[0]; // YYYY-MM-DD for DB

  // Atomic increment - prevents race conditions
  const { data: counter, error } = await supabase.rpc('increment_daily_counter', {
    target_date: dateOnly,
  });

  if (error) {
    console.error('[agreementNumber] Failed to increment counter:', error);
    throw new Error(`Agreement number generation failed: ${error.message}`);
  }

  // Format counter with zero-padding (always 4 digits)
  const paddedCounter = String(counter).padStart(4, '0');

  return `${dateString}-${paddedCounter}`;
}

/**
 * Format date as YYYYMMDD string
 *
 * @param date - Date object
 * @returns Formatted string (e.g., "20260129")
 */
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Validate a daily agreement number format
 *
 * @param agreementNumber - Agreement number to validate
 * @returns True if valid format (YYYYMMDD-XXXX)
 */
export function isValidDailyAgreementNumber(agreementNumber: string): boolean {
  // Format: YYYYMMDD-XXXX where X is a digit (4+ digits)
  const pattern = /^\d{8}-\d{4,}$/;
  return pattern.test(agreementNumber);
}

/**
 * Parse components from daily agreement number
 *
 * @param agreementNumber - Agreement number (e.g., "20260129-0042")
 * @returns Parsed components { date, counter }
 */
export function parseDailyAgreementNumber(agreementNumber: string): {
  date: string;
  counter: number;
} {
  if (!isValidDailyAgreementNumber(agreementNumber)) {
    throw new Error(`Invalid agreement number format: ${agreementNumber}`);
  }

  const [datePart, counterPart] = agreementNumber.split('-');
  return {
    date: datePart,
    counter: parseInt(counterPart, 10),
  };
}

// ============================================================
// LEGACY SUPPORT (for existing SL-XXXXX numbers)
// ============================================================

/**
 * @deprecated Use generateDailyAgreementNumber instead
 * Kept for backward compatibility with existing leases
 */
export function generateAgreementNumber(
  leaseCount: number,
  numberOfZeros?: number
): string {
  const zeros = numberOfZeros ?? calculateNumberOfZeros(leaseCount);
  const leaseNumber = leaseCount + 1;
  const padded = String(leaseNumber).padStart(zeros + 1, '0');
  return `SL-${padded}`;
}

/**
 * @deprecated Legacy zero calculation
 */
export function calculateNumberOfZeros(count: number): number {
  if (count < 10) return 4;
  if (count < 100) return 3;
  if (count < 1000) return 2;
  return 1;
}

/**
 * Validate either format (legacy SL-XXXXX or new YYYYMMDD-XXXX)
 */
export function isValidAgreementNumber(agreementNumber: string): boolean {
  const legacyPattern = /^SL-\d{4,}$/;
  const dailyPattern = /^\d{8}-\d{4,}$/;
  return legacyPattern.test(agreementNumber) || dailyPattern.test(agreementNumber);
}

/**
 * Parse lease number from either format
 */
export function parseLeaseNumber(agreementNumber: string): number {
  if (!isValidAgreementNumber(agreementNumber)) {
    throw new Error(`Invalid agreement number format: ${agreementNumber}`);
  }

  if (agreementNumber.startsWith('SL-')) {
    return parseInt(agreementNumber.replace('SL-', ''), 10);
  }

  // Daily format: extract counter part
  const counterPart = agreementNumber.split('-')[1];
  return parseInt(counterPart, 10);
}
```

### Step 3: Update create.ts Handler

**File**: `supabase/functions/lease/handlers/create.ts`

**Change at lines 36, 179-187:**

```typescript
// Line 36 - Update import
import { generateDailyAgreementNumber } from '../lib/agreementNumber.ts';

// Lines 179-187 - Replace:
// OLD:
// const { count: leaseCount, error: countError } = await supabase
//   .from('bookings_leases')
//   .select('*', { count: 'exact', head: true });
// if (countError) {
//   console.warn('[lease:create] Could not count leases:', countError.message);
// }
// const agreementNumber = generateAgreementNumber(leaseCount || 0, input.numberOfZeros);

// NEW:
const agreementNumber = await generateDailyAgreementNumber(supabase);
console.log('[lease:create] Generated agreement number:', agreementNumber);
```

### Step 4: Update Types (if needed)

**File**: `supabase/functions/lease/lib/types.ts`

Check if `CreateLeasePayload.numberOfZeros` is still needed - it can be removed since we no longer use it.

```typescript
// Remove numberOfZeros from CreateLeasePayload interface
export interface CreateLeasePayload {
  proposalId: string;
  isCounteroffer: boolean;
  fourWeekRent: number;
  fourWeekCompensation: number;
  // numberOfZeros?: number;  // REMOVE - no longer needed
}
```

---

## Testing Checklist

### Unit Tests

- [ ] `generateDailyAgreementNumber` returns correct format `YYYYMMDD-XXXX`
- [ ] First lease of day returns `*-0001`
- [ ] Second lease of day returns `*-0002`
- [ ] Counter resets on new day
- [ ] `isValidDailyAgreementNumber` accepts valid formats
- [ ] `isValidAgreementNumber` accepts both legacy and new formats

### Integration Tests

- [ ] Create lease → agreement number generated correctly
- [ ] Two leases same day → sequential numbers
- [ ] Race condition test: 10 concurrent lease creations → all unique numbers
- [ ] Database constraint: unique on `counter_date`

### Edge Cases

- [ ] Lease created at 11:59:59 PM → correct date
- [ ] Lease created at 12:00:01 AM → new date, counter resets
- [ ] 9999th lease of day → `*-9999`
- [ ] 10000th lease of day → `*-10000` (5 digits, no error)

---

## Rollback Plan

If issues arise:

1. **Revert create.ts** to use legacy `generateAgreementNumber`
2. **Keep migration** - `daily_counter` table is harmless if unused
3. **No data migration needed** - existing leases keep `SL-XXXXX` format

---

## Files Changed Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `supabase/migrations/20260129_create_daily_counter.sql` | CREATE | +50 |
| `supabase/functions/lease/lib/agreementNumber.ts` | REPLACE | +80 (rewrite) |
| `supabase/functions/lease/handlers/create.ts` | MODIFY | +3, -8 |
| `supabase/functions/lease/lib/types.ts` | MODIFY | -1 |

---

## Decision: Email Notification

The Bubble workflow sends an internal email to `customer-reservations`. Options:

1. **Skip for now** - Leases are already visible in admin dashboards
2. **Use existing Slack notify** - Send to #ops-alerts channel (already in codebase)
3. **Add email later** - Create separate `send-internal-email` Edge Function

**Recommendation**: Use option 2 (Slack) for MVP, add email as separate enhancement.

---

## Approval Checklist

- [ ] Database migration reviewed
- [ ] Atomic increment logic verified
- [ ] Legacy format backward compatibility confirmed
- [ ] No frontend changes required (agreement number format is backend-only)
