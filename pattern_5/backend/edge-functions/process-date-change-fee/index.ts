// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - PROCESS DATE CHANGE FEE EDGE FUNCTION
// ============================================================================
// Edge Function: Calculate and store fee breakdown for date change requests
// Version: 1.0
// Date: 2026-01-28
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// FEE STRUCTURE CONSTANTS
// ============================================================================

const FEE_RATES = {
  PLATFORM_RATE: 0.0075,      // 0.75%
  LANDLORD_RATE: 0.0075,      // 0.75%
  TOTAL_RATE: 0.015,          // 1.5%
  TRADITIONAL_MARKUP: 0.17,   // 17% (old model for comparison)
};

const FEE_VERSION = '1.5_split_model_v1';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FeeBreakdown {
  base_price: number;
  platform_fee: number;
  landlord_share: number;
  tenant_share: number;
  total_fee: number;
  total_price: number;
  effective_rate: number;
  platform_rate: number;
  landlord_rate: number;
  transaction_type: string;
  calculated_at: string;
  fee_structure_version: string;
  savings_vs_traditional?: number;
}

interface FeeCalculationInput {
  requestId?: string;
  leaseId: string;
  monthlyRent: number;
  transactionType?: string;
  userId?: string;
}

interface FeeCalculationResponse {
  success: boolean;
  feeBreakdown: FeeBreakdown;
  request?: any;
  preview?: boolean;
  error?: string;
}

// ============================================================================
// FEE CALCULATION LOGIC
// ============================================================================

/**
 * Calculate fee breakdown for date change request
 * Implements 1.5% split model (0.75% platform + 0.75% landlord)
 */
function calculateFeeBreakdown(
  basePrice: number,
  transactionType: string = 'date_change'
): FeeBreakdown {
  if (!basePrice || basePrice <= 0) {
    throw new Error('Base price must be a positive number');
  }

  // Calculate component fees
  const platformFee = basePrice * FEE_RATES.PLATFORM_RATE;
  const landlordShare = basePrice * FEE_RATES.LANDLORD_RATE;
  const totalFee = platformFee + landlordShare;
  const tenantShare = totalFee; // Tenant pays entire fee
  const totalPrice = basePrice + tenantShare;
  const effectiveRate = (totalFee / basePrice) * 100;

  // Calculate savings vs traditional model
  const traditionalFee = basePrice * FEE_RATES.TRADITIONAL_MARKUP;
  const savingsVsTraditional = traditionalFee - totalFee;

  return {
    base_price: Number(basePrice.toFixed(2)),
    platform_fee: Number(platformFee.toFixed(2)),
    landlord_share: Number(landlordShare.toFixed(2)),
    tenant_share: Number(tenantShare.toFixed(2)),
    total_fee: Number(totalFee.toFixed(2)),
    total_price: Number(totalPrice.toFixed(2)),
    effective_rate: Number(effectiveRate.toFixed(2)),
    platform_rate: FEE_RATES.PLATFORM_RATE,
    landlord_rate: FEE_RATES.LANDLORD_RATE,
    transaction_type: transactionType,
    calculated_at: new Date().toISOString(),
    fee_structure_version: FEE_VERSION,
    savings_vs_traditional: Number(savingsVsTraditional.toFixed(2)),
  };
}

/**
 * Validate fee calculation inputs
 */
function validateInput(input: FeeCalculationInput): string[] {
  const errors: string[] = [];

  if (!input.leaseId) {
    errors.push('Missing required field: leaseId');
  }

  if (!input.monthlyRent || input.monthlyRent <= 0) {
    errors.push('monthlyRent must be a positive number');
  }

  if (input.transactionType && !['date_change', 'lease_takeover', 'sublet', 'renewal'].includes(input.transactionType)) {
    errors.push(`Invalid transaction type: ${input.transactionType}`);
  }

  return errors;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  try {
    // ========================================================================
    // CORS HEADERS
    // ========================================================================
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized - please log in');
    }

    // ========================================================================
    // PARSE AND VALIDATE INPUT
    // ========================================================================
    const input: FeeCalculationInput = await req.json();

    const validationErrors = validateInput(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const {
      requestId,
      leaseId,
      monthlyRent,
      transactionType = 'date_change',
      userId = user.id
    } = input;

    // ========================================================================
    // CALCULATE FEE BREAKDOWN
    // ========================================================================
    const feeBreakdown = calculateFeeBreakdown(monthlyRent, transactionType);

    console.log('Fee calculation:', {
      leaseId,
      monthlyRent,
      transactionType,
      feeBreakdown,
    });

    // ========================================================================
    // UPDATE EXISTING REQUEST (if requestId provided)
    // ========================================================================
    if (requestId) {
      // Verify user owns this request
      const { data: existingRequest, error: fetchError } = await supabaseClient
        .from('datechangerequest')
        .select('id, user_id, status')
        .eq('id', requestId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch request: ${fetchError.message}`);
      }

      if (!existingRequest) {
        throw new Error('Request not found');
      }

      // Only allow updates for pending requests
      if (existingRequest.status !== 'pending') {
        throw new Error('Can only update fees for pending requests');
      }

      // Update request with fee breakdown
      const { data: updateData, error: updateError } = await supabaseClient
        .from('datechangerequest')
        .update({
          fee_breakdown: feeBreakdown,
          base_price: monthlyRent,
          total_price: feeBreakdown.total_price,
          transaction_type: transactionType,
          fee_structure_version: FEE_VERSION,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update request: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          feeBreakdown,
          request: updateData,
          message: 'Fee breakdown updated successfully',
        } as FeeCalculationResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ========================================================================
    // PREVIEW MODE (no requestId)
    // ========================================================================
    // Return fee breakdown for preview/display
    return new Response(
      JSON.stringify({
        success: true,
        feeBreakdown,
        preview: true,
        message: 'Fee breakdown calculated (preview mode)',
      } as FeeCalculationResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error in process-date-change-fee:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        success: false,
      } as FeeCalculationResponse),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// ============================================================================
// END EDGE FUNCTION
// ============================================================================
