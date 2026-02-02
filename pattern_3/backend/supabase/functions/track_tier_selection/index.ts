// =====================================================
// SUPABASE EDGE FUNCTION: track_tier_selection
// =====================================================
// Pattern 3: Price Anchoring
// Tracks user tier selection and creates tier_selections record
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// =====================================================
// INTERFACES
// =====================================================

interface TrackTierSelectionRequest {
  booking_id: string;
  user_id: string;
  session_id: string;
  tier_id: string;
  base_price: number;
  anchor_price: number;
  anchor_type: 'buyout' | 'market_rate' | 'recommended' | 'custom';
  platform_fee?: number;
  transaction_type?: string;
  metadata?: Record<string, any>;
}

interface TierSelectionResponse {
  success: boolean;
  data?: {
    selection_id: string;
    tier_id: string;
    tier_name: string;
    final_price: number;
    total_cost: number;
    savings_amount: number;
    savings_percentage: number;
    transaction_status: string;
    created_at: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

// =====================================================
// VALIDATION
// =====================================================

function validateRequest(data: any): {
  valid: boolean;
  error?: string;
  parsed?: TrackTierSelectionRequest;
} {
  if (!data) {
    return { valid: false, error: 'Request body is required' };
  }

  // Required fields
  const requiredFields = [
    'booking_id',
    'user_id',
    'session_id',
    'tier_id',
    'base_price',
    'anchor_price',
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(data.booking_id)) {
    return { valid: false, error: 'Invalid booking_id format' };
  }
  if (!uuidRegex.test(data.user_id)) {
    return { valid: false, error: 'Invalid user_id format' };
  }

  // Validate tier_id
  const validTierIds = ['budget', 'recommended', 'premium', 'custom'];
  if (!validTierIds.includes(data.tier_id)) {
    return { valid: false, error: `tier_id must be one of: ${validTierIds.join(', ')}` };
  }

  // Validate prices
  if (typeof data.base_price !== 'number' || data.base_price < 0) {
    return { valid: false, error: 'base_price must be a non-negative number' };
  }
  if (typeof data.anchor_price !== 'number' || data.anchor_price < 0) {
    return { valid: false, error: 'anchor_price must be a non-negative number' };
  }

  // Validate anchor_type
  const validAnchorTypes = ['buyout', 'market_rate', 'recommended', 'custom'];
  const anchorType = data.anchor_type || 'buyout';
  if (!validAnchorTypes.includes(anchorType)) {
    return { valid: false, error: `anchor_type must be one of: ${validAnchorTypes.join(', ')}` };
  }

  return {
    valid: true,
    parsed: {
      booking_id: data.booking_id,
      user_id: data.user_id,
      session_id: data.session_id,
      tier_id: data.tier_id,
      base_price: data.base_price,
      anchor_price: data.anchor_price,
      anchor_type: anchorType,
      platform_fee: data.platform_fee || 0,
      transaction_type: data.transaction_type || 'date_change_request',
      metadata: data.metadata || {},
    },
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();

    // Validate request
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: validation.error,
            code: 'INVALID_REQUEST',
          },
        } as TierSelectionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const params = validation.parsed!;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tier information
    const { data: tierData, error: tierError } = await supabase
      .from('pricing_tiers')
      .select('tier_id, tier_name, multiplier')
      .eq('tier_id', params.tier_id)
      .eq('is_active', true)
      .single();

    if (tierError || !tierData) {
      throw new Error(`Invalid or inactive tier: ${params.tier_id}`);
    }

    // Calculate prices
    const finalPrice = Math.round(params.base_price * tierData.multiplier * 100) / 100;
    const totalCost = finalPrice + params.platform_fee;

    // Calculate savings
    const { data: savingsData, error: savingsError } = await supabase.rpc(
      'calculate_savings',
      {
        p_offer_price: totalCost,
        p_anchor_price: params.anchor_price,
      }
    );

    if (savingsError) {
      console.error('Error calculating savings:', savingsError);
      throw new Error('Failed to calculate savings');
    }

    const savingsAmount = savingsData?.[0]?.savings_amount || 0;
    const savingsPercentage = savingsData?.[0]?.savings_percentage || 0;

    // Create tier_selections record
    const { data: selectionData, error: selectionError } = await supabase
      .from('tier_selections')
      .insert({
        booking_id: params.booking_id,
        user_id: params.user_id,
        tier_id: params.tier_id,
        tier_name: tierData.tier_name,
        base_price: params.base_price,
        multiplier: tierData.multiplier,
        final_price: finalPrice,
        platform_fee: params.platform_fee,
        total_cost: totalCost,
        anchor_price: params.anchor_price,
        savings_vs_anchor: savingsAmount,
        savings_percentage: savingsPercentage,
        transaction_status: 'pending',
        metadata: {
          ...params.metadata,
          anchor_type: params.anchor_type,
          transaction_type: params.transaction_type,
          selected_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (selectionError) {
      console.error('Error creating tier selection:', selectionError);
      throw new Error(`Failed to create tier selection: ${selectionError.message}`);
    }

    // Track analytics event
    try {
      const { data: tiersShown } = await supabase.rpc('get_all_tier_prices', {
        p_base_price: params.base_price,
        p_anchor_price: params.anchor_price,
      });

      await supabase.rpc('track_tier_selection_event', {
        p_user_id: params.user_id,
        p_session_id: params.session_id,
        p_event_type: 'tier_selected',
        p_base_price: params.base_price,
        p_anchor_price: params.anchor_price,
        p_anchor_type: params.anchor_type,
        p_tiers_shown: JSON.stringify(tiersShown || []),
        p_selected_tier_id: params.tier_id,
        p_selected_price: totalCost,
        p_booking_id: params.booking_id,
        p_metadata: JSON.stringify({
          transaction_type: params.transaction_type,
          selection_id: selectionData.id,
        }),
      });
    } catch (trackError) {
      console.error('Error tracking analytics event:', trackError);
      // Don't fail the request if tracking fails
    }

    // Build response
    const response: TierSelectionResponse = {
      success: true,
      data: {
        selection_id: selectionData.id,
        tier_id: selectionData.tier_id,
        tier_name: selectionData.tier_name,
        final_price: selectionData.final_price,
        total_cost: selectionData.total_cost,
        savings_amount: selectionData.savings_vs_anchor,
        savings_percentage: selectionData.savings_percentage,
        transaction_status: selectionData.transaction_status,
        created_at: selectionData.created_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in track_tier_selection:', error);

    const response: TierSelectionResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// =====================================================
// EXAMPLE USAGE
// =====================================================
/*

POST /functions/v1/track_tier_selection

Request Body:
{
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987fcdeb-51a3-12d3-a456-426614174000",
  "session_id": "sess_abc123xyz",
  "tier_id": "recommended",
  "base_price": 450,
  "anchor_price": 2835,
  "anchor_type": "buyout",
  "platform_fee": 5,
  "transaction_type": "date_change_request",
  "metadata": {
    "user_archetype": "big_spender",
    "urgency": "medium",
    "original_dates": "2026-10-15 to 2026-10-20",
    "new_dates": "2026-10-20 to 2026-10-25"
  }
}

Response (200 OK):
{
  "success": true,
  "data": {
    "selection_id": "abc12345-6789-12d3-a456-426614174000",
    "tier_id": "recommended",
    "tier_name": "Recommended",
    "final_price": 450.00,
    "total_cost": 455.00,
    "savings_amount": 2380.00,
    "savings_percentage": 83.95,
    "transaction_status": "pending",
    "created_at": "2026-01-28T10:45:00.000Z"
  }
}

Error Response (400 Bad Request):
{
  "success": false,
  "error": {
    "message": "Invalid tier_id format",
    "code": "INVALID_REQUEST"
  }
}

Error Response (500 Internal Server Error):
{
  "success": false,
  "error": {
    "message": "Failed to create tier selection: duplicate key value",
    "code": "INTERNAL_ERROR"
  }
}

*/
