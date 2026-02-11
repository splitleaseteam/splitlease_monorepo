/**
 * Queue Sync - Async messaging trigger
 * Split Lease
 *
 * Stub: triggerProposalMessaging is fire-and-forget (non-blocking).
 * The original implementation was removed. This stub logs the call
 * so create_mockup.ts can still deploy without breaking.
 */

interface ProposalMessagingPayload {
  proposalId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  proposalStatus: string;
}

export function triggerProposalMessaging(payload: ProposalMessagingPayload): void {
  console.log('[queueSync] triggerProposalMessaging called (stub):', JSON.stringify(payload));
}
