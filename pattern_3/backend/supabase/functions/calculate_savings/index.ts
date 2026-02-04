// =====================================================
// SUPABASE EDGE FUNCTION: calculate_savings
// =====================================================
// Pattern 3: Price Anchoring
// Calculates savings for any price vs anchor with formatting
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// =====================================================
// INTERFACES
// =====================================================

interface CalculateSavingsRequest {
  offer_price: number;
  anchor_price: number;
  format?: 'absolute' | 'percentage' | 'both';
  currency?: string;
}

interface SavingsResult {
  savings_amount: number;
  savings_percentage: number;
  formatted_amount: string;
  formatted_percentage: string;
  formatted_combined?: string;
  is_saving: boolean;
  saving_tier: 'none' | 'modest' | 'good' | 'massive';
  display_message: string;
}

interface CalculateSavingsResponse {
  success: boolean;
  data?: SavingsResult;
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
  parsed?: CalculateSavingsRequest;
} {
  if (!data) {
    return { valid: false, error: 'Request body is required' };
  }

  if (typeof data.offer_price !== 'number') {
    return { valid: false, error: 'offer_price must be a number' };
  }

  if (typeof data.anchor_price !== 'number' || data.anchor_price <= 0) {
    return { valid: false, error: 'anchor_price must be a positive number' };
  }

  const validFormats = ['absolute', 'percentage', 'both'];
  if (data.format && !validFormats.includes(data.format)) {
    return { valid: false, error: `format must be one of: ${validFormats.join(', ')}` };
  }

  return {
    valid: true,
    parsed: {
      offer_price: data.offer_price,
      anchor_price: data.anchor_price,
      format: data.format || 'both',
      currency: data.currency || 'USD',
    },
  };
}

// =====================================================
// SAVINGS CALCULATION
// =====================================================

function calculateSavings(offerPrice: number, anchorPrice: number): {
  amount: number;
  percentage: number;
} {
  const savingsAmount = anchorPrice - offerPrice;
  const savingsPercentage = anchorPrice > 0
    ? (savingsAmount / anchorPrice) * 100
    : 0;

  return {
    amount: Math.round(savingsAmount * 100) / 100,
    percentage: Math.round(savingsPercentage * 100) / 100,
  };
}

// =====================================================
// SAVINGS TIER CLASSIFICATION
// =====================================================

function getSavingsTier(savingsPercentage: number): 'none' | 'modest' | 'good' | 'massive' {
  if (savingsPercentage < 0) return 'none';
  if (savingsPercentage < 20) return 'modest';
  if (savingsPercentage < 50) return 'good';
  return 'massive';
}

// =====================================================
// FORMATTING
// =====================================================

function formatCurrency(amount: number, currency: string): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

function getDisplayMessage(
  savingsAmount: number,
  savingsPercentage: number,
  savingsTier: string
): string {
  if (savingsAmount <= 0) {
    return 'No savings - this costs more than the reference price';
  }

  const percentStr = formatPercentage(savingsPercentage);

  switch (savingsTier) {
    case 'massive':
      if (savingsPercentage >= 99) {
        return `Save ${formatCurrency(savingsAmount, 'USD')} - Basically free!`;
      }
      return `Save ${formatCurrency(savingsAmount, 'USD')} (${percentStr} off!) - Incredible value`;

    case 'good':
      return `Save ${formatCurrency(savingsAmount, 'USD')} (${percentStr} off) - Great deal`;

    case 'modest':
      return `Save ${formatCurrency(savingsAmount, 'USD')} (${percentStr} off)`;

    default:
      return `Reference price comparison`;
  }
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
        } as CalculateSavingsResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const params = validation.parsed!;

    // Calculate savings
    const savings = calculateSavings(params.offer_price, params.anchor_price);
    const savingsTier = getSavingsTier(savings.percentage);

    // Format results
    const formattedAmount = formatCurrency(savings.amount, params.currency);
    const formattedPercentage = formatPercentage(savings.percentage);
    const displayMessage = getDisplayMessage(
      savings.amount,
      savings.percentage,
      savingsTier
    );

    // Build formatted_combined based on format preference
    let formattedCombined: string | undefined;
    switch (params.format) {
      case 'absolute':
        formattedCombined = formattedAmount;
        break;
      case 'percentage':
        formattedCombined = formattedPercentage;
        break;
      case 'both':
        formattedCombined = `${formattedAmount} (${formattedPercentage} off)`;
        break;
    }

    // Build response
    const result: SavingsResult = {
      savings_amount: savings.amount,
      savings_percentage: savings.percentage,
      formatted_amount: formattedAmount,
      formatted_percentage: formattedPercentage,
      formatted_combined: formattedCombined,
      is_saving: savings.amount > 0,
      saving_tier: savingsTier,
      display_message: displayMessage,
    };

    const response: CalculateSavingsResponse = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate_savings:', error);

    const response: CalculateSavingsResponse = {
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

POST /functions/v1/calculate_savings

Example 1: Massive Savings
Request Body:
{
  "offer_price": 329,
  "anchor_price": 2835,
  "format": "both",
  "currency": "USD"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "savings_amount": 2506.00,
    "savings_percentage": 88.39,
    "formatted_amount": "$2,506.00",
    "formatted_percentage": "88%",
    "formatted_combined": "$2,506.00 (88% off)",
    "is_saving": true,
    "saving_tier": "massive",
    "display_message": "Save $2,506.00 (88% off!) - Incredible value"
  }
}

Example 2: Good Savings
Request Body:
{
  "offer_price": 1400,
  "anchor_price": 2835,
  "format": "absolute"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "savings_amount": 1435.00,
    "savings_percentage": 50.62,
    "formatted_amount": "$1,435.00",
    "formatted_percentage": "51%",
    "formatted_combined": "$1,435.00",
    "is_saving": true,
    "saving_tier": "good",
    "display_message": "Save $1,435.00 (51% off) - Great deal"
  }
}

Example 3: Modest Savings
Request Body:
{
  "offer_price": 2750,
  "anchor_price": 2835,
  "format": "percentage"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "savings_amount": 85.00,
    "savings_percentage": 3.00,
    "formatted_amount": "$85.00",
    "formatted_percentage": "3%",
    "formatted_combined": "3%",
    "is_saving": true,
    "saving_tier": "modest",
    "display_message": "Save $85.00 (3% off)"
  }
}

Example 4: No Savings (More Expensive)
Request Body:
{
  "offer_price": 3000,
  "anchor_price": 2835,
  "format": "both"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "savings_amount": -165.00,
    "savings_percentage": -5.82,
    "formatted_amount": "-$165.00",
    "formatted_percentage": "-6%",
    "formatted_combined": "-$165.00 (-6% off)",
    "is_saving": false,
    "saving_tier": "none",
    "display_message": "No savings - this costs more than the reference price"
  }
}

Example 5: Almost Free (99%+ savings)
Request Body:
{
  "offer_price": 5,
  "anchor_price": 2835,
  "format": "both"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "savings_amount": 2830.00,
    "savings_percentage": 99.82,
    "formatted_amount": "$2,830.00",
    "formatted_percentage": "100%",
    "formatted_combined": "$2,830.00 (100% off)",
    "is_saving": true,
    "saving_tier": "massive",
    "display_message": "Save $2,830.00 - Basically free!"
  }
}

Error Response (400 Bad Request):
{
  "success": false,
  "error": {
    "message": "anchor_price must be a positive number",
    "code": "INVALID_REQUEST"
  }
}

*/
