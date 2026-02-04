// =====================================================
// SUPABASE EDGE FUNCTION: get_pricing_tiers
// =====================================================
// Pattern 3: Price Anchoring
// Returns pricing tiers with calculated prices and savings
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// =====================================================
// INTERFACES
// =====================================================

interface GetPricingTiersRequest {
  base_price: number;
  anchor_price?: number;
  anchor_type?: 'buyout' | 'market_rate' | 'recommended' | 'custom';
  user_archetype?: 'big_spender' | 'high_flexibility' | 'average_user';
  urgency?: 'low' | 'medium' | 'high';
  booking_id?: string;
  session_id: string;
  user_id?: string;
}

interface PricingTier {
  tier_id: string;
  tier_name: string;
  multiplier: number;
  calculated_price: number;
  display_order: number;
  badge_text: string | null;
  description: string;
  acceptance_rate: number;
  avg_response_time_hours: number;
  is_recommended: boolean;
  features: Feature[];
  savings_amount: number;
  savings_percentage: number;
}

interface Feature {
  text: string;
  icon: string;
  order: number;
}

interface RecommendedTier {
  tier_id: string;
  tier_name: string;
  multiplier: number;
  reason: string;
}

interface PricingResponse {
  success: boolean;
  data?: {
    tiers: PricingTier[];
    anchor: {
      price: number;
      type: string;
      description: string;
    };
    recommended_tier: RecommendedTier;
    metadata: {
      base_price: number;
      total_tiers: number;
      generated_at: string;
    };
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
  parsed?: GetPricingTiersRequest;
} {
  if (!data) {
    return { valid: false, error: 'Request body is required' };
  }

  if (typeof data.base_price !== 'number' || data.base_price <= 0) {
    return { valid: false, error: 'base_price must be a positive number' };
  }

  if (data.anchor_price !== undefined &&
      (typeof data.anchor_price !== 'number' || data.anchor_price < 0)) {
    return { valid: false, error: 'anchor_price must be a non-negative number' };
  }

  if (!data.session_id || typeof data.session_id !== 'string') {
    return { valid: false, error: 'session_id is required' };
  }

  const validAnchorTypes = ['buyout', 'market_rate', 'recommended', 'custom'];
  if (data.anchor_type && !validAnchorTypes.includes(data.anchor_type)) {
    return { valid: false, error: `anchor_type must be one of: ${validAnchorTypes.join(', ')}` };
  }

  const validArchetypes = ['big_spender', 'high_flexibility', 'average_user'];
  if (data.user_archetype && !validArchetypes.includes(data.user_archetype)) {
    return { valid: false, error: `user_archetype must be one of: ${validArchetypes.join(', ')}` };
  }

  const validUrgency = ['low', 'medium', 'high'];
  if (data.urgency && !validUrgency.includes(data.urgency)) {
    return { valid: false, error: `urgency must be one of: ${validUrgency.join(', ')}` };
  }

  return {
    valid: true,
    parsed: {
      base_price: data.base_price,
      anchor_price: data.anchor_price || data.base_price,
      anchor_type: data.anchor_type || 'buyout',
      user_archetype: data.user_archetype || 'average_user',
      urgency: data.urgency || 'medium',
      booking_id: data.booking_id,
      session_id: data.session_id,
      user_id: data.user_id,
    },
  };
}

// =====================================================
// ANCHOR DESCRIPTION
// =====================================================

function getAnchorDescription(anchorType: string): string {
  const descriptions: Record<string, string> = {
    buyout: 'Exclusive buyout rate - your reference price',
    market_rate: 'Current market rate for similar options',
    recommended: 'Recommended fair market price',
    custom: 'Your specified reference price',
  };

  return descriptions[anchorType] || 'Reference price';
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
        } as PricingResponse),
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

    // Get all tier prices with features
    const { data: tiers, error: tiersError } = await supabase.rpc(
      'get_all_tier_prices',
      {
        p_base_price: params.base_price,
        p_anchor_price: params.anchor_price,
      }
    );

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError);
      throw new Error(`Failed to fetch pricing tiers: ${tiersError.message}`);
    }

    if (!tiers || tiers.length === 0) {
      throw new Error('No active pricing tiers found');
    }

    // Get recommended tier based on user context
    const { data: recommendedTierData, error: recommendedError } = await supabase.rpc(
      'get_recommended_tier',
      {
        p_user_archetype: params.user_archetype,
        p_urgency: params.urgency,
      }
    );

    if (recommendedError) {
      console.error('Error fetching recommended tier:', recommendedError);
    }

    const recommendedTier: RecommendedTier = recommendedTierData?.[0] || {
      tier_id: 'recommended',
      tier_name: 'Recommended',
      multiplier: 1.0,
      reason: 'Default recommendation',
    };

    // Track analytics event
    try {
      await supabase.rpc('track_tier_selection_event', {
        p_user_id: params.user_id || null,
        p_session_id: params.session_id,
        p_event_type: 'tiers_viewed',
        p_base_price: params.base_price,
        p_anchor_price: params.anchor_price,
        p_anchor_type: params.anchor_type,
        p_tiers_shown: JSON.stringify(tiers),
        p_booking_id: params.booking_id || null,
        p_metadata: JSON.stringify({
          user_archetype: params.user_archetype,
          urgency: params.urgency,
          recommended_tier: recommendedTier.tier_id,
        }),
      });
    } catch (trackError) {
      console.error('Error tracking event:', trackError);
      // Don't fail the request if tracking fails
    }

    // Build response
    const response: PricingResponse = {
      success: true,
      data: {
        tiers: tiers.map((tier: any) => ({
          tier_id: tier.tier_id,
          tier_name: tier.tier_name,
          multiplier: tier.multiplier,
          calculated_price: tier.calculated_price,
          display_order: tier.display_order,
          badge_text: tier.badge_text,
          description: tier.description,
          acceptance_rate: tier.acceptance_rate,
          avg_response_time_hours: tier.avg_response_time_hours,
          is_recommended: tier.is_recommended,
          features: tier.features || [],
          savings_amount: tier.savings_amount,
          savings_percentage: tier.savings_percentage,
        })),
        anchor: {
          price: params.anchor_price!,
          type: params.anchor_type!,
          description: getAnchorDescription(params.anchor_type!),
        },
        recommended_tier: recommendedTier,
        metadata: {
          base_price: params.base_price,
          total_tiers: tiers.length,
          generated_at: new Date().toISOString(),
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_pricing_tiers:', error);

    const response: PricingResponse = {
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

POST /functions/v1/get_pricing_tiers

Request Body:
{
  "base_price": 450,
  "anchor_price": 2835,
  "anchor_type": "buyout",
  "user_archetype": "big_spender",
  "urgency": "medium",
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "session_id": "sess_abc123",
  "user_id": "user_xyz789"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "tiers": [
      {
        "tier_id": "premium",
        "tier_name": "Premium",
        "multiplier": 1.15,
        "calculated_price": 517.50,
        "display_order": 1,
        "badge_text": "Fastest",
        "description": "Priority handling",
        "acceptance_rate": 0.89,
        "avg_response_time_hours": 4,
        "is_recommended": false,
        "features": [
          { "text": "Highest acceptance rate", "icon": "trophy", "order": 1 },
          { "text": "Same-day response typical", "icon": "bolt", "order": 2 },
          { "text": "VIP processing", "icon": "crown", "order": 3 }
        ],
        "savings_amount": 2317.50,
        "savings_percentage": 81.75
      },
      {
        "tier_id": "recommended",
        "tier_name": "Recommended",
        "multiplier": 1.00,
        "calculated_price": 450.00,
        "display_order": 2,
        "badge_text": "Most Popular",
        "description": "Best value",
        "acceptance_rate": 0.73,
        "avg_response_time_hours": 12,
        "is_recommended": true,
        "features": [
          { "text": "Fair market rate", "icon": "star", "order": 1 },
          { "text": "Faster acceptance", "icon": "zap", "order": 2 },
          { "text": "Preferred by 73% of users", "icon": "users", "order": 3 }
        ],
        "savings_amount": 2385.00,
        "savings_percentage": 84.13
      },
      {
        "tier_id": "budget",
        "tier_name": "Budget",
        "multiplier": 0.90,
        "calculated_price": 405.00,
        "display_order": 3,
        "badge_text": null,
        "description": "Basic offer",
        "acceptance_rate": 0.45,
        "avg_response_time_hours": 48,
        "is_recommended": false,
        "features": [
          { "text": "Standard processing", "icon": "check", "order": 1 },
          { "text": "May take longer to accept", "icon": "clock", "order": 2 },
          { "text": "Lower priority", "icon": "info", "order": 3 }
        ],
        "savings_amount": 2430.00,
        "savings_percentage": 85.72
      }
    ],
    "anchor": {
      "price": 2835,
      "type": "buyout",
      "description": "Exclusive buyout rate - your reference price"
    },
    "recommended_tier": {
      "tier_id": "premium",
      "tier_name": "Premium",
      "multiplier": 1.15,
      "reason": "Recommended based on your profile and urgency"
    },
    "metadata": {
      "base_price": 450,
      "total_tiers": 3,
      "generated_at": "2026-01-28T10:30:00.000Z"
    }
  }
}

*/
