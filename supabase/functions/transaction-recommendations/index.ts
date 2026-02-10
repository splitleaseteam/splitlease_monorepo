/**
 * Edge Function: Transaction Recommendations
 *
 * Provides personalized transaction type recommendations (buyout, crash, swap)
 * based on user archetype, urgency, and historical behavior.
 *
 * Pattern: Personalized Defaults (Pattern 1)
 * Impact: +204% revenue per transaction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  detectBehaviorArchetype,
  getBehaviorArchetypeSignals
} from '../_shared/archetype-detection.ts';
import {
  selectPersonalizedDefault,
  buildTransactionOptions
} from '../_shared/default-selection-engine.ts';
import { calculateUrgency } from '../_shared/urgency-calculator.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestParams {
  userId: string;
  targetDate: string;
  roommateId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const targetDate = url.searchParams.get('targetDate');
    const roommateId = url.searchParams.get('roommateId');

    // Validate required parameters
    if (!userId || !targetDate || !roommateId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          required: ['userId', 'targetDate', 'roommateId']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Fetch user archetype signals
    const archetypeSignals = await getBehaviorArchetypeSignals(supabaseClient, userId);

    // Detect user archetype
    const userArchetype = detectBehaviorArchetype(archetypeSignals);

    // Fetch roommate archetype
    const roommateSignals = await getBehaviorArchetypeSignals(supabaseClient, roommateId);
    const roommateArchetype = detectBehaviorArchetype(roommateSignals);

    // Get target night pricing data
    const { data: targetNightData, error: targetNightError } = await supabaseClient
      .from('lease_nights')
      .select('base_price, market_demand, day_of_week')
      .eq('date', targetDate)
      .single();

    if (targetNightError) {
      throw new Error(`Failed to fetch target night data: ${targetNightError.message}`);
    }

    // Calculate urgency
    const urgency = calculateUrgency({
      checkInDate: new Date(targetDate),
      currentDate: new Date()
    });

    // Get user history
    const { data: userHistory, error: historyError } = await supabaseClient
      .from('datechangerequest')
      .select('transaction_type, status, created_at')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Failed to fetch user history:', historyError);
    }

    // Build transaction context
    const context = {
      requestingUser: userArchetype,
      targetNight: {
        date: new Date(targetDate),
        basePrice: targetNightData?.base_price || 150,
        dayOfWeek: targetNightData?.day_of_week || new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' }),
        marketDemand: targetNightData?.market_demand || 1.0
      },
      daysUntilCheckIn: urgency.daysUntil,
      roommate: {
        id: roommateId,
        archetype: roommateArchetype,
        acceptanceRate: roommateSignals.acceptanceRate,
        avgResponseTimeHours: roommateSignals.avgResponseTimeHours
      },
      userHistory: {
        previousTransactions: userHistory?.length || 0,
        lastTransactionType: userHistory?.[0]?.transaction_type || null,
        lastTransactionSuccess: userHistory?.[0]?.status === 'accepted'
      }
    };

    // Select personalized default
    const recommendation = selectPersonalizedDefault(context);

    // Build full transaction options with pricing
    const options = buildTransactionOptions(context, recommendation.sortedOptions);

    // Prepare response
    const response = {
      primaryRecommendation: recommendation.primaryOption,
      options: options,
      userArchetype: {
        type: userArchetype.archetypeType,
        confidence: userArchetype.confidence
      },
      contextFactors: {
        daysUntilCheckIn: urgency.daysUntil,
        isWeekday: !['Saturday', 'Sunday'].includes(context.targetNight.dayOfWeek),
        marketDemand: context.targetNight.marketDemand,
        roommateArchetype: roommateArchetype.archetypeType,
        urgencyLevel: urgency.level
      },
      metadata: {
        computedAt: new Date().toISOString(),
        confidence: recommendation.confidence,
        version: '1.0.0'
      }
    };

    // Log recommendation for analytics
    await logRecommendation(supabaseClient, userId, response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Transaction recommendations error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Log recommendation for analytics and A/B testing
 */
async function logRecommendation(
  supabaseClient: any,
  userId: string,
  recommendation: any
): Promise<void> {
  try {
    await supabaseClient
      .from('recommendation_logs')
      .insert({
        user_id: userId,
        primary_recommendation: recommendation.primaryRecommendation,
        archetype_type: recommendation.userArchetype.type,
        archetype_confidence: recommendation.userArchetype.confidence,
        days_until_checkin: recommendation.contextFactors.daysUntilCheckIn,
        urgency_level: recommendation.contextFactors.urgencyLevel,
        options: recommendation.options,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log recommendation:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}
