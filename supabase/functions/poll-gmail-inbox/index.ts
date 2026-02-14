/**
 * Poll Gmail Inbox Edge Function
 * Split Lease - Edge Function
 *
 * Replaces legacy Python script that polled Gmail to forward messages between paired users.
 *
 * BUSINESS LOGIC (Thread-ID Based Routing):
 * 1. Connect to Gmail via service account
 * 2. Fetch UNREAD messages
 * 3. Extract thread_id from To: header (tech+<thread_id>@leaseplit.com)
 * 4. Look up specific thread by thread_id in public.threads
 * 5. Extract sender email from From header
 * 6. Find sender's user ID in public.user
 * 7. Identify recipient as the OTHER participant in the thread (host ↔ guest)
 * 8. Check recipient's notification_preferences (message_forwarding_email/sms booleans)
 * 9. If enabled, call sendNotification from _shared/notificationSender.ts
 * 10. Mark message as READ in Gmail
 *
 * SECURITY:
 * - Requires GMAIL_CLIENT_EMAIL and GMAIL_PRIVATE_KEY secrets
 * - Service role authentication required
 *
 * DESIGN PRINCIPLES:
 * - Privacy-first: Only forward if recipient explicitly opted in (boolean preferences)
 * - Fire-and-forget: Errors logged but don't stop processing other messages
 * - Idempotent: Safe to run multiple times (only processes UNREAD)
 * - Thread-specific: Routes based on thread_id, not all user pairings
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/notificationSender.ts';
import { corsHeaders } from '../_shared/cors.ts';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
  };
}

interface ProcessingResult {
  total: number;
  forwarded: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────
// GMAIL API CLIENT
// ─────────────────────────────────────────────────────────────

/**
 * Get Gmail OAuth2 access token using service account credentials
 */
async function getGmailAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GMAIL_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GMAIL_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing GMAIL_CLIENT_EMAIL or GMAIL_PRIVATE_KEY environment variables');
  }

  // Create JWT for service account
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const jwtClaim = btoa(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/gmail.modify',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  // Sign JWT (simplified - in production use proper crypto library)
  const signatureInput = `${jwtHeader}.${jwtClaim}`;

  // Import private key for signing
  const keyData = privateKey.replace(/\\n/g, '\n');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(keyData),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Gmail access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch UNREAD messages from Gmail
 */
async function fetchUnreadMessages(accessToken: string): Promise<GmailMessage[]> {
  const messagesResponse = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!messagesResponse.ok) {
    throw new Error(`Failed to fetch Gmail messages: ${await messagesResponse.text()}`);
  }

  const messagesData = await messagesResponse.json();
  const messageIds = messagesData.messages || [];

  if (messageIds.length === 0) {
    console.log('[poll-gmail-inbox] No unread messages found');
    return [];
  }

  console.log(`[poll-gmail-inbox] Found ${messageIds.length} unread messages`);

  // Fetch full message details
  const messages: GmailMessage[] = [];
  for (const { id } of messageIds) {
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (messageResponse.ok) {
      messages.push(await messageResponse.json());
    } else {
      console.error(`[poll-gmail-inbox] Failed to fetch message ${id}`);
    }
  }

  return messages;
}

/**
 * Mark message as READ in Gmail
 */
async function markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark message ${messageId} as read: ${await response.text()}`);
  }

  console.log(`[poll-gmail-inbox] Marked message ${messageId} as READ`);
}

// ─────────────────────────────────────────────────────────────
// MESSAGE PROCESSING
// ─────────────────────────────────────────────────────────────

/**
 * Extract sender email from message headers
 */
function extractSenderEmail(message: GmailMessage): string | null {
  const fromHeader = message.payload.headers.find((h) => h.name.toLowerCase() === 'from');
  if (!fromHeader) return null;

  // Extract email from "Name <email@example.com>" format
  const emailMatch = fromHeader.value.match(/<([^>]+)>/) || [null, fromHeader.value];
  return emailMatch[1]?.trim().toLowerCase() || null;
}

/**
 * Extract thread_id from To: header
 * Expected format: tech+<thread_id>@leaseplit.com
 */
function extractThreadId(message: GmailMessage): string | null {
  const toHeader = message.payload.headers.find((h) => h.name.toLowerCase() === 'to');
  if (!toHeader) return null;

  // Extract email from "Name <email@example.com>" format
  const emailMatch = toHeader.value.match(/<([^>]+)>/) || [null, toHeader.value];
  const email = emailMatch[1]?.trim().toLowerCase() || toHeader.value.trim().toLowerCase();

  // Extract thread_id from tech+<thread_id>@leaseplit.com
  const threadIdMatch = email.match(/tech\+([^@]+)@/);
  return threadIdMatch ? threadIdMatch[1] : null;
}

/**
 * Extract message subject
 */
function extractSubject(message: GmailMessage): string {
  const subjectHeader = message.payload.headers.find((h) => h.name.toLowerCase() === 'subject');
  return subjectHeader?.value || '(No Subject)';
}

/**
 * Extract message body
 */
function extractMessageBody(message: GmailMessage): string {
  // Try body.data first
  if (message.payload.body?.data) {
    return atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }

  // Try parts for multipart messages
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }
  }

  return message.snippet || '(No content)';
}

/**
 * Process a single Gmail message
 */
async function processMessage(
  message: GmailMessage,
  supabase: ReturnType<typeof createClient>,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[poll-gmail-inbox] Processing message ${message.id}`);

    // Step 1: Extract thread_id from To: header (tech+<thread_id>@leaseplit.com)
    const threadId = extractThreadId(message);
    if (!threadId) {
      console.warn(`[poll-gmail-inbox] Could not extract thread_id from To: header for message ${message.id}`);
      // Mark as read to avoid reprocessing
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'No thread_id found in To: address' };
    }

    console.log(`[poll-gmail-inbox] Thread ID: ${threadId}`);

    // Step 2: Look up the specific thread by thread_id
    const { data: thread, error: threadError } = await supabase
      .from('thread')
      .select('_id, host_user_id, guest_user_id')
      .eq('_id', threadId)
      .single();

    if (threadError || !thread) {
      console.warn(`[poll-gmail-inbox] Thread ${threadId} not found in database`);
      // Mark as read anyway to avoid reprocessing
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: `Thread ${threadId} not found` };
    }

    console.log(`[poll-gmail-inbox] Thread found: host=${thread.host_user_id}, guest=${thread.guest_user_id}`);

    // Step 3: Extract sender email and identify sender
    const senderEmail = extractSenderEmail(message);
    if (!senderEmail) {
      console.warn(`[poll-gmail-inbox] Could not extract sender email from message ${message.id}`);
      return { success: false, error: 'No sender email found' };
    }

    console.log(`[poll-gmail-inbox] Sender: ${senderEmail}`);

    // Step 4: Find sender's user ID
    const { data: senderUser, error: senderError } = await supabase
      .from('user')
      .select('_id, email')
      .eq('email', senderEmail)
      .single();

    if (senderError || !senderUser) {
      console.warn(
        `[poll-gmail-inbox] Sender ${senderEmail} not found in database (likely external email)`
      );
      // Mark as read anyway to avoid reprocessing
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'Sender not found in system' };
    }

    console.log(`[poll-gmail-inbox] Sender user ID: ${senderUser._id}`);

    // Step 5: Identify recipient (the OTHER user in the thread)
    let recipientId: string | null = null;
    if (thread.host_user_id === senderUser._id) {
      recipientId = thread.guest_user_id;
    } else if (thread.guest_user_id === senderUser._id) {
      recipientId = thread.host_user_id;
    } else {
      console.warn(`[poll-gmail-inbox] Sender ${senderUser._id} is not a participant in thread ${threadId}`);
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'Sender not a thread participant' };
    }

    if (!recipientId) {
      console.warn(`[poll-gmail-inbox] No recipient found in thread ${threadId}`);
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'No recipient in thread' };
    }

    console.log(`[poll-gmail-inbox] Recipient user ID: ${recipientId}`);

    // Step 6: Get recipient details
    const { data: recipient, error: recipientError } = await supabase
      .from('user')
      .select('_id, email, "Name - First" as firstName, "Phone number" as phone')
      .eq('_id', recipientId)
      .single();

    if (recipientError || !recipient) {
      console.warn(`[poll-gmail-inbox] Recipient ${recipientId} not found`);
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'Recipient not found' };
    }

    console.log(`[poll-gmail-inbox] Recipient: ${recipient.email}`);

    // Step 7: Prepare message content
    const subject = extractSubject(message);
    const body = extractMessageBody(message);

    // Step 8: Send notification (checks message_forwarding_email/sms preferences)
    const result = await sendNotification({
      supabase,
      userId: recipientId,
      category: 'message_forwarding',
      edgeFunction: 'poll-gmail-inbox',
      email: {
        templateId: '1757429600000x000000000000000005', // Message forwarding template
        toEmail: recipient.email,
        toName: recipient.firstName,
        variables: {
          sender_name: senderUser.email.split('@')[0],
          subject,
          message_body: body.substring(0, 500), // Truncate for preview
          thread_link: `https://www.split.lease/messages?thread=${threadId}`,
        },
      },
      sms: recipient.phone
        ? {
            toPhone: recipient.phone,
            body: `New message from ${senderUser.email.split('@')[0]}: "${subject.substring(0, 50)}"... Reply at www.split.lease/messages`,
          }
        : undefined,
    });

    // Step 9: Mark message as READ
    await markMessageAsRead(accessToken, message.id);

    if (result.emailSent || result.smsSent) {
      console.log(
        `[poll-gmail-inbox] Forwarded to ${recipient.email} (email: ${result.emailSent}, sms: ${result.smsSent})`
      );
      return { success: true };
    } else {
      console.log(
        `[poll-gmail-inbox] Skipped forwarding to ${recipient.email} (user opted out: ${result.emailSkipReason || result.smsSkipReason})`
      );
      return {
        success: true,
        error: `Message processed but not forwarded: ${result.emailSkipReason || result.smsSkipReason}`,
      };
    }
  } catch (error) {
    console.error(`[poll-gmail-inbox] Error processing message ${message.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify service role authentication
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Service role required' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log('[poll-gmail-inbox] ========== POLLING GMAIL INBOX ==========');

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Step 1: Get Gmail access token
    console.log('[poll-gmail-inbox] Authenticating with Gmail...');
    const accessToken = await getGmailAccessToken();

    // Step 2: Fetch UNREAD messages
    console.log('[poll-gmail-inbox] Fetching unread messages...');
    const messages = await fetchUnreadMessages(accessToken);

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No unread messages',
          result: { total: 0, forwarded: 0, skipped: 0, failed: 0 },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Process each message
    const result: ProcessingResult = {
      total: messages.length,
      forwarded: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const message of messages) {
      const processResult = await processMessage(message, supabase, accessToken);

      if (processResult.success) {
        if (processResult.error) {
          result.skipped++;
        } else {
          result.forwarded++;
        }
      } else {
        result.failed++;
        if (processResult.error) {
          result.errors.push(processResult.error);
        }
      }
    }

    console.log('[poll-gmail-inbox] Processing complete:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${result.total} messages`,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[poll-gmail-inbox] Fatal error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
