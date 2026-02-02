// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - PROCESS DATE CHANGE FEE EDGE FUNCTION
// ============================================================================
// Edge Function: Calculate and store fee breakdown for date change requests
// Version: 1.0
// Date: 2026-01-29
// PCI Compliance: This function does not handle card data directly
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
  MINIMUM_FEE: 5.00,          // Minimum $5 fee
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
  feeBreakdown?: FeeBreakdown;
  request?: Record<string, unknown>;
  preview?: boolean;
  message?: string;
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
  let platformFee = basePrice * FEE_RATES.PLATFORM_RATE;
  let landlordShare = basePrice * FEE_RATES.LANDLORD_RATE;
  let totalFee = platformFee + landlordShare;

  // Apply minimum fee if total is below threshold
  if (totalFee < FEE_RATES.MINIMUM_FEE) {
    totalFee = FEE_RATES.MINIMUM_FEE;
    platformFee = totalFee / 2;
    landlordShare = totalFee / 2;
  }

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

  if (input.monthlyRent && input.monthlyRent > 1000000) {
    errors.push('monthlyRent exceeds maximum allowed value');
  }

  if (input.transactionType && !['date_change', 'lease_takeover', 'sublet', 'renewal'].includes(input.transactionType)) {
    errors.push(`Invalid transaction type: ${input.transactionType}`);
  }

  return errors;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  try {
    // ========================================================================
    // CORS PREFLIGHT
    // ========================================================================
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // ========================================================================
    // AUTHENTICATION (JWT validation)
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please log in', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // PARSE AND VALIDATE INPUT
    // ========================================================================
    const input: FeeCalculationInput = await req.json();

    const validationErrors = validateInput(input);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Validation failed: ${validationErrors.join(', ')}`,
          success: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      requestId,
      leaseId,
      monthlyRent,
      transactionType = 'date_change',
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
      userId: user.id,
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

      // Verify ownership
      if (existingRequest.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - you do not own this request', success: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// END EDGE FUNCTION
// ============================================================================
