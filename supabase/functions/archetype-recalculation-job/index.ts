/**
 * Background Job: Archetype Recalculation
 *
 * Scheduled job that recalculates user archetypes for all active users.
 * Runs daily to keep archetypes fresh based on latest behavior.
 *
 * Triggered by:
 * - Daily cron job (Supabase pg_cron)
 * - Manual trigger via admin API
 * - After significant user activity (10+ transactions)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  getBehaviorArchetypeSignals,
  detectBehaviorArchetype
} from '../_shared/archetype-detection.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface JobConfig {
  batchSize: number;
  maxConcurrent: number;
  onlyStaleUsers: boolean;  // Only recalculate users with old archetypes
  staleThresholdHours: number;
}

const DEFAULT_CONFIG: JobConfig = {
  batchSize: 100,
  maxConcurrent: 10,
  onlyStaleUsers: true,
  staleThresholdHours: 24
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify service role or admin
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!authHeader || !authHeader.includes(serviceKey!)) {
    // Check if it's an admin user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader! }
        }
      }
    );

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

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin or service role required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }

  try {
    // Parse config from request body (if provided)
    let config = DEFAULT_CONFIG;
    if (req.method === 'POST') {
      const body = await req.json();
      config = { ...DEFAULT_CONFIG, ...body.config };
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();

    console.log('[Archetype Recalculation] Job started', {
      config,
      timestamp: new Date().toISOString()
    });

    // Get users to process
    const usersToProcess = await getUsersToProcess(supabaseClient, config);

    console.log(`[Archetype Recalculation] Found ${usersToProcess.length} users to process`);

    // Process in batches
    const results = await processBatches(supabaseClient, usersToProcess, config);

    const duration = Date.now() - startTime;

    // Log job completion
    await logJobCompletion(supabaseClient, results, duration);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.processed,
        updated: results.updated,
        failed: results.failed,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorDetails = {
      code: (error as { code?: string })?.code || 'UNKNOWN',
      message: error instanceof Error ? error.message : String(error),
      details: (error as { details?: string })?.details,
      hint: (error as { hint?: string })?.hint,
    };
    console.error('[Archetype Recalculation] Job failed:', errorDetails);

    return new Response(
      JSON.stringify({
        error: 'Job failed',
        message: errorDetails.message,
        code: errorDetails.code,
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
 * Get users that need archetype recalculation
 */
async function getUsersToProcess(
  supabaseClient: any,
  config: JobConfig
): Promise<string[]> {

  if (config.onlyStaleUsers) {
    // Get users with stale archetypes (not updated in last N hours)
    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - config.staleThresholdHours);

    const { data: staleUsers, error } = await supabaseClient
      .from('user_archetypes')
      .select('user_id')
      .lt('updated_at', staleThreshold.toISOString())
      .eq('is_manual_override', false)  // Don't recalculate manual overrides
      .limit(config.batchSize * 10);  // Get more than we need

    if (error) {
      console.error('[Archetype Recalculation] Failed to fetch stale users:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to fetch stale users: ${error.message}`);
    }

    const staleUserIds = staleUsers?.map(u => u.user_id) || [];

    // Also get users with recent activity but no archetype yet
    const { data: newUsers, error: newError } = await supabaseClient
      .from('date_change_requests')
      .select('requester_id')
      .gte('created_at', staleThreshold.toISOString())
      .limit(config.batchSize);

    if (!newError && newUsers) {
      const newUserIds = [...new Set(newUsers.map(u => u.requester_id))];

      // Filter out users who already have archetypes
      for (const userId of newUserIds) {
        const { data: existing } = await supabaseClient
          .from('user_archetypes')
          .select('user_id')
          .eq('user_id', userId)
          .single();

        if (!existing) {
          staleUserIds.push(userId);
        }
      }
    }

    return [...new Set(staleUserIds)];

  } else {
    // Get all active users
    const { data: allUsers, error } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('status', 'active')
      .limit(config.batchSize * 10);

    if (error) {
      console.error('[Archetype Recalculation] Failed to fetch all users:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to fetch all users: ${error.message}`);
    }

    return allUsers?.map(u => u.id) || [];
  }
}

/**
 * Process users in batches
 */
async function processBatches(
  supabaseClient: any,
  userIds: string[],
  config: JobConfig
): Promise<{ processed: number; updated: number; failed: number }> {

  let processed = 0;
  let updated = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < userIds.length; i += config.batchSize) {
    const batch = userIds.slice(i, i + config.batchSize);

    console.log(`[Archetype Recalculation] Processing batch ${i / config.batchSize + 1}`);

    // Process batch with concurrency limit
    const batchResults = await Promise.allSettled(
      batch.map(userId => processUser(supabaseClient, userId))
    );

    // Count results
    batchResults.forEach((result, index) => {
      const userId = batch[index];
      processed++;
      if (result.status === 'fulfilled') {
        if (result.value) {
          updated++;
        }
      } else {
        failed++;
        const reason = result.reason;
        console.error(`[Archetype Recalculation] Batch ${Math.floor(i / config.batchSize) + 1}, user ${userId} failed:`, {
          message: reason instanceof Error ? reason.message : String(reason),
          code: (reason as { code?: string })?.code,
        });
      }
    });

    // Rate limiting: wait a bit between batches
    if (i + config.batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { processed, updated, failed };
}

/**
 * Process individual user
 */
async function processUser(
  supabaseClient: any,
  userId: string
): Promise<boolean> {

  try {
    // Get archetype signals
    const signals = await getBehaviorArchetypeSignals(supabaseClient, userId);

    // Detect archetype
    const newArchetype = detectBehaviorArchetype(signals);
    newArchetype.userId = userId;

    // Get existing archetype
    const { data: existing } = await supabaseClient
      .from('user_archetypes')
      .select('archetype_type, confidence')
      .eq('user_id', userId)
      .single();

    // Check if archetype changed significantly
    const archetypeChanged = !existing ||
      existing.archetype_type !== newArchetype.archetypeType ||
      Math.abs(existing.confidence - newArchetype.confidence) > 0.1;

    if (!archetypeChanged) {
      // Just update timestamp
      await supabaseClient
        .from('user_archetypes')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      return false;  // Not a significant update
    }

    // Upsert new archetype
    const { error } = await supabaseClient
      .from('user_archetypes')
      .upsert({
        user_id: userId,
        archetype_type: newArchetype.archetypeType,
        confidence: newArchetype.confidence,
        signals: newArchetype.signals,
        reasoning: newArchetype.reasoning,
        is_manual_override: false,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    // Log archetype change if it changed
    if (existing) {
      console.log(`[Archetype Recalculation] User ${userId} archetype changed: ${existing.archetype_type} -> ${newArchetype.archetypeType}`);
    }

    return true;  // Successfully updated

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    console.error(`[Archetype Recalculation] Failed to process user ${userId}:`, {
      code: errorCode,
      message: errorMsg,
    });
    throw new Error(`Failed for user ${userId}: ${errorMsg}`);
  }
}

/**
 * Log job completion to database
 */
async function logJobCompletion(
  supabaseClient: any,
  results: { processed: number; updated: number; failed: number },
  durationMs: number
): Promise<void> {

  try {
    await supabaseClient
      .from('archetype_job_logs')
      .insert({
        job_type: 'recalculation',
        processed_count: results.processed,
        updated_count: results.updated,
        failed_count: results.failed,
        duration_ms: durationMs,
        completed_at: new Date().toISOString()
      });
  } catch (error) {
    // Don't throw - logging failure shouldn't break the job
    // But log with full details for debugging
    console.warn('[Archetype Recalculation] Failed to log job completion:', {
      code: (error as { code?: string })?.code,
      message: error instanceof Error ? error.message : String(error),
      results,
      durationMs,
    });
  }
}
