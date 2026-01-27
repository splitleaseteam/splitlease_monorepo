/**
 * Recalculate Pricing List Handler
 *
 * Force recalculation of all pricing values.
 * Used for admin operations or when site-wide parameters change.
 *
 * NO FALLBACK PRINCIPLE: Fails fast if listing not found
 */

import { handleCreate } from './create.ts';

interface RecalculatePayload {
  listing_id: string;
  user_id?: string;
}

interface RecalculateResult {
  pricing_list_id: string;
  listing_id: string;
  starting_nightly_price: number | null;
  message: string;
  recalculated: boolean;
}

/**
 * Handle recalculate pricing list action
 */
export async function handleRecalculate(
  payload: Record<string, unknown>
): Promise<RecalculateResult> {
  console.log('[pricing-list:recalculate] ========== RECALCULATE PRICING LIST ==========');
  console.log('[pricing-list:recalculate] Force recalculating for listing:', payload.listing_id);

  // Recalculation is the same as create (upsert behavior)
  const result = await handleCreate(payload);

  return {
    ...result,
    recalculated: true,
    message: 'Pricing list recalculated successfully',
  };
}
