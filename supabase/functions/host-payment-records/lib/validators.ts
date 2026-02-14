/**
 * Input Validation for Host Payment Records Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Re-exports shared payment validators. The validation logic is identical
 * for both guest and host payment record generation.
 */

export {
  validateGenerateInput,
  normalizeRentalType,
  normalizeWeekPattern,
} from '../../_shared/paymentValidators.ts';
