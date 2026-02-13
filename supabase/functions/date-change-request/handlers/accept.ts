/**
 * Accept Date Change Request Handler
 * Split Lease - Supabase Edge Functions
 *
 * Accepts a date change request and updates the lease dates.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError, AuthenticationError as _AuthenticationError } from "../../_shared/errors.ts";
import {
  AcceptRequestInput,
  AcceptRequestResponse,
  UserContext,
  DateChangeRequestData,
} from "../lib/types.ts";
import { validateAcceptInput } from "../lib/validators.ts";
import { sendDateChangeRequestNotifications } from "./notifications.ts";

/**
 * Handle accept date change request
 *
 * Steps:
 * 1. Validate input
 * 2. Fetch the request
 * 3. Verify user is the receiver
 * 4. Verify request is still pending
 * 5. Update request status
 * 6. Update lease booked dates (if applicable)
 * 7. Return response
 */
export async function handleAccept(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<AcceptRequestResponse> {
  console.log(`[date-change-request:accept] Starting accept for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as AcceptRequestInput;
  validateAcceptInput(input);

  console.log(`[date-change-request:accept] Accepting request: ${input.requestId}`);

  // ================================================
  // FETCH REQUEST
  // ================================================

  const { data: request, error: requestError } = await supabase
    .from('datechangerequest')
    .select('*')
    .eq('id', input.requestId)
    .single();

  if (requestError || !request) {
    console.error(`[date-change-request:accept] Request fetch failed:`, requestError);
    throw new ValidationError(`Request not found: ${input.requestId}`);
  }

  const requestData = request as unknown as DateChangeRequestData;
  console.log(`[date-change-request:accept] Found request, status: ${requestData.request_status}`);

  // ================================================
  // VERIFY STATUS
  // ================================================

  if (requestData.request_status !== 'waiting_for_answer') {
    throw new ValidationError(`Request is not pending. Current status: ${requestData.request_status}`);
  }

  // Check expiration
  if (requestData.expiration_date) {
    const expirationDate = new Date(requestData.expiration_date);
    if (expirationDate < new Date()) {
      throw new ValidationError('Request has expired');
    }
  }

  // ================================================
  // UPDATE REQUEST STATUS
  // ================================================

  const now = new Date().toISOString();

  const updateData = {
    request_status: 'Approved',
    answer_date: now,
    answer_to_request: input.message || null,
    original_updated_at: now,
    pending: false,
  };

  const { error: updateError } = await supabase
    .from('datechangerequest')
    .update(updateData)
    .eq('id', input.requestId);

  if (updateError) {
    console.error(`[date-change-request:accept] Update failed:`, updateError);
    throw new SupabaseSyncError(`Failed to accept request: ${updateError.message}`);
  }

  console.log(`[date-change-request:accept] Request status updated to Approved`);

  // ================================================
  // SEND NOTIFICATIONS (non-blocking)
  // ================================================

  try {
    await sendDateChangeRequestNotifications(supabase, {
      event: 'ACCEPTED',
      requestId: input.requestId,
      requestType: requestData.type_of_request,
      leaseId: requestData.lease || '',
      dateAdded: requestData.date_added,
      dateRemoved: requestData.date_removed,
      priceRate: requestData.price_rate_of_the_night,
      requestedById: requestData.requested_by || '',
      receiverId: requestData.request_receiver || '',
      message: requestData.message_from_requested_by,
      answerMessage: input.message || null,
    });
  } catch (notificationError) {
    console.error(`[date-change-request:accept] Notification error (non-blocking):`, notificationError);
  }

  // ================================================
  // UPDATE LEASE BOOKED DATES
  // ================================================

  if (requestData.lease) {
    try {
      // Fetch current lease data
      const { data: lease, error: leaseError } = await supabase
        .from('booking_lease')
        .select(`booked_dates_json`)
        .eq('id', requestData.lease)
        .single();

      if (!leaseError && lease) {
        let bookedDates: string[] = lease.booked_dates_json || [];

        // Modify dates based on request type
        const requestType = requestData.type_of_request;
        const dateToAdd = requestData.date_added;
        const dateToRemove = requestData.date_removed;

        if (requestType === 'adding' && dateToAdd) {
          // Add the new date
          if (!bookedDates.includes(dateToAdd)) {
            bookedDates = [...bookedDates, dateToAdd];
          }
          console.log(`[date-change-request:accept] Added date: ${dateToAdd}`);
        }

        if (requestType === 'removing' && dateToRemove) {
          // Remove the date
          bookedDates = bookedDates.filter(d => d !== dateToRemove);
          console.log(`[date-change-request:accept] Removed date: ${dateToRemove}`);
        }

        if (requestType === 'swapping') {
          // Remove old date, add new date
          if (dateToRemove) {
            bookedDates = bookedDates.filter(d => d !== dateToRemove);
          }
          if (dateToAdd && !bookedDates.includes(dateToAdd)) {
            bookedDates = [...bookedDates, dateToAdd];
          }
          console.log(`[date-change-request:accept] Swapped: ${dateToRemove} -> ${dateToAdd}`);
        }

        // Update lease with new booked dates
        const { error: leaseUpdateError } = await supabase
          .from('booking_lease')
          .update({
            booked_dates_json: bookedDates,
            updated_at: now,
          })
          .eq('id', requestData.lease);

        if (leaseUpdateError) {
          console.error(`[date-change-request:accept] Lease update failed (non-blocking):`, leaseUpdateError);
        } else {
          console.log(`[date-change-request:accept] Lease dates updated`);
        }
      }
    } catch (leaseErr) {
      // Non-blocking - log but continue
      console.error(`[date-change-request:accept] Lease update error (non-blocking):`, leaseErr);
    }
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[date-change-request:accept] Complete`);

  return {
    requestId: input.requestId,
    status: 'Approved',
    answeredAt: now,
  };
}
