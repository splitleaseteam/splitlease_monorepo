/**
 * Send Message Handler - NATIVE SUPABASE
 * Split Lease - Messages Edge Function
 *
 * Creates messages directly in Supabase (NO BUBBLE).
 * The database trigger handles:
 * - Broadcasting to Realtime channel
 * - Updating thread's last message
 *
 * Optional: When send_welcome_messages=true and a new thread is created,
 * sends SplitBot welcome messages to both guest and host.
 *
 * NO FALLBACK PRINCIPLE: Throws if message creation fails
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { User as _User } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';
import {
  getUserBubbleId,
  getUserProfile,
  getListingName,
  createMessage,
  createThread,
  createSplitBotMessage,
  findExistingThread,
  updateThreadLastMessage,
} from '../../_shared/messagingHelpers.ts';
import {
  getCTAByName,
  renderTemplate,
  getVisibilityForRole,
  buildTemplateContext,
  getDefaultMessage,
} from '../../_shared/ctaHelpers.ts';

interface SendMessagePayload {
  thread_id?: string;
  message_body: string;
  recipient_user_id?: string;
  listing_id?: string;
  splitbot?: boolean;
  call_to_action?: string;
  split_bot_warning?: string;
  send_welcome_messages?: boolean;
}

interface SendMessageResult {
  success: boolean;
  message_id: string;
  thread_id: string;
  is_new_thread: boolean;
  timestamp: string;
  welcome_messages_sent?: boolean;
}

async function sendInquiryWelcomeMessages(
  supabase: SupabaseClient,
  threadId: string,
  guestId: string,
  hostId: string,
  listingId?: string
): Promise<void> {
  console.log('[sendMessage] Sending welcome messages for new inquiry thread');

  const [guestProfile, hostProfile, listingName] = await Promise.all([
    getUserProfile(supabase, guestId),
    getUserProfile(supabase, hostId),
    listingId ? getListingName(supabase, listingId) : Promise.resolve(null),
  ]);

  const templateContext = buildTemplateContext(
    hostProfile?.firstName,
    guestProfile?.firstName,
    listingName || undefined
  );

  // Guest gets "Create Proposal" CTA since this is a new inquiry without a proposal
  // Host gets "View Listing" CTA to see what listing the guest is inquiring about
  const [guestCTA, hostCTA] = await Promise.all([
    getCTAByName(supabase, 'create_proposal_guest'),
    getCTAByName(supabase, 'new_inquiry_host_view'),
  ]);

  // Send guest welcome message (with fallback for null CTA messages)
  if (guestCTA) {
    const guestVisibility = getVisibilityForRole('guest');
    const guestMessageBody = guestCTA.message
      ? renderTemplate(guestCTA.message, templateContext)
      : getDefaultMessage('inquiry', 'guest', templateContext);
    await createSplitBotMessage(supabase, {
      threadId,
      messageBody: guestMessageBody,
      callToAction: guestCTA.display,
      visibleToHost: guestVisibility.visibleToHost,
      visibleToGuest: guestVisibility.visibleToGuest,
      recipientUserId: guestId,
    });
    console.log('[sendMessage] Sent guest welcome message');
  }

  // Send host welcome message (with fallback for null CTA messages)
  if (hostCTA) {
    const hostVisibility = getVisibilityForRole('host');
    const hostMessageBody = hostCTA.message
      ? renderTemplate(hostCTA.message, templateContext)
      : getDefaultMessage('inquiry', 'host', templateContext);
    await createSplitBotMessage(supabase, {
      threadId,
      messageBody: hostMessageBody,
      callToAction: hostCTA.display,
      visibleToHost: hostVisibility.visibleToHost,
      visibleToGuest: hostVisibility.visibleToGuest,
      recipientUserId: hostId,
    });
    console.log('[sendMessage] Sent host welcome message');
  }

  // Update thread last message preview (use guest message or default)
  const lastMessagePreview = guestCTA?.message
    ? renderTemplate(guestCTA.message, templateContext)
    : getDefaultMessage('inquiry', 'guest', templateContext);
  await updateThreadLastMessage(supabase, threadId, lastMessagePreview);
}

export async function handleSendMessage(
  supabaseAdmin: SupabaseClient,
  payload: Record<string, unknown>,
  user: { id: string; email: string; bubbleId?: string }
): Promise<SendMessageResult> {
  console.log('[sendMessage] ========== SEND MESSAGE (NATIVE) ===========');
  console.log('[sendMessage] User ID:', user.id, 'Email:', user.email, 'BubbleId from metadata:', user.bubbleId);
  console.log('[sendMessage] RAW PAYLOAD:', JSON.stringify(payload, null, 2));

  const typedPayload = payload as unknown as SendMessagePayload;
  console.log('[sendMessage] TYPED PAYLOAD:', JSON.stringify(typedPayload, null, 2));

  try {
    validateRequiredFields(typedPayload, ['message_body']);
    console.log('[sendMessage] ✅ Required fields validation passed');
  } catch (e) {
    console.error('[sendMessage] ❌ Required fields validation FAILED:', e);
    throw e;
  }

  if (!typedPayload.message_body.trim()) {
    console.error('[sendMessage] ❌ Message body is empty after trim');
    throw new ValidationError('Message body cannot be empty');
  }
  console.log('[sendMessage] ✅ Message body validation passed:', typedPayload.message_body.substring(0, 50));

  // Determine user's Bubble ID (priority order):
  // 1. user.bubbleId from JWT user_metadata (set during signup)
  // 2. user.id if it looks like a Bubble ID (legacy auth)
  // 3. Lookup from public.user by email (fallback for migrated users)
  let senderBubbleId: string | null = null;

  // Priority 1: Use bubbleId from JWT user_metadata if available
  if (user.bubbleId) {
    senderBubbleId = user.bubbleId;
    console.log('[sendMessage] Using Bubble ID from JWT user_metadata:', senderBubbleId);
  }
  // Priority 2: Check if user.id looks like a Bubble ID (legacy auth)
  else if (/^\d+x\d+$/.test(user.id)) {
    senderBubbleId = user.id;
    console.log('[sendMessage] Using direct Bubble ID from legacy auth:', senderBubbleId);
  }
  // Priority 3: JWT auth without metadata - look up by email in public.user
  else {
    if (!user.email) {
      throw new ValidationError('Could not find user profile. Please try logging in again.');
    }
    senderBubbleId = await getUserBubbleId(supabaseAdmin, user.email);
    console.log('[sendMessage] Looked up Bubble ID from email:', senderBubbleId);
  }

  if (!senderBubbleId) {
    console.error('[sendMessage] ❌ Could not determine sender Bubble ID');
    throw new ValidationError('Could not find user profile. Please try logging in again.');
  }

  console.log('[sendMessage] ✅ Sender Bubble ID determined:', senderBubbleId);

  let threadId = typedPayload.thread_id;
  let isNewThread = false;
  let recipientId: string | undefined;

  console.log('[sendMessage] Thread ID from payload:', threadId);
  console.log('[sendMessage] Recipient user ID from payload:', typedPayload.recipient_user_id);
  console.log('[sendMessage] Listing ID from payload:', typedPayload.listing_id);

  if (!threadId) {
    if (!typedPayload.recipient_user_id) {
      console.error('[sendMessage] ❌ Missing thread_id and recipient_user_id');
      throw new ValidationError('Either thread_id or recipient_user_id is required');
    }

    recipientId = typedPayload.recipient_user_id;
    console.log('[sendMessage] 🔍 Looking for existing thread with recipient:', recipientId);

    // Validate recipient exists in user table before creating thread
    console.log('[sendMessage] 🔍 Validating recipient user exists:', recipientId);
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('user')
      .select('_id')
      .eq('_id', recipientId)
      .maybeSingle();

    console.log('[sendMessage] Recipient lookup result:', { recipient, error: recipientError });

    if (recipientError || !recipient) {
      console.error('[sendMessage] ❌ Recipient user not found:', recipientId, 'error:', recipientError?.message);
      throw new ValidationError('Recipient user not found. The listing host may no longer be active.');
    }
    console.log('[sendMessage] ✅ Recipient validation passed:', recipientId);

    // Validate listing exists if listing_id is provided
    if (typedPayload.listing_id) {
      console.log('[sendMessage] 🔍 Validating listing exists:', typedPayload.listing_id);
      const { data: listing, error: listingError } = await supabaseAdmin
        .from('listing')
        .select('_id')
        .eq('_id', typedPayload.listing_id)
        .maybeSingle();

      console.log('[sendMessage] Listing lookup result:', { listing, error: listingError });

      if (listingError || !listing) {
        console.error('[sendMessage] ❌ Listing not found:', typedPayload.listing_id, 'error:', listingError?.message);
        throw new ValidationError('Listing not found. It may have been removed.');
      }
      console.log('[sendMessage] ✅ Listing validation passed:', typedPayload.listing_id);
    }

    console.log('[sendMessage] 🔍 Step 1: Finding existing thread (recipient=host, sender=guest)...');
    threadId = await findExistingThread(
      supabaseAdmin,
      recipientId,
      senderBubbleId,
      typedPayload.listing_id
    );
    console.log('[sendMessage] Step 1 result: threadId =', threadId);

    if (!threadId) {
      console.log('[sendMessage] 🔍 Step 2: Finding existing thread (sender=host, recipient=guest)...');
      threadId = await findExistingThread(
        supabaseAdmin,
        senderBubbleId,
        recipientId,
        typedPayload.listing_id
      );
      console.log('[sendMessage] Step 2 result: threadId =', threadId);
    }

    if (!threadId) {
      console.log('[sendMessage] 🔨 Creating new thread...');
      console.log('[sendMessage] createThread params:', {
        hostUserId: recipientId,
        guestUserId: senderBubbleId,
        listingId: typedPayload.listing_id,
        createdBy: senderBubbleId,
      });
      try {
        threadId = await createThread(supabaseAdmin, {
          hostUserId: recipientId,
          guestUserId: senderBubbleId,
          listingId: typedPayload.listing_id,
          createdBy: senderBubbleId,
        });
        isNewThread = true;
        console.log('[sendMessage] ✅ Created new thread:', threadId);
      } catch (threadError) {
        // Log the full error for debugging
        console.error('[sendMessage] ❌ Thread creation FAILED');
        console.error('[sendMessage] Thread creation error:', threadError);
        console.error('[sendMessage] Thread creation error name:', threadError instanceof Error ? threadError.name : typeof threadError);
        console.error('[sendMessage] Thread creation error message:', threadError instanceof Error ? threadError.message : String(threadError));
        console.error('[sendMessage] Thread creation error stack:', threadError instanceof Error ? threadError.stack : 'No stack trace');

        // Check for FK constraint violations
        const errorMsg = threadError instanceof Error ? threadError.message : String(threadError);
        if (errorMsg.includes('foreign key') || errorMsg.includes('23503')) {
          throw new ValidationError('Unable to create conversation. There may be an issue with the listing or host account. Please contact support.');
        }

        // Re-throw with a more user-friendly message
        throw new ValidationError('Failed to create conversation. Please try again or contact support.');
      }
    } else {
      console.log('[sendMessage] ✅ Found existing thread:', threadId);
    }
  } else {
    console.log('[sendMessage] ✅ Using existing thread_id from payload:', threadId);
  }

  console.log('[sendMessage] Creating message in thread:', threadId);
  let messageId: string;
  try {
    const createParams = {
      threadId,
      messageBody: typedPayload.message_body.trim(),
      senderUserId: senderBubbleId,
      isSplitBot: typedPayload.splitbot || false,
      callToAction: typedPayload.call_to_action,
      splitBotWarning: typedPayload.split_bot_warning,
    };
    console.log('[sendMessage] 📝 createMessage params:', JSON.stringify(createParams, null, 2));

    messageId = await createMessage(supabaseAdmin, createParams);

    console.log('[sendMessage] ✅ Message created:', messageId);
  } catch (messageError) {
    console.error('[sendMessage] ❌ Message creation FAILED');
    console.error('[sendMessage] Error details:', messageError);
    console.error('[sendMessage] Error name:', messageError instanceof Error ? messageError.name : typeof messageError);
    console.error('[sendMessage] Error message:', messageError instanceof Error ? messageError.message : String(messageError));
    console.error('[sendMessage] Error stack:', messageError instanceof Error ? messageError.stack : 'No stack trace');

    const errorMsg = messageError instanceof Error ? messageError.message : String(messageError);
    if (errorMsg.includes('foreign key') || errorMsg.includes('23503')) {
      throw new ValidationError('Unable to send message. The conversation may have been deleted.');
    }
    throw new ValidationError('Failed to send message. Please try again.');
  }

  let welcomeMessagesSent = false;
  if (isNewThread && typedPayload.send_welcome_messages && recipientId) {
    try {
      await sendInquiryWelcomeMessages(
        supabaseAdmin,
        threadId,
        senderBubbleId,
        recipientId,
        typedPayload.listing_id
      );
      welcomeMessagesSent = true;
    } catch (welcomeError) {
      console.warn('[sendMessage] Welcome messages failed (non-blocking):', welcomeError);
    }
  }

  console.log('[sendMessage] ========== SEND COMPLETE (NATIVE) ===========');

  return {
    success: true,
    message_id: messageId,
    thread_id: threadId,
    is_new_thread: isNewThread,
    timestamp: new Date().toISOString(),
    welcome_messages_sent: welcomeMessagesSent,
  };
}
