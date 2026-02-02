/**
 * Edge Function: User Archetype
 *
 * Returns user's behavioral archetype with confidence score and signals.
 * Supports:
 * - GET: Retrieve current archetype
 * - POST: Force recalculation (admin only)
 * - PUT: Manual override (admin only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  getUserArchetypeSignals,
  detectUserArchetype,
  getArchetypeLabel,
  getArchetypeDescription
} from '../_shared/archetype-detection.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Route based on method
    switch (req.method) {
      case 'GET':
        return await handleGet(req, supabaseClient);
      case 'POST':
        return await handleRecalculate(req, supabaseClient);
      case 'PUT':
        return await handleOverride(req, supabaseClient);
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('User archetype error:', error);

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
 * GET: Retrieve user archetype
 */
async function handleGet(req: Request, supabaseClient: any) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Check if archetype exists in cache
  const { data: cachedArchetype, error: cacheError } = await supabaseClient
    .from('user_archetypes')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If cached and recent (< 24 hours), return cached
  if (cachedArchetype && !cacheError) {
    const cacheAge = Date.now() - new Date(cachedArchetype.updated_at).getTime();
    const cacheAgeHours = cacheAge / (1000 * 60 * 60);

    if (cacheAgeHours < 24) {
      const nextUpdateIn = `${(24 - cacheAgeHours).toFixed(1)}h`;

      return new Response(
        JSON.stringify({
          userId: cachedArchetype.user_id,
          archetypeType: cachedArchetype.archetype_type,
          confidence: cachedArchetype.confidence,
          signals: cachedArchetype.signals,
          reasoning: cachedArchetype.reasoning || [],
          label: getArchetypeLabel(cachedArchetype.archetype_type),
          description: getArchetypeDescription(cachedArchetype.archetype_type),
          computedAt: cachedArchetype.updated_at,
          nextUpdateIn,
          cached: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Calculate fresh archetype
  const signals = await getUserArchetypeSignals(supabaseClient, userId);
  const archetype = detectUserArchetype(signals);
  archetype.userId = userId;

  // Cache the result
  await cacheArchetype(supabaseClient, archetype);

  return new Response(
    JSON.stringify({
      userId: archetype.userId,
      archetypeType: archetype.archetypeType,
      confidence: archetype.confidence,
      signals: archetype.signals,
      reasoning: archetype.reasoning,
      label: getArchetypeLabel(archetype.archetypeType),
      description: getArchetypeDescription(archetype.archetypeType),
      computedAt: new Date().toISOString(),
      nextUpdateIn: '24h',
      cached: false
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * POST: Force recalculation (admin only)
 */
async function handleRecalculate(req: Request, supabaseClient: any) {
  // Verify admin role
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const body = await req.json();
  const targetUserId = body.userId;

  if (!targetUserId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId in request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Recalculate archetype
  const signals = await getUserArchetypeSignals(supabaseClient, targetUserId);
  const archetype = detectUserArchetype(signals);
  archetype.userId = targetUserId;

  // Update cache
  await cacheArchetype(supabaseClient, archetype);

  // Log admin action
  await supabaseClient
    .from('admin_audit_log')
    .insert({
      admin_id: user.id,
      action: 'recalculate_archetype',
      target_user_id: targetUserId,
      metadata: {
        old_archetype: null,  // Could fetch old one if needed
        new_archetype: archetype.archetypeType,
        confidence: archetype.confidence
      },
      created_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({
      success: true,
      archetype: {
        userId: archetype.userId,
        archetypeType: archetype.archetypeType,
        confidence: archetype.confidence,
        reasoning: archetype.reasoning
      },
      message: 'Archetype recalculated successfully'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * PUT: Manual override (admin only)
 */
async function handleOverride(req: Request, supabaseClient: any) {
  // Verify admin role (same as recalculate)
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const body = await req.json();
  const { userId: targetUserId, archetypeType, reason } = body;

  if (!targetUserId || !archetypeType) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: userId, archetypeType' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Validate archetype type
  const validTypes = ['big_spender', 'high_flexibility', 'average_user'];
  if (!validTypes.includes(archetypeType)) {
    return new Response(
      JSON.stringify({
        error: 'Invalid archetypeType',
        validTypes
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Get current archetype for audit log
  const { data: currentArchetype } = await supabaseClient
    .from('user_archetypes')
    .select('archetype_type, confidence')
    .eq('user_id', targetUserId)
    .single();

  // Create override record
  await supabaseClient
    .from('user_archetypes')
    .upsert({
      user_id: targetUserId,
      archetype_type: archetypeType,
      confidence: 1.0,  // Manual override = 100% confidence
      is_manual_override: true,
      override_reason: reason || 'Admin override',
      override_by: user.id,
      updated_at: new Date().toISOString()
    });

  // Log admin action
  await supabaseClient
    .from('admin_audit_log')
    .insert({
      admin_id: user.id,
      action: 'override_archetype',
      target_user_id: targetUserId,
      metadata: {
        old_archetype: currentArchetype?.archetype_type,
        new_archetype: archetypeType,
        reason: reason || 'Admin override'
      },
      created_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Archetype overridden successfully',
      archetype: {
        userId: targetUserId,
        archetypeType,
        confidence: 1.0,
        isManualOverride: true
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Cache archetype in database
 */
async function cacheArchetype(supabaseClient: any, archetype: any): Promise<void> {
  try {
    await supabaseClient
      .from('user_archetypes')
      .upsert({
        user_id: archetype.userId,
        archetype_type: archetype.archetypeType,
        confidence: archetype.confidence,
        signals: archetype.signals,
        reasoning: archetype.reasoning,
        is_manual_override: false,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to cache archetype:', error);
    // Don't throw - caching failure shouldn't break the main flow
  }
}
