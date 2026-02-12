/**
 * Experience Survey Edge Function
 * Split Lease - Edge Functions
 *
 * Handles host experience survey submissions from the 11-step wizard.
 * - Validates required fields
 * - Saves survey to database
 * - Sends confirmation email to user
 * - Sends alert to admin for low NPS scores
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createErrorCollector } from "../_shared/slack.ts";
import { ValidationError, AuthenticationError } from "../_shared/errors.ts";
import { sendEmail, EMAIL_TEMPLATES, INTERNAL_BCC_EMAILS } from "../_shared/emailUtils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SurveyPayload {
  hostName: string | null;
  experienceDescription: string;
  priorChallenge: string | null;
  challengeImpact: string | null;
  whatChanged: string | null;
  whatStoodOut: string | null;
  additionalServiceNeeded: string | null;
  canSharePublicly: boolean;
  recommendationScore: number | null;
  staffToThank: string | null;
  additionalQuestions: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const collector = createErrorCollector("experience-survey", "submit");

  try {
    // Parse request
    const { action, payload } = await req.json();

    if (!action) {
      throw new ValidationError("Missing action parameter");
    }

    // Get auth token
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

    collector.setContext({ userId: user.id });

    switch (action) {
      case "submit":
        return await handleSubmit(supabase, user, payload as SurveyPayload, req, collector);

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

async function handleSubmit(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
  payload: SurveyPayload,
  req: Request,
  collector: ReturnType<typeof createErrorCollector>
): Promise<Response> {

  // 1. Validate required fields
  if (!payload.experienceDescription?.trim()) {
    throw new ValidationError("Experience description is required");
  }

  if (payload.recommendationScore !== null && (payload.recommendationScore < 1 || payload.recommendationScore > 10)) {
    throw new ValidationError("Recommendation score must be between 1 and 10");
  }

  // 2. Get client metadata
  const ipAddress = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || null;
  const userAgent = req.headers.get("user-agent") || null;

  // 3. Insert survey record
  const { data: survey, error: insertError } = await supabase
    .from("experience_survey")
    .insert({
      user_id: user.id,
      host_name: payload.hostName?.trim() || null,
      experience_description: payload.experienceDescription.trim(),
      prior_challenge: payload.priorChallenge?.trim() || null,
      challenge_impact: payload.challengeImpact?.trim() || null,
      what_changed: payload.whatChanged?.trim() || null,
      what_stood_out: payload.whatStoodOut?.trim() || null,
      additional_service_needed: payload.additionalServiceNeeded?.trim() || null,
      can_share_publicly: payload.canSharePublicly ?? false,
      recommendation_score: payload.recommendationScore || null,
      staff_to_thank: payload.staffToThank?.trim() || null,
      additional_questions: payload.additionalQuestions?.trim() || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "submitted"
    })
    .select()
    .single();

  if (insertError) {
    console.error("[experience-survey] Insert error:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    throw new Error(`Failed to save survey: ${insertError.message}`);
  }

  console.log("[experience-survey] Survey saved:", survey.id);

  // 4. Send confirmation email to user
  try {
    await sendEmail({
      templateId: EMAIL_TEMPLATES.BASIC_EMAIL,
      toEmail: user.email || "",
      toName: payload.hostName || user.email || "",
      subject: "Thank you for your feedback!",
      variables: {
        first_name: payload.hostName || "Host",
        body_intro: "Thank you for taking the time to share your experience with Split Lease. Your feedback helps us improve our service for all hosts.",
        button_text: "Visit Split Lease",
        button_url: "https://split.lease",
      },
      bccEmails: INTERNAL_BCC_EMAILS
    });
    console.log("[experience-survey] Confirmation email sent to:", user.email);
  } catch (emailError) {
    // Log but don't fail the request if email fails
    console.error("[experience-survey] Email error:", emailError);
    collector.add(emailError as Error, "send confirmation email");
  }

  // 5. Send notification to admin about new survey (especially if NPS is low)
  if (payload.recommendationScore && payload.recommendationScore <= 6) {
    try {
      await sendEmail({
        templateId: EMAIL_TEMPLATES.BASIC_EMAIL,
        toEmail: "team@splitlease.com",
        toName: "Split Lease Team",
        subject: `[Attention] Low NPS Score (${payload.recommendationScore}/10) - Host Feedback`,
        variables: {
          first_name: "Team",
          body_intro: `A host has submitted feedback with a low recommendation score.\n\nHost: ${payload.hostName || user.email}\nScore: ${payload.recommendationScore}/10\nExperience: ${payload.experienceDescription.substring(0, 200)}...\n\nPlease review and follow up as needed.`,
          button_text: "View Responses",
          button_url: "https://split.lease/_experience-responses",
        }
      });
      console.log("[experience-survey] Low NPS alert sent to team");
    } catch (emailError) {
      console.error("[experience-survey] Admin notification error:", emailError);
    }
  }

  // 6. Return success
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        surveyId: survey.id,
        message: "Survey submitted successfully"
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
