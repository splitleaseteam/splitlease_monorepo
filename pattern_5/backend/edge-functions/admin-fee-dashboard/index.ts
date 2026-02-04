// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - ADMIN FEE DASHBOARD API
// ============================================================================
// Edge Function: Admin analytics and revenue reporting for fee transparency
// Version: 1.0
// Date: 2026-01-28
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DashboardRequest {
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  groupBy?: 'day' | 'week' | 'month';
}

interface RevenueMetrics {
  totalTransactions: number;
  totalRevenue: number;
  totalPlatformFees: number;
  totalLandlordShare: number;
  averageTransactionValue: number;
  averageFeePerTransaction: number;
  effectiveFeeRate: number;
}

interface TransactionBreakdown {
  transactionType: string;
  count: number;
  totalRevenue: number;
  platformFees: number;
  landlordShare: number;
  averageFee: number;
}

interface TimeSeriesData {
  date: string;
  transactionCount: number;
  revenue: number;
  platformFees: number;
  landlordShare: number;
}

interface DashboardResponse {
  success: boolean;
  data?: {
    summary: RevenueMetrics;
    byTransactionType: TransactionBreakdown[];
    timeSeries: TimeSeriesData[];
    topRequests: any[];
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify user has admin role
 */
async function verifyAdminAccess(supabaseClient: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('user')
    .select('role')
    .eq('auth_id', userId)
    .single();

  if (error) {
    throw new Error('Failed to verify user role');
  }

  return data?.role === 'admin';
}

/**
 * Calculate summary metrics
 */
async function calculateSummaryMetrics(
  supabaseClient: any,
  startDate?: string,
  endDate?: string
): Promise<RevenueMetrics> {
  let query = supabaseClient
    .from('datechangerequest')
    .select('base_price, total_price, fee_breakdown, payment_status')
    .eq('payment_status', 'paid')
    .not('fee_breakdown', 'is', null);

  if (startDate) {
    query = query.gte('payment_processed_at', startDate);
  }
  if (endDate) {
    query = query.lte('payment_processed_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalLandlordShare: 0,
      averageTransactionValue: 0,
      averageFeePerTransaction: 0,
      effectiveFeeRate: 0,
    };
  }

  const totalTransactions = data.length;
  const totalRevenue = data.reduce((sum, row) => sum + (row.base_price || 0), 0);
  const totalPlatformFees = data.reduce(
    (sum, row) => sum + (parseFloat(row.fee_breakdown?.platform_fee) || 0),
    0
  );
  const totalLandlordShare = data.reduce(
    (sum, row) => sum + (parseFloat(row.fee_breakdown?.landlord_share) || 0),
    0
  );

  return {
    totalTransactions,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalPlatformFees: Number(totalPlatformFees.toFixed(2)),
    totalLandlordShare: Number(totalLandlordShare.toFixed(2)),
    averageTransactionValue: Number((totalRevenue / totalTransactions).toFixed(2)),
    averageFeePerTransaction: Number((totalPlatformFees / totalTransactions).toFixed(2)),
    effectiveFeeRate: Number(((totalPlatformFees / totalRevenue) * 100).toFixed(2)),
  };
}

/**
 * Get breakdown by transaction type
 */
async function getTransactionTypeBreakdown(
  supabaseClient: any,
  startDate?: string,
  endDate?: string
): Promise<TransactionBreakdown[]> {
  let query = supabaseClient
    .from('datechangerequest')
    .select('transaction_type, base_price, fee_breakdown')
    .eq('payment_status', 'paid')
    .not('fee_breakdown', 'is', null);

  if (startDate) {
    query = query.gte('payment_processed_at', startDate);
  }
  if (endDate) {
    query = query.lte('payment_processed_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch breakdown: ${error.message}`);
  }

  // Group by transaction type
  const grouped = data.reduce((acc: any, row: any) => {
    const type = row.transaction_type || 'date_change';
    if (!acc[type]) {
      acc[type] = {
        transactionType: type,
        count: 0,
        totalRevenue: 0,
        platformFees: 0,
        landlordShare: 0,
      };
    }

    acc[type].count++;
    acc[type].totalRevenue += row.base_price || 0;
    acc[type].platformFees += parseFloat(row.fee_breakdown?.platform_fee) || 0;
    acc[type].landlordShare += parseFloat(row.fee_breakdown?.landlord_share) || 0;

    return acc;
  }, {});

  // Convert to array and calculate averages
  return Object.values(grouped).map((item: any) => ({
    ...item,
    totalRevenue: Number(item.totalRevenue.toFixed(2)),
    platformFees: Number(item.platformFees.toFixed(2)),
    landlordShare: Number(item.landlordShare.toFixed(2)),
    averageFee: Number((item.platformFees / item.count).toFixed(2)),
  }));
}

/**
 * Get time series data
 */
async function getTimeSeriesData(
  supabaseClient: any,
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesData[]> {
  const { data, error } = await supabaseClient.rpc('get_fee_revenue_timeseries', {
    p_start_date: startDate || '2020-01-01',
    p_end_date: endDate || new Date().toISOString(),
    p_interval: groupBy,
  });

  if (error) {
    console.error('Failed to fetch time series (falling back to basic query):', error);

    // Fallback to basic query if RPC not available
    let query = supabaseClient
      .from('datechangerequest_fee_analytics')
      .select('created_at, base_price, platform_fee, landlord_share')
      .eq('payment_status', 'paid');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: fallbackData, error: fallbackError } = await query;

    if (fallbackError) {
      throw new Error(`Failed to fetch time series: ${fallbackError.message}`);
    }

    // Group by date manually
    const grouped = fallbackData.reduce((acc: any, row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          transactionCount: 0,
          revenue: 0,
          platformFees: 0,
          landlordShare: 0,
        };
      }

      acc[date].transactionCount++;
      acc[date].revenue += row.base_price || 0;
      acc[date].platformFees += row.platform_fee || 0;
      acc[date].landlordShare += row.landlord_share || 0;

      return acc;
    }, {});

    return Object.values(grouped);
  }

  return data || [];
}

/**
 * Get top requests by fee amount
 */
async function getTopRequests(
  supabaseClient: any,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .select(`
      id,
      created_at,
      transaction_type,
      base_price,
      total_price,
      fee_breakdown,
      payment_status,
      user:user_id (
        full_name,
        email
      )
    `)
    .eq('payment_status', 'paid')
    .not('fee_breakdown', 'is', null)
    .order('total_price', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch top requests: ${error.message}`);
  }

  return data || [];
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
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

    // Verify admin access
    const isAdmin = await verifyAdminAccess(supabaseClient, user.id);
    if (!isAdmin) {
      throw new Error('Forbidden - admin access required');
    }

    // ========================================================================
    // PARSE REQUEST
    // ========================================================================
    const url = new URL(req.url);
    const params: DashboardRequest = {
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      transactionType: url.searchParams.get('transactionType') || undefined,
      groupBy: (url.searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day',
    };

    console.log('Dashboard request:', params);

    // ========================================================================
    // FETCH DASHBOARD DATA
    // ========================================================================
    const [summary, byTransactionType, timeSeries, topRequests] = await Promise.all([
      calculateSummaryMetrics(supabaseClient, params.startDate, params.endDate),
      getTransactionTypeBreakdown(supabaseClient, params.startDate, params.endDate),
      getTimeSeriesData(supabaseClient, params.startDate, params.endDate, params.groupBy),
      getTopRequests(supabaseClient, 10),
    ]);

    // ========================================================================
    // RETURN DASHBOARD DATA
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          summary,
          byTransactionType,
          timeSeries,
          topRequests,
        },
      } as DashboardResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error in admin-fee-dashboard:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        success: false,
      } as DashboardResponse),
      {
        status: error.message.includes('Forbidden') ? 403 :
               error.message.includes('Unauthorized') ? 401 : 400,
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
