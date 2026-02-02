/**
 * Agreement Number Generator for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Generates lease agreement numbers in the format: YYYYMMDD-XXXX
 * Based on daily sequential counter (resets each day).
 *
 * Migration from Bubble CORE-create-agreement-number workflow.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// PRIMARY API - Date-Based Agreement Numbers
// ============================================================

/**
 * Generate date-based agreement number: YYYYMMDD-XXXX
 *
 * Uses atomic database increment to prevent race conditions.
 * Counter resets to 0001 each new day.
 *
 * Examples:
 * - First lease of 2026-01-29  -> 20260129-0001
 * - Second lease of 2026-01-29 -> 20260129-0002
 * - 42nd lease of 2026-01-29   -> 20260129-0042
 * - First lease of 2026-01-30  -> 20260130-0001 (reset)
 *
 * @param supabase - Supabase client with service role
 * @returns Agreement number string (e.g., "20260129-0042")
 * @throws Error if database operation fails
 */
export async function generateDailyAgreementNumber(
  supabase: SupabaseClient
): Promise<string> {
  // Get today's date components
  const today = new Date();
  const dateString = formatDateYYYYMMDD(today);
  const dateOnly = today.toISOString().split('T')[0]; // YYYY-MM-DD for DB

  console.log('[agreementNumber] Generating for date:', dateOnly);

  // Atomic increment - prevents race conditions
  const { data: counter, error } = await supabase.rpc('increment_daily_counter', {
    target_date: dateOnly,
  });

  if (error) {
    console.error('[agreementNumber] Failed to increment counter:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Agreement number generation failed: ${error.message}`);
  }

  if (counter === null || counter === undefined) {
    throw new Error('Agreement number generation failed: No counter returned');
  }

  // Format counter with zero-padding (always 4 digits minimum)
  // Allows overflow to 5+ digits if > 9999 leases/day
  const paddedCounter = String(counter).padStart(4, '0');
  const agreementNumber = `${dateString}-${paddedCounter}`;

  console.log('[agreementNumber] Generated:', agreementNumber);

  return agreementNumber;
}

/**
 * Format date as YYYYMMDD string (no separators)
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

// ============================================================
// VALIDATION & PARSING
// ============================================================

/**
 * Validate a daily agreement number format (YYYYMMDD-XXXX)
 *
 * @param agreementNumber - Agreement number to validate
 * @returns True if valid daily format
 */
export function isValidDailyAgreementNumber(agreementNumber: string): boolean {
  // Format: YYYYMMDD-XXXX where X is a digit (4+ digits allowed)
  const pattern = /^\d{8}-\d{4,}$/;
  return pattern.test(agreementNumber);
}

/**
 * Parse components from daily agreement number
 *
 * @param agreementNumber - Agreement number (e.g., "20260129-0042")
 * @returns Parsed components { date, counter }
 * @throws Error if invalid format
 */
export function parseDailyAgreementNumber(agreementNumber: string): {
  date: string;
  counter: number;
} {
  if (!isValidDailyAgreementNumber(agreementNumber)) {
    throw new Error(`Invalid daily agreement number format: ${agreementNumber}`);
  }

  const [datePart, counterPart] = agreementNumber.split('-');
  return {
    date: datePart,
    counter: parseInt(counterPart, 10),
  };
}

/**
 * Validate either format (legacy SL-XXXXX or new YYYYMMDD-XXXX)
 *
 * @param agreementNumber - Agreement number to validate
 * @returns True if valid in either format
 */
export function isValidAgreementNumber(agreementNumber: string): boolean {
  const legacyPattern = /^SL-\d{4,}$/;
  const dailyPattern = /^\d{8}-\d{4,}$/;
  return legacyPattern.test(agreementNumber) || dailyPattern.test(agreementNumber);
}

/**
 * Parse lease number from either format
 *
 * @param agreementNumber - Agreement number (SL-XXXXX or YYYYMMDD-XXXX)
 * @returns Numeric counter part
 * @throws Error if invalid format
 */
export function parseLeaseNumber(agreementNumber: string): number {
  if (!isValidAgreementNumber(agreementNumber)) {
    throw new Error(`Invalid agreement number format: ${agreementNumber}`);
  }

  if (agreementNumber.startsWith('SL-')) {
    // Legacy format: SL-00042 -> 42
    return parseInt(agreementNumber.replace('SL-', ''), 10);
  }

  // Daily format: 20260129-0042 -> 42
  const counterPart = agreementNumber.split('-')[1];
  return parseInt(counterPart, 10);
}

// ============================================================
// LEGACY SUPPORT (for existing SL-XXXXX numbers)
// ============================================================

/**
 * @deprecated Use generateDailyAgreementNumber instead
 * Kept for backward compatibility with existing leases using SL-XXXXX format.
 *
 * Generate agreement number in format: SL-XXXXX
 * Where XXXXX is zero-padded based on lease count
 *
 * @param leaseCount - Current count of existing leases (0-indexed)
 * @param numberOfZeros - Override for zero padding (optional)
 * @returns Agreement number string (e.g., "SL-00042")
 */
export function generateAgreementNumber(
  leaseCount: number,
  numberOfZeros?: number
): string {
  // Calculate zeros based on current count if not provided
  const zeros = numberOfZeros ?? calculateNumberOfZeros(leaseCount);

  // New lease number is count + 1 (1-indexed)
  const leaseNumber = leaseCount + 1;

  // Pad with zeros to ensure minimum length
  const padded = String(leaseNumber).padStart(zeros + 1, '0');

  return `SL-${padded}`;
}

/**
 * @deprecated Legacy zero calculation for SL-XXXXX format
 *
 * Calculate number of zeros needed based on current count
 * Uses logarithmic scaling: 0-9 -> 4 zeros, 10-99 -> 3 zeros, etc.
 *
 * @param count - Current lease count
 * @returns Number of leading zeros needed
 */
export function calculateNumberOfZeros(count: number): number {
  if (count < 10) return 4;
  if (count < 100) return 3;
  if (count < 1000) return 2;
  if (count < 10000) return 1;
  return 0;
}
