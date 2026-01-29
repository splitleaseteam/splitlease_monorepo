/**
 * Send SplitBot Message Handler
 * Split Lease - Messages Edge Function
 *
 * Sends an automated SplitBot message with a CTA to an existing thread.
 * This is the reusable unit for sending automated messages in various contexts.
 *
 * Mirrors Bubble workflow: CORE-send-new-message (in app only) - SplitBot path
 *
 * Use cases:
 * - Status change notifications
 * - Reminder messages
 * - System notifications
 * - CTA-driven user guidance
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import {
  createSplitBotMessage,
  updateThreadLastMessage,
  getThread,
  getUserProfile,
  getListingName,
} from '../../_shared/messagingHelpers.ts';
import {
  getCTAByName,
  renderTemplate,
  buildTemplateContext,
  getVisibilityForRole,
  TemplateContext,
} from '../../_shared/ctaHelpers.ts';

// ============================================
// TYPES
// ============================================

export interface SendSplitBotMessagePayload {
  threadId?: string; // Either threadId OR proposalId required
  proposalId?: string; // Alternative: look up thread by proposal ID
  ctaName: string; // CTA name from os_messaging_cta.name
  recipientRole: 'guest' | 'host' | 'both';
  // Optional: override the CTA template message
  customMessageBody?: string;
  // Optional: warning message for SplitBot
  splitBotWarning?: string;
  // Optional: template context (if not provided, will be fetched from thread)
  hostName?: string;
  guestName?: string;
  listingName?: string;
}

export interface SendSplitBotMessageResponse {
  messageIds: string[];
  threadId: string;
}

// ============================================
// VALIDATION
// ============================================

function validatePayload(payload: Record<string, unknown>): SendSplitBotMessagePayload {
  const { threadId, proposalId, ctaName, recipientRole } = payload;

  // Either threadId OR proposalId is required
  if ((!threadId || typeof threadId !== 'string') && (!proposalId || typeof proposalId !== 'string')) {
    throw new ValidationError('Either threadId or proposalId is required');
  }
  if (!ctaName || typeof ctaName !== 'string') {
    throw new ValidationError('ctaName is required');
  }
  if (!recipientRole || !['guest', 'host', 'both'].includes(recipientRole as string)) {
    throw new ValidationError('recipientRole must be "guest", "host", or "both"');
  }

  return {
    threadId: threadId as string | undefined,
    proposalId: proposalId as string | undefined,
    ctaName,
    recipientRole: recipientRole as 'guest' | 'host' | 'both',
    customMessageBody: payload.customMessageBody as string | undefined,
    splitBotWarning: payload.splitBotWarning as string | undefined,
    hostName: payload.hostName as string | undefined,
    guestName: payload.guestName as string | undefined,
    listingName: payload.listingName as string | undefined,
  };
}

// ============================================
// HANDLER
// ============================================

/**
 * Handle send_splitbot_message action
 *
 * Sends automated message(s) to specified recipient(s) in a thread
 */
export async function handleSendSplitBotMessage(
  supabase: SupabaseClient,
  payload: Record<string, unknown>
): Promise<SendSplitBotMessageResponse> {
  console.log('[sendSplitBotMessage] Starting...');

  // Validate input
  const input = validatePayload(payload);
  console.log('[sendSplitBotMessage] Validated input:', {
    threadId: input.threadId,
    proposalId: input.proposalId,
    ctaName: input.ctaName,
    recipientRole: input.recipientRole,
  });

  // ─────────────────────────────────────────────────────────
  // Step 1: Resolve thread ID (from threadId or proposalId)
  // ─────────────────────────────────────────────────────────

  let resolvedThreadId = input.threadId;

  // If no threadId provided, look up by proposalId
  if (!resolvedThreadId && input.proposalId) {
    console.log('[sendSplitBotMessage] Looking up thread by proposalId:', input.proposalId);
    const { data: threadLookup, error: lookupError } = await supabase
      .from('thread')
      .select('_id')
      .eq('"Proposal"', input.proposalId)
      .maybeSingle();

    if (lookupError) {
      console.error('[sendSplitBotMessage] Thread lookup error:', lookupError);
      throw new ValidationError(`Failed to look up thread for proposal: ${input.proposalId}`);
    }

    if (!threadLookup) {
      console.warn('[sendSplitBotMessage] No thread found for proposal:', input.proposalId);
      throw new ValidationError(`No thread found for proposal: ${input.proposalId}`);
    }

    resolvedThreadId = threadLookup._id;
    console.log('[sendSplitBotMessage] Found thread by proposal:', resolvedThreadId);
  }

  // ─────────────────────────────────────────────────────────
  // Step 2: Get thread info
  // ─────────────────────────────────────────────────────────

  const thread = await getThread(supabase, resolvedThreadId!);
  if (!thread) {
    throw new ValidationError(`Thread not found: ${resolvedThreadId}`);
  }

  console.log('[sendSplitBotMessage] Thread found:', {
    hostUser: thread.hostUser,
    guestUser: thread.guestUser,
    listing: thread.listing,
  });

  // ─────────────────────────────────────────────────────────
  // Step 3: Get CTA from reference table
  // ─────────────────────────────────────────────────────────

  const cta = await getCTAByName(supabase, input.ctaName);
  if (!cta) {
    throw new ValidationError(`CTA not found: ${input.ctaName}`);
  }

  console.log('[sendSplitBotMessage] CTA found:', cta.display);

  // ─────────────────────────────────────────────────────────
  // Step 4: Build template context
  // ─────────────────────────────────────────────────────────

  let templateContext: TemplateContext;

  if (input.hostName && input.guestName && input.listingName) {
    // Use provided context
    templateContext = buildTemplateContext(input.hostName, input.guestName, input.listingName);
  } else {
    // Fetch context from database
    const [hostProfile, guestProfile, listingName] = await Promise.all([
      getUserProfile(supabase, thread.hostUser),
      getUserProfile(supabase, thread.guestUser),
      thread.listing ? getListingName(supabase, thread.listing) : Promise.resolve(null),
    ]);

    templateContext = buildTemplateContext(
      input.hostName || hostProfile?.firstName,
      input.guestName || guestProfile?.firstName,
      input.listingName || listingName || undefined
    );
  }

  // ─────────────────────────────────────────────────────────
  // Step 5: Render message body
  // ─────────────────────────────────────────────────────────

  const messageBody = input.customMessageBody ||
    renderTemplate(cta.message || '', templateContext) ||
    `Update for ${templateContext.listingName}`;

  console.log('[sendSplitBotMessage] Message body:', messageBody.substring(0, 50) + '...');

  // ─────────────────────────────────────────────────────────
  // Step 6: Create message(s) based on recipientRole
  // ─────────────────────────────────────────────────────────

  const messageIds: string[] = [];

  if (input.recipientRole === 'guest' || input.recipientRole === 'both') {
    const guestVisibility = getVisibilityForRole('guest');

    const guestMessageId = await createSplitBotMessage(supabase, {
      threadId: resolvedThreadId!,
      messageBody,
      callToAction: cta.display,
      visibleToHost: guestVisibility.visibleToHost,
      visibleToGuest: guestVisibility.visibleToGuest,
      splitBotWarning: input.splitBotWarning,
      recipientUserId: thread.guestUser,
    });

    messageIds.push(guestMessageId);
    console.log('[sendSplitBotMessage] Created guest message:', guestMessageId);
  }

  if (input.recipientRole === 'host' || input.recipientRole === 'both') {
    const hostVisibility = getVisibilityForRole('host');

    const hostMessageId = await createSplitBotMessage(supabase, {
      threadId: resolvedThreadId!,
      messageBody,
      callToAction: cta.display,
      visibleToHost: hostVisibility.visibleToHost,
      visibleToGuest: hostVisibility.visibleToGuest,
      splitBotWarning: input.splitBotWarning,
      recipientUserId: thread.hostUser,
    });

    messageIds.push(hostMessageId);
    console.log('[sendSplitBotMessage] Created host message:', hostMessageId);
  }

  // ─────────────────────────────────────────────────────────
  // Step 7: Update thread's last message (non-blocking)
  // ─────────────────────────────────────────────────────────

  await updateThreadLastMessage(supabase, resolvedThreadId!, messageBody);

  // ─────────────────────────────────────────────────────────
  // Return response
  // ─────────────────────────────────────────────────────────

  console.log('[sendSplitBotMessage] Complete, created', messageIds.length, 'message(s)');

  return {
    messageIds,
    threadId: resolvedThreadId!,
  };
}
