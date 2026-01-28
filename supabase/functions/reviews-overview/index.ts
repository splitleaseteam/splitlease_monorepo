/**
 * Reviews Overview Edge Function
 * Split Lease - Edge Functions
 *
 * Handles all review-related operations for the Reviews Overview page:
 * - get_pending_reviews: Stays awaiting user's review
 * - get_received_reviews: Reviews written about the user
 * - get_submitted_reviews: Reviews the user has written
 * - create_review: Submit a new review
 * - get_review_details: View full review details
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createErrorCollector } from "../_shared/slack.ts";
import { ValidationError, AuthenticationError } from "../_shared/errors.ts";

import { handleGetPendingReviews } from "./handlers/getPendingReviews.ts";
import { handleGetReceivedReviews } from "./handlers/getReceivedReviews.ts";
import { handleGetSubmittedReviews } from "./handlers/getSubmittedReviews.ts";
import { handleCreateReview } from "./handlers/createReview.ts";
import { handleGetReviewDetails } from "./handlers/getReviewDetails.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const collector = createErrorCollector("reviews-overview", "request");

  try {
    // Parse request
    const { action, payload } = await req.json();

    if (!action) {
      throw new ValidationError("Missing action parameter");
    }

    // Auth required for all actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AuthenticationError("Missing authorization header");
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError("Invalid or expired token");
    }

    collector.setContext({ userId: user.id, action });
    console.log(`[reviews-overview] Action: ${action}, User: ${user.id}`);

    // Route to appropriate handler
    switch (action) {
      case "get_pending_reviews":
        return await handleGetPendingReviews(supabase, user, payload || {});

      case "get_received_reviews":
        return await handleGetReceivedReviews(supabase, user, payload || {});

      case "get_submitted_reviews":
        return await handleGetSubmittedReviews(supabase, user, payload || {});

      case "create_review":
        return await handleCreateReview(supabase, user, payload, collector);

      case "get_review_details":
        return await handleGetReviewDetails(supabase, user, payload);

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

  } catch (error) {
    collector.add(error as Error, "request processing");
    collector.reportToSlack();

    const statusCode = error instanceof ValidationError ? 400
                     : error instanceof AuthenticationError ? 401
                     : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        code: (error as { code?: string }).code || "UNKNOWN_ERROR"
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
