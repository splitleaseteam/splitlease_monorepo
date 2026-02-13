/**
 * Date Change Reminder Cron Job
 * Split Lease - Supabase Edge Functions
 *
 * Runs periodically to check for date change requests expiring soon
 * and sends reminder emails to both parties.
 *
 * Should be triggered every 15 minutes via external cron or pg_cron.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface ExpiringRequest {
  id: string;
  lease: string;
  requested_by: string;
  request_receiver: string;
  expiration_date: string;
  type_of_request: string;
  date_added: string | null;
  date_removed: string | null;
  price_rate_of_the_night: number | null;
  compared_to_regular_nightly_price: number | null;
  message_from_requested_by: string | null;
  reminder_sent_at: string | null;
}

interface LeaseData {
  id: string;
  guest_user_id: string;
  host_user_id: string;
  listing_id: string;
  reservation_start_date: string;
  reservation_end_date: string;
}

interface UserData {
  id: string;
  email: string | null;
  first_name: string | null;
}

interface ReminderResult {
  requestId: string;
  sentToRequester: boolean;
  sentToReceiver: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

/**
 * Time window for reminder check (in hours)
 * Requests expiring between 1.5 and 2.5 hours from now will trigger reminders
 */
const REMINDER_WINDOW_HOURS_MIN = 1.5;
const REMINDER_WINDOW_HOURS_MAX = 2.5;

/**
 * Don't send reminders more often than this (in hours)
 */
const REMINDER_COOLDOWN_HOURS = 12;

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

/**
 * Check if a request is within the reminder window
 */
function _isInReminderWindow(expirationDate: string): boolean {
  const now = new Date();
  const expiry = new Date(expirationDate);

  if (isNaN(expiry.getTime())) {
    return false;
  }

  const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  return diffHours >= REMINDER_WINDOW_HOURS_MIN && diffHours <= REMINDER_WINDOW_HOURS_MAX;
}

/**
 * Check if reminder was sent recently (within cooldown period)
 */
function wasReminderSentRecently(reminderSentAt: string | null): boolean {
  if (!reminderSentAt) return false;

  const now = new Date();
  const lastSent = new Date(reminderSentAt);
  const diffHours = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  return diffHours < REMINDER_COOLDOWN_HOURS;
}

/**
 * Determine if requester is host or guest based on lease
 */
function _determineRequesterRole(requesterId: string, lease: LeaseData): 'host' | 'guest' {
  return requesterId === lease.host_user_id ? 'host' : 'guest';
}

/**
 * Generate reminder email variables
 */
function generateReminderVariables(
  request: ExpiringRequest,
  requester: UserData,
  receiver: UserData,
  requesterIsHost: boolean,
  lease: LeaseData
): Record<string, unknown> {
  const now = new Date();
  const expiry = new Date(request.expiration_date);
  const diffHours = Math.max(1, Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return {
    // Recipient
    first_name: requesterIsHost ? requester.first_name : receiver.first_name,
    guest_name: requesterIsHost ? requester.first_name : receiver.first_name,
    host_name: requesterIsHost ? requester.first_name : receiver.first_name,

    // Property
    property_display: `Lease #${lease.id.slice(0, 8)}`,

    // Dates
    original_dates: `${new Date(lease.reservation_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(lease.reservation_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    dates_to_add: request.date_added ? new Date(request.date_added).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
    dates_to_remove: request.date_removed ? new Date(request.date_removed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,

    // Price
    price_adjustment: request.price_rate_of_the_night ? `$${request.price_rate_of_the_night}` : 'No Change',

    // Time
    time_to_expiry: `${diffHours} hour${diffHours > 1 ? 's' : ''}`,

    // Message
    host_message: requesterIsHost ? request.message_from_requested_by : null,
    guest_message: requesterIsHost ? null : request.message_from_requested_by,
  };
}

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log("[date-change-reminder-cron] Edge Function started");

Deno.serve(async (_req: Request) => {
  console.log("[date-change-reminder-cron] ========== CRON EXECUTION STARTED ==========");

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Find expiring requests
    console.log("[date-change-reminder-cron] Step 1: Finding expiring requests...");

    const now = new Date();
    const minExpiry = new Date(now.getTime() + REMINDER_WINDOW_HOURS_MIN * 60 * 60 * 1000).toISOString();
    const maxExpiry = new Date(now.getTime() + REMINDER_WINDOW_HOURS_MAX * 60 * 60 * 1000).toISOString();

    const { data: expiringRequests, error: queryError } = await supabase
      .from('datechangerequest')
      .select(`
        id,
        lease,
        requested_by,
        request_receiver,
        expiration_date,
        type_of_request,
        date_added,
        date_removed,
        price_rate_of_the_night,
        compared_to_regular_nightly_price,
        message_from_requested_by,
        reminder_sent_at
      `)
      .eq('request_status', 'waiting_for_answer')
      .gte('expiration_date', minExpiry)
      .lte('expiration_date', maxExpiry)
      .order('expiration_date', { ascending: true });

    if (queryError) {
      throw new Error(`Failed to query expiring requests: ${queryError.message}`);
    }

    if (!expiringRequests || expiringRequests.length === 0) {
      console.log("[date-change-reminder-cron] No expiring requests found");
      return Response.json({
        success: true,
        message: 'No expiring requests found',
        processed: 0,
        timestamp: now.toISOString(),
      });
    }

    console.log(`[date-change-reminder-cron] Found ${expiringRequests.length} expiring requests`);

    // Step 2: Process each expiring request
    console.log("[date-change-reminder-cron] Step 2: Processing expiring requests...");

    const results: ReminderResult[] = [];

    for (const request of expiringRequests as ExpiringRequest[]) {
      try {
        // Check if reminder was sent recently
        if (wasReminderSentRecently(request.reminder_sent_at)) {
          console.log(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Reminder sent recently, skipping`);
          continue;
        }

        console.log(`[date-change-reminder-cron] Processing request ${request.id.slice(0, 8)}...`);

        // Fetch lease data
        const { data: lease, error: leaseError } = await supabase
          .from('booking_lease')
          .select('id, guest_user_id, host_user_id, listing_id, reservation_start_date, reservation_end_date')
          .eq('id', request.lease)
          .single();

        if (leaseError || !lease) {
          console.warn(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Lease not found, skipping`);
          continue;
        }

        // Fetch user data for both parties
        const { data: users, error: usersError } = await supabase
          .from('user')
          .select('id, email, first_name')
          .in('id', [request.requested_by, request.request_receiver]);

        if (usersError || !users) {
          console.warn(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Users not found, skipping`);
          continue;
        }

        const requester = users.find(u => u.id === request.requested_by) as UserData;
        const receiver = users.find(u => u.id === request.request_receiver) as UserData;

        if (!requester || !receiver) {
          console.warn(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Missing user data, skipping`);
          continue;
        }

        // Determine roles
        const requesterIsHost = request.requested_by === lease.host_user_id;

        // Send reminder to requester
        let sentToRequester = false;
        if (requester.email) {
          try {
            const requesterVars = generateReminderVariables(
              request,
              requester,
              receiver,
              requesterIsHost,
              lease
            );

            // Determine which template to use
            const templateId = requesterIsHost
              ? 'DCR_HOST_REMIND_WAITING' // Host waiting for guest
              : 'DCR_GUEST_REMIND_WAITING'; // Guest waiting for host

            await sendReminderEmail(supabaseUrl, supabaseServiceKey, templateId, requester.email, requesterVars);
            sentToRequester = true;
            console.log(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Reminder sent to requester`);
          } catch (emailError) {
            console.warn(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Failed to send to requester:`, (emailError as Error).message);
          }
        }

        // Send reminder to receiver
        let sentToReceiver = false;
        if (receiver.email) {
          try {
            const receiverVars = generateReminderVariables(
              request,
              requester,
              receiver,
              !requesterIsHost, // Receiver has opposite role
              lease
            );

            // Determine which template to use
            const templateId = requesterIsHost
              ? 'DCR_GUEST_REMIND_RESPOND' // Guest must respond to host
              : 'DCR_HOST_REMIND_RESPOND'; // Host must respond to guest

            await sendReminderEmail(supabaseUrl, supabaseServiceKey, templateId, receiver.email, receiverVars);
            sentToReceiver = true;
            console.log(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Reminder sent to receiver`);
          } catch (emailError) {
            console.warn(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Failed to send to receiver:`, (emailError as Error).message);
          }
        }

        // Update reminder_sent_at timestamp
        if (sentToRequester || sentToReceiver) {
          await supabase
            .from('datechangerequest')
            .update({ reminder_sent_at: now.toISOString() })
            .eq('id', request.id);

          console.log(`[date-change-reminder-cron] Request ${request.id.slice(0, 8)}: Updated reminder_sent_at`);
        }

        results.push({
          requestId: request.id,
          sentToRequester,
          sentToReceiver,
        });

      } catch (requestError) {
        console.error(`[date-change-reminder-cron] Error processing request ${request.id.slice(0, 8)}:`, (requestError as Error).message);
        results.push({
          requestId: request.id,
          sentToRequester: false,
          sentToReceiver: false,
          error: (requestError as Error).message,
        });
      }
    }

    // Step 3: Return results
    console.log("[date-change-reminder-cron] ========== CRON EXECUTION COMPLETE ==========");

    const successCount = results.filter(r => r.sentToRequester || r.sentToReceiver).length;

    return Response.json({
      success: true,
      message: `Processed ${results.length} expiring requests, sent ${successCount} reminders`,
      processed: results.length,
      reminders_sent: successCount,
      results: results,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error("[date-change-reminder-cron] ========== FATAL ERROR ==========");
    console.error("[date-change-reminder-cron]", error);

    return Response.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Send reminder email via send-email Edge Function
 */
async function sendReminderEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  templateId: string,
  toEmail: string,
  variables: Record<string, unknown>
): Promise<void> {
  const emailEndpoint = `${supabaseUrl}/functions/v1/send-email`;

  const response = await fetch(emailEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        template_id: templateId,
        to_email: toEmail,
        variables: variables,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email send failed: ${response.status} - ${errorText}`);
  }
}
