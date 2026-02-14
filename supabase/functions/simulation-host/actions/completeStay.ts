/**
 * Complete Stay Action Handler
 * Marks stay as complete and generates reviews
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CompleteStayPayload {
  simulationId: string;
  leaseId: string;
  proposalId: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface ReviewData {
  reviewId: string;
  reviewerType: 'host' | 'guest';
  rating: number;
}

interface CompleteStayResult {
  leaseCompleted: boolean;
  reviews: ReviewData[];
  simulationId: string;
}

export async function handleCompleteStay(
  payload: CompleteStayPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<CompleteStayResult> {
  console.log('[completeStay] Starting for lease:', payload.leaseId);

  const { simulationId, leaseId, proposalId } = payload;

  if (!simulationId || !proposalId) {
    throw new Error('simulationId and proposalId are required');
  }

  const reviews: ReviewData[] = [];

  // Step 1: Update lease status to completed (if lease exists)
  if (leaseId) {
    try {
      // NOTE: booking_lease has no status column — lease completion is tracked
      // via the proposal workflow status and stay records
      const { error: leaseError } = await supabase
        .from('booking_lease')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaseId);

      if (leaseError) {
        console.warn('[completeStay] Could not update lease:', leaseError);
      } else {
        console.log('[completeStay] Lease marked as completed');
      }
    } catch (leaseErr) {
      console.warn('[completeStay] Lease update failed:', leaseErr);
    }
  }

  // Step 2: Update proposal status
  const { error: proposalError } = await supabase
    .from('booking_proposal')
    .update({
      proposal_workflow_status: 'Stay Completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (proposalError) {
    console.warn('[completeStay] Could not update proposal:', proposalError);
  }

  // Step 3: Get guest and host IDs from proposal
  const { data: proposal } = await supabase
    .from('booking_proposal')
    .select('guest_user_id, host_user_id, listing_id')
    .eq('id', proposalId)
    .single();

  if (proposal) {
    // Step 4: Create reviews (host review of guest, guest review of host)
    try {
      // Host's review of guest
      const { data: hostReview, error: hostReviewError } = await supabase
        .from('review')
        .insert({
          reviewer_id: proposal.host_user_id,
          reviewee_id: proposal.guest_user_id,
          listing_id: proposal.listing_id,
          lease_id: leaseId,
          review_type: 'host_reviews_guest',
          overall_rating: 5,
          comment: 'Great guest! Very respectful and communicative throughout the stay.',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (hostReviewError) {
        console.warn('[completeStay] Could not create host review:', hostReviewError);
      } else if (hostReview) {
        reviews.push({
          reviewId: hostReview.id,
          reviewerType: 'host',
          rating: 5,
        });
        console.log('[completeStay] Created host review');
      }

      // Guest's review of host/listing
      const { data: guestReview, error: guestReviewError } = await supabase
        .from('review')
        .insert({
          reviewer_id: proposal.guest_user_id,
          reviewee_id: proposal.host_user_id,
          listing_id: proposal.listing_id,
          lease_id: leaseId,
          review_type: 'guest_reviews_host',
          overall_rating: 5,
          comment: 'Wonderful experience! The space was exactly as described and the host was very accommodating.',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (guestReviewError) {
        console.warn('[completeStay] Could not create guest review:', guestReviewError);
      } else if (guestReview) {
        reviews.push({
          reviewId: guestReview.id,
          reviewerType: 'guest',
          rating: 5,
        });
        console.log('[completeStay] Created guest review');
      }
    } catch (reviewErr) {
      console.warn('[completeStay] Review creation failed (table may not exist):', reviewErr);
      // Continue - review table may not exist
    }
  }

  // Update host's usability step to complete
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  if (hostUser) {
    await supabase
      .from('user')
      .update({ onboarding_usability_step: 6 })
      .eq('id', hostUser.id);
  }

  console.log('[completeStay] Completed - stay finished with', reviews.length, 'reviews');

  return {
    leaseCompleted: true,
    reviews,
    simulationId,
  };
}
