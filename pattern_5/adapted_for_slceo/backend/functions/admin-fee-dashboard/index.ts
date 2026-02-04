// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - ADMIN FEE DASHBOARD (ADAPTED)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Fetch analytics data using the views created in migrations
        const [summary, timeSeries] = await Promise.all([
            supabaseClient.from('admin_fee_revenue_summary').select('*').limit(30),
            supabaseClient.rpc('get_fee_revenue_timeseries', { p_interval: 'day' })
        ]);

        return new Response(JSON.stringify({
            success: true,
            data: {
                summary: summary.data,
                timeSeries: timeSeries.data,
            }
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
