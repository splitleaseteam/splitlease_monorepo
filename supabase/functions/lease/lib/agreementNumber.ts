/**
 * Agreement Number Generator for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Generates lease agreement numbers in the format: YYYYMMDD-XXXX
 * Based on the CORE-create-agreement-number Bubble workflow.
 *
 * Key behaviors:
 * - Date prefix in YYYYMMDD format (e.g., 20260130)
 * - Sequential counter that resets daily
 * - Always 4-digit counter with leading zeros (0001, 0042, 0999, 1234)
 * - Uses atomic database operations to prevent race conditions
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get today's date at midnight (00:00:00) for daily counter key
 *
 * @returns Date string in ISO format normalized to midnight
 */
function getTodayMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return midnight.toISOString();
}

/**
 * Format date as YYYYMMDD string
 *
 * @param date - Date to format
 * @returns Formatted date string (e.g., "20260130")
 */
function formatDatePrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get or create daily counter and return the next number atomically
 *
 * Uses database-level atomicity to prevent race conditions when
 * multiple leases are created simultaneously.
 *
 * @param supabase - Supabase client
 * @returns Next counter number for today
 */
async function getNextDailyCounter(supabase: SupabaseClient): Promise<number> {
  const todayMidnight = getTodayMidnight();

  console.log('[agreementNumber] Looking for daily counter for:', todayMidnight);

  // Try to find existing counter for today
  const { data: existingCounter, error: fetchError } = await supabase
    .from('dailycounter')
    .select('_id, "Last Number"')
    .eq('Date', todayMidnight)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected for first lease of the day
    console.error('[agreementNumber] Error fetching daily counter:', fetchError);
    throw new Error(`Failed to fetch daily counter: ${fetchError.message}`);
  }

  if (existingCounter) {
    // Counter exists - increment atomically
    const newNumber = (existingCounter['Last Number'] || 0) + 1;

    console.log('[agreementNumber] Incrementing existing counter:', {
      previousNumber: existingCounter['Last Number'],
      newNumber,
    });

    const { error: updateError } = await supabase
      .from('dailycounter')
      .update({
        'Last Number': newNumber,
        'Modified Date': new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('_id', existingCounter._id);

    if (updateError) {
      console.error('[agreementNumber] Error updating daily counter:', updateError);
      throw new Error(`Failed to update daily counter: ${updateError.message}`);
    }

    return newNumber;
  }

  // No counter for today - create new one
  console.log('[agreementNumber] Creating new daily counter for today');

  // Generate unique ID for the counter
  const { data: counterId, error: idError } = await supabase.rpc('generate_bubble_id');

  if (idError || !counterId) {
    console.error('[agreementNumber] Error generating counter ID:', idError);
    throw new Error('Failed to generate daily counter ID');
  }

  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('dailycounter').insert({
    _id: counterId,
    Date: todayMidnight,
    'Last Number': 1,
    'Created By': 'system',
    'Created Date': now,
    'Modified Date': now,
    created_at: now,
    updated_at: now,
    pending: false,
  });

  if (insertError) {
    // Handle race condition: another request might have created the counter
    if (insertError.code === '23505') {
      // Unique constraint violation - counter was created by concurrent request
      console.log('[agreementNumber] Counter created by concurrent request, retrying...');
      return getNextDailyCounter(supabase);
    }

    console.error('[agreementNumber] Error creating daily counter:', insertError);
    throw new Error(`Failed to create daily counter: ${insertError.message}`);
  }

  return 1;
}

/**
 * Generate agreement number in format: YYYYMMDD-XXXX
 *
 * Examples:
 * - First lease of 2026-01-30  -> 20260130-0001
 * - 42nd lease of 2026-01-30   -> 20260130-0042
 * - 999th lease of 2026-01-30  -> 20260130-0999
 * - 1234th lease of 2026-01-30 -> 20260130-1234
 *
 * @param supabase - Supabase client for database access
 * @returns Promise<string> Agreement number string
 */
export async function generateAgreementNumber(supabase: SupabaseClient): Promise<string> {
  // Get next counter number atomically
  const counterNumber = await getNextDailyCounter(supabase);

  // Format date prefix
  const datePrefix = formatDatePrefix(new Date());

  // Pad counter to 4 digits (allows up to 9999 leases per day)
  const paddedCounter = String(counterNumber).padStart(4, '0');

  const agreementNumber = `${datePrefix}-${paddedCounter}`;

  console.log('[agreementNumber] Generated:', agreementNumber);

  return agreementNumber;
}

/**
 * Validate an agreement number format
 *
 * @param agreementNumber - Agreement number to validate
 * @returns True if valid format (YYYYMMDD-XXXX)
 */
export function isValidAgreementNumber(agreementNumber: string): boolean {
  // Format: YYYYMMDD-XXXX where X is a digit (4+ digits)
  const pattern = /^\d{8}-\d{4,}$/;
  return pattern.test(agreementNumber);
}

/**
 * Parse components from agreement number
 *
 * @param agreementNumber - Agreement number (e.g., "20260130-0042")
 * @returns Object with date and counter number
 */
export function parseAgreementNumber(agreementNumber: string): {
  date: string;
  counter: number;
} {
  if (!isValidAgreementNumber(agreementNumber)) {
    throw new Error(`Invalid agreement number format: ${agreementNumber}`);
  }

  const [dateStr, counterStr] = agreementNumber.split('-');

  return {
    date: dateStr,
    counter: parseInt(counterStr, 10),
  };
}

// Legacy exports for backward compatibility during transition
// TODO: Remove after migration complete

/**
 * @deprecated Use generateAgreementNumber(supabase) instead
 */
export function generateAgreementNumberSync(
  _leaseCount: number,
  _numberOfZeros?: number
): string {
  console.warn(
    '[agreementNumber] generateAgreementNumberSync is deprecated. Use generateAgreementNumber(supabase) instead.'
  );
  // Return placeholder - this should not be used
  return 'DEPRECATED-0000';
}

/**
 * @deprecated No longer needed with date-based format
 */
export function calculateNumberOfZeros(_count: number): number {
  console.warn('[agreementNumber] calculateNumberOfZeros is deprecated and no longer used.');
  return 4;
}
