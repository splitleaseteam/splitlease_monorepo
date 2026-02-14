/**
 * Poll Gmail Inbox Edge Function
 * Split Lease - Edge Function
 *
 * Replaces legacy Python script that polled Gmail to forward messages between paired users.
 *
 * BUSINESS LOGIC:
 * 1. Connect to Gmail via service account
 * 2. Fetch UNREAD messages
 * 3. Extract sender email from From header
 * 4. Find sender's user ID in auth.users
 * 5. Find active recipient from thread pairing (host_user_id ↔ guest_user_id)
 * 6. Check recipient's notification_preferences.message_forwarding_sms/email
 * 7. If enabled, call sendNotification from _shared/notificationSender.ts
 * 8. Mark message as READ in Gmail
 *
 * SECURITY:
 * - Requires GMAIL_CLIENT_EMAIL and GMAIL_PRIVATE_KEY secrets
 * - Service role authentication required
 *
 * DESIGN PRINCIPLES:
 * - Privacy-first: Only forward if recipient explicitly opted in
 * - Fire-and-forget: Errors logged but don't stop processing other messages
 * - Idempotent: Safe to run multiple times (only processes UNREAD)
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

    // Step 1: Extract sender email
    const senderEmail = extractSenderEmail(message);
    if (!senderEmail) {
      console.warn(`[poll-gmail-inbox] Could not extract sender email from message ${message.id}`);
      return { success: false, error: 'No sender email found' };
    }

    console.log(`[poll-gmail-inbox] Sender: ${senderEmail}`);

    // Step 2: Find sender's user ID in auth.users
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

    // Step 3: Find active recipient from thread pairing
    // Check both directions: sender could be host OR guest
    const { data: threads, error: threadError } = await supabase
      .from('thread')
      .select('host_user_id, guest_user_id')
      .or(`host_user_id.eq.${senderUser._id},guest_user_id.eq.${senderUser._id}`);

    if (threadError || !threads || threads.length === 0) {
      console.warn(`[poll-gmail-inbox] No active threads found for user ${senderUser._id}`);
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'No active recipient found' };
    }

    // Determine recipient (the OTHER user in the pairing)
    const recipientIds = threads
      .map((thread) =>
        thread.host_user_id === senderUser._id ? thread.guest_user_id : thread.host_user_id
      )
      .filter((id) => id); // Remove nulls

    if (recipientIds.length === 0) {
      console.warn(`[poll-gmail-inbox] No valid recipients found for user ${senderUser._id}`);
      await markMessageAsRead(accessToken, message.id);
      return { success: false, error: 'No valid recipients' };
    }

    console.log(`[poll-gmail-inbox] Found ${recipientIds.length} potential recipients`);

    // Step 4: Process each recipient
    const subject = extractSubject(message);
    const body = extractMessageBody(message);
    let anyForwarded = false;

    for (const recipientId of recipientIds) {
      // Get recipient details
      const { data: recipient, error: recipientError } = await supabase
        .from('user')
        .select('_id, email, "Name - First" as firstName, "Phone number" as phone')
        .eq('_id', recipientId)
        .single();

      if (recipientError || !recipient) {
        console.warn(`[poll-gmail-inbox] Recipient ${recipientId} not found`);
        continue;
      }

      console.log(`[poll-gmail-inbox] Checking recipient: ${recipient.email}`);

      // Step 5: Send notification (checks preferences internally)
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
            thread_link: 'https://www.split.lease/messages',
          },
        },
        sms: recipient.phone
          ? {
              toPhone: recipient.phone,
              body: `New message from ${senderUser.email.split('@')[0]}: "${subject.substring(0, 50)}"... Reply at www.split.lease/messages`,
            }
          : undefined,
      });

      if (result.emailSent || result.smsSent) {
        anyForwarded = true;
        console.log(
          `[poll-gmail-inbox] Forwarded to ${recipient.email} (email: ${result.emailSent}, sms: ${result.smsSent})`
        );
      } else {
        console.log(
          `[poll-gmail-inbox] Skipped forwarding to ${recipient.email} (user opted out or no preferences)`
        );
      }
    }

    // Step 6: Mark message as READ
    await markMessageAsRead(accessToken, message.id);

    return {
      success: true,
      error: anyForwarded ? undefined : 'Message processed but not forwarded (recipients opted out)',
    };
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
