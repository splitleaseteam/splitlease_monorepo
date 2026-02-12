/**
 * Emergency Edge Function (CONSOLIDATED)
 * Split Lease - Supabase Edge Functions
 *
 * All handlers are inlined to avoid dynamic import issues with MCP deployment.
 *
 * Actions:
 * - getAll: Fetch all emergencies with filters
 * - getById: Fetch single emergency with relations
 * - create: Create new emergency report
 * - update: Update emergency fields
 * - assignEmergency: Assign to team member + Slack notify
 * - updateStatus: Update status (REPORTED → ASSIGNED → etc.)
 * - updateVisibility: Hide/show emergency
 * - sendSMS: Send SMS via Twilio + log
 * - sendEmail: Send email via SendGrid + log
 * - getMessages: Fetch SMS history
 * - getEmails: Fetch email history
 * - getPresetMessages: Fetch preset SMS templates
 * - getPresetEmails: Fetch preset email templates
 * - getTeamMembers: Fetch staff users (admin = true)
 * - health: Health check
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CORS & Constants
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const VALID_ACTIONS = [
  'getAll', 'getById', 'create', 'update', 'assignEmergency', 'updateStatus',
  'updateVisibility', 'sendSMS', 'sendEmail', 'getMessages', 'getEmails',
  'getPresetMessages', 'getPresetEmails', 'getTeamMembers', 'health',
] as const;

type Action = typeof VALID_ACTIONS[number];

const VALID_STATUSES = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ============================================================================
// Slack Helper (inline, fire-and-forget)
// ============================================================================

function sendToSlack(channel: string, message: { text: string }): void {
  const webhookEnvMap: Record<string, string> = {
    database: 'SLACK_WEBHOOK_DATABASE_WEBHOOK',
    acquisition: 'SLACK_WEBHOOK_ACQUISITION',
    general: 'SLACK_WEBHOOK_DB_GENERAL',
  };
  const webhookUrl = Deno.env.get(webhookEnvMap[channel] || '');
  if (!webhookUrl) {
    console.warn(`[slack] Webhook not configured for ${channel}, skipping`);
    return;
  }
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  }).catch((e) => console.error('[slack] Failed:', e.message));
}

// ============================================================================
// Types
// ============================================================================

interface AdminUser {
  id: string;
  email: string;
  userId: string;
}

// ============================================================================
// Main Handler
// ============================================================================

console.log("[emergency] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[emergency] Request: ${req.method}`);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[emergency] Action: ${action}`);

    if (!VALID_ACTIONS.includes(action as Action)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let result: unknown;

    switch (action) {
      case 'health':
        result = { status: 'healthy', timestamp: new Date().toISOString(), actions: VALID_ACTIONS };
        break;

      case 'getAll':
        result = await handleGetAll(payload, supabase);
        break;

      case 'getById':
        result = await handleGetById(payload, supabase);
        break;

      case 'create':
        result = await handleCreate(payload, supabase);
        break;

      case 'update': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleUpdate(payload, user, supabase);
        break;
      }

      case 'assignEmergency': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleAssignEmergency(payload, user, supabase);
        break;
      }

      case 'updateStatus': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleUpdateStatus(payload, supabase);
        break;
      }

      case 'updateVisibility': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleUpdateVisibility(payload, supabase);
        break;
      }

      case 'sendSMS': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleSendSMS(payload, supabase);
        break;
      }

      case 'sendEmail': {
        const user = await authenticateAdmin(req.headers, supabaseUrl, supabaseAnonKey, supabase);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleSendEmail(payload, supabase);
        break;
      }

      case 'getMessages':
        result = await handleGetMessages(payload, supabase);
        break;

      case 'getEmails':
        result = await handleGetEmails(payload, supabase);
        break;

      case 'getPresetMessages':
        result = await handleGetPresetMessages(payload, supabase);
        break;

      case 'getPresetEmails':
        result = await handleGetPresetEmails(payload, supabase);
        break;

      case 'getTeamMembers':
        result = await handleGetTeamMembers(supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[emergency] Handler completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[emergency] Error:', error);

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Authentication Helper
// ============================================================================

async function authenticateAdmin(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string,
  serviceClient: SupabaseClient
): Promise<AdminUser | null> {
  const authHeader = headers.get('Authorization');

  if (!authHeader) {
    console.log('[emergency] No Authorization header');
    return null;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();

  if (error || !user) {
    console.log('[emergency] Auth error:', error?.message);
    return null;
  }

  const { data: userData, error: userError } = await serviceClient
    .from('user')
    .select('id, is_admin, email, first_name, last_name')
    .eq('supabase_user_id', user.id)
    .single();

  if (userError || !userData) {
    console.log('[emergency] User lookup error:', userError?.message);
    return null;
  }

  if (!userData.is_admin) {
    console.log('[emergency] User is not admin');
    return null;
  }

  console.log('[emergency] Admin authenticated:', userData.email);

  return { id: user.id, email: user.email ?? '', userId: userData.id };
}

// ============================================================================
// Handler: getAll
// ============================================================================

async function handleGetAll(
  payload: { status?: string; assignedTo?: string; includeHidden?: boolean; limit?: number; offset?: number },
  supabase: SupabaseClient
): Promise<unknown[]> {
  console.log('[emergency:getAll] Fetching emergencies');

  const { assignedTo, includeHidden = false, limit = 100, offset = 0 } = payload;

  // Query from 'emergencyreports' table
  let query = supabase
    .from('emergencyreports')
    .select('*')
    .order('"Created Date"', { ascending: false })
    .range(offset, offset + limit - 1);

  if (assignedTo) query = query.eq('"Team Member Assigned"', assignedTo);
  if (!includeHidden) query = query.eq('pending', false);

  const { data, error } = await query;

  if (error) {
    console.error('[emergency:getAll] Query error:', error);
    throw new Error(`Failed to fetch emergencies: ${error.message}`);
  }

  console.log('[emergency:getAll] Found', data?.length || 0, 'emergencies');

  // Transform legacy column names to normalized format
  return (data || []).map(row => ({
    id: row.id,
    proposal_id: row['Reservation'],
    reported_by_user_id: row['reported by'],
    emergency_type: row['Type of emergency reported'],
    description: row['Description of emergency'],
    photo1_url: row['Photo 1 of emergency'],
    photo2_url: row['Photo 2 of emergency'],
    status: row['Team Member Assigned'] ? 'ASSIGNED' : 'REPORTED',
    is_hidden: row.pending || false,
    assigned_to_user_id: row['Team Member Assigned'],
    guidance_instructions: row['Guidance / Instructions '],
    summary: row['Our summary of the emergency'],
    created_at: row['Created Date'],
    updated_at: row['Modified Date'],
  }));
}

// ============================================================================
// Handler: getById
// ============================================================================

async function handleGetById(
  payload: { id: string },
  supabase: SupabaseClient
): Promise<unknown> {
  const { id } = payload;

  if (!id) throw new Error('Emergency ID is required');

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch emergency: ${error.message}`);

  // Transform legacy column names to normalized format
  return {
    id: row.id,
    proposal_id: row['Reservation'],
    reported_by_user_id: row['reported by'],
    emergency_type: row['Type of emergency reported'],
    description: row['Description of emergency'],
    photo1_url: row['Photo 1 of emergency'],
    photo2_url: row['Photo 2 of emergency'],
    status: row['Team Member Assigned'] ? 'ASSIGNED' : 'REPORTED',
    is_hidden: row.pending || false,
    assigned_to_user_id: row['Team Member Assigned'],
    guidance_instructions: row['Guidance / Instructions '],
    summary: row['Our summary of the emergency'],
    created_at: row['Created Date'],
    updated_at: row['Modified Date'],
  };
}

// ============================================================================
// Handler: create
// ============================================================================

async function handleCreate(
  payload: { proposal_id?: string; reported_by_user_id?: string; emergency_type: string; description: string; photo1_url?: string; photo2_url?: string },
  supabase: SupabaseClient
): Promise<unknown> {
  console.log('[emergency:create] Creating new emergency report');

  const { proposal_id, reported_by_user_id, emergency_type, description, photo1_url, photo2_url } = payload;

  if (!emergency_type) throw new Error('Emergency type is required');
  if (!description) throw new Error('Description is required');

  // Generate unique ID
  const recordId = `${Date.now()}x${Math.floor(Math.random() * 1000000000000000000)}`;

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .insert({
      id: recordId,
      'Reservation': proposal_id || null,
      'reported by': reported_by_user_id || 'no_user',
      'Type of emergency reported': emergency_type,
      'Description of emergency': description,
      'Photo 1 of emergency': photo1_url || null,
      'Photo 2 of emergency': photo2_url || null,
      'Created Date': new Date().toISOString(),
      'Modified Date': new Date().toISOString(),
      pending: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create emergency report: ${error.message}`);

  console.log('[emergency:create] Emergency created:', row.id);

  // Slack notification (fire-and-forget)
  sendToSlack('database', {
    text: `🚨 *NEW EMERGENCY REPORTED*\n\n*Type:* ${emergency_type}\n*Description:* ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}\n\n*Emergency ID:* ${row.id}`,
  });

  return {
    id: row.id,
    emergency_type: row['Type of emergency reported'],
    description: row['Description of emergency'],
    status: 'REPORTED',
  };
}

// ============================================================================
// Handler: update
// ============================================================================

async function handleUpdate(
  payload: { id: string; emergency_type?: string; description?: string; photo1_url?: string; photo2_url?: string; guidance_instructions?: string },
  _user: AdminUser,
  supabase: SupabaseClient
): Promise<unknown> {
  const { id, emergency_type, description, photo1_url, photo2_url, guidance_instructions } = payload;

  if (!id) throw new Error('Emergency ID is required');

  // Map normalized field names to legacy column names
  const fieldsToUpdate: Record<string, unknown> = {};
  if (emergency_type !== undefined) fieldsToUpdate['Type of emergency reported'] = emergency_type;
  if (description !== undefined) fieldsToUpdate['Description of emergency'] = description;
  if (photo1_url !== undefined) fieldsToUpdate['Photo 1 of emergency'] = photo1_url;
  if (photo2_url !== undefined) fieldsToUpdate['Photo 2 of emergency'] = photo2_url;
  if (guidance_instructions !== undefined) fieldsToUpdate['Guidance / Instructions '] = guidance_instructions;

  if (Object.keys(fieldsToUpdate).length === 0) throw new Error('No fields to update');

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .update(fieldsToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update emergency: ${error.message}`);

  return {
    id: row.id,
    emergency_type: row['Type of emergency reported'],
    description: row['Description of emergency'],
  };
}

// ============================================================================
// Handler: assignEmergency
// ============================================================================

async function handleAssignEmergency(
  payload: { emergencyId: string; assignedToUserId: string; guidanceInstructions?: string },
  user: AdminUser,
  supabase: SupabaseClient
): Promise<unknown> {
  const { emergencyId, assignedToUserId, guidanceInstructions } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');
  if (!assignedToUserId) throw new Error('Assigned user ID is required');

  const { data: assignedUser, error: userError } = await supabase
    .from('user')
    .select('id, first_name, last_name, email, is_admin')
    .eq('id', assignedToUserId)
    .single();

  if (userError || !assignedUser) throw new Error(`Assigned user not found: ${assignedToUserId}`);
  if (!assignedUser.is_admin) throw new Error('Assigned user must be an admin');

  // Map to legacy column names
  const updateData: Record<string, unknown> = {
    'Team Member Assigned': assignedToUserId,
  };

  if (guidanceInstructions !== undefined) updateData['Guidance / Instructions '] = guidanceInstructions;

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .update(updateData)
    .eq('id', emergencyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to assign emergency: ${error.message}`);

  const assignedToName = `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() || assignedUser.email;

  sendToSlack('database', {
    text: `📋 *EMERGENCY ASSIGNED*\n\n*Type:* ${row['Type of emergency reported']}\n*Assigned To:* ${assignedToName}\n*Assigned By:* ${user.email}\n\n*Emergency ID:* ${row.id}`,
  });

  return {
    id: row.id,
    emergency_type: row['Type of emergency reported'],
    assigned_to_user_id: row['Team Member Assigned'],
  };
}

// ============================================================================
// Handler: updateStatus
// ============================================================================

async function handleUpdateStatus(
  payload: { emergencyId: string; status: string },
  supabase: SupabaseClient
): Promise<unknown> {
  const { emergencyId, status } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');
  if (!status) throw new Error('Status is required');
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Valid statuses: ${VALID_STATUSES.join(', ')}`);
  }

  // Table doesn't have a status column - use pending to mark resolved/closed
  const updateData: Record<string, unknown> = {};
  if (status === 'RESOLVED' || status === 'CLOSED') {
    updateData.pending = true; // Mark as resolved/hidden
  }

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .update(updateData)
    .eq('id', emergencyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  return {
    id: row.id,
    status: row.pending ? 'RESOLVED' : (row['Team Member Assigned'] ? 'ASSIGNED' : 'REPORTED'),
  };
}

// ============================================================================
// Handler: updateVisibility
// ============================================================================

async function handleUpdateVisibility(
  payload: { emergencyId: string; isHidden: boolean },
  supabase: SupabaseClient
): Promise<unknown> {
  const { emergencyId, isHidden } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');
  if (typeof isHidden !== 'boolean') throw new Error('isHidden must be a boolean');

  const { data: row, error } = await supabase
    .from('emergencyreports')
    .update({ pending: isHidden })
    .eq('id', emergencyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update visibility: ${error.message}`);

  return {
    id: row.id,
    is_hidden: row.pending,
  };
}

// ============================================================================
// Handler: sendSMS
// ============================================================================

async function handleSendSMS(
  payload: { emergencyId: string; recipientPhone: string; messageBody: string },
  supabase: SupabaseClient
): Promise<unknown> {
  const { emergencyId, recipientPhone, messageBody } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');
  if (!recipientPhone) throw new Error('Recipient phone is required');
  if (!messageBody) throw new Error('Message body is required');

  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Missing Twilio credentials');
  }

  const { data: messageLog, error: logError } = await supabase
    .from('emergency_message')
    .insert({
      emergency_report_id: emergencyId, direction: 'OUTBOUND',
      recipient_phone: recipientPhone, sender_phone: twilioPhoneNumber,
      message_body: messageBody, status: 'PENDING',
    })
    .select()
    .single();

  if (logError) throw new Error(`Failed to create message log: ${logError.message}`);

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append('To', recipientPhone);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', messageBody);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Twilio API error: ${response.status}`);

    await supabase
      .from('emergency_message')
      .update({ twilio_sid: result.sid, status: 'SENT', sent_at: new Date().toISOString() })
      .eq('id', messageLog.id);

    return { ...messageLog, twilio_sid: result.sid, status: 'SENT' };
  } catch (_err) {
    await supabase
      .from('emergency_message')
      .update({ status: 'FAILED', error_message: (err as Error).message })
      .eq('id', messageLog.id);
    throw err;
  }
}

// ============================================================================
// Handler: sendEmail
// ============================================================================

async function handleSendEmail(
  payload: { emergencyId: string; recipientEmail: string; ccEmails?: string[]; bccEmails?: string[]; subject: string; bodyHtml: string; bodyText: string },
  supabase: SupabaseClient
): Promise<unknown> {
  const { emergencyId, recipientEmail, ccEmails = [], bccEmails = [], subject, bodyHtml, bodyText } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');
  if (!recipientEmail) throw new Error('Recipient email is required');
  if (!subject) throw new Error('Subject is required');
  if (!bodyHtml && !bodyText) throw new Error('Either body HTML or body text is required');

  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@splitlease.com';

  if (!sendgridApiKey) throw new Error('Missing SendGrid API key');

  const { data: emailLog, error: logError } = await supabase
    .from('emergency_email_log')
    .insert({
      emergency_report_id: emergencyId, recipient_email: recipientEmail,
      cc_emails: ccEmails, bcc_emails: bccEmails, subject,
      body_html: bodyHtml || '', body_text: bodyText || '', status: 'PENDING',
    })
    .select()
    .single();

  if (logError) throw new Error(`Failed to create email log: ${logError.message}`);

  try {
    const personalizations: Record<string, unknown>[] = [{ to: [{ email: recipientEmail }] }];
    if (ccEmails.length > 0) personalizations[0].cc = ccEmails.filter(e => e).map(email => ({ email }));
    if (bccEmails.length > 0) personalizations[0].bcc = bccEmails.filter(e => e).map(email => ({ email }));

    const content: Array<{ type: string; value: string }> = [];
    if (bodyText) content.push({ type: 'text/plain', value: bodyText });
    if (bodyHtml) content.push({ type: 'text/html', value: bodyHtml });

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sendgridApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalizations, from: { email: fromEmail, name: 'Split Lease' }, subject, content }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.errors?.map((e: { message: string }) => e.message).join(', ') || `SendGrid error: ${response.status}`;
      throw new Error(errorMessage);
    }

    await supabase
      .from('emergency_email_log')
      .update({ status: 'SENT', sent_at: new Date().toISOString() })
      .eq('id', emailLog.id);

    return { ...emailLog, status: 'SENT' };
  } catch (_err) {
    await supabase
      .from('emergency_email_log')
      .update({ status: 'FAILED', error_message: (err as Error).message })
      .eq('id', emailLog.id);
    throw err;
  }
}

// ============================================================================
// Handler: getMessages
// ============================================================================

async function handleGetMessages(
  payload: { emergencyId: string; limit?: number; offset?: number },
  supabase: SupabaseClient
): Promise<unknown[]> {
  const { emergencyId, limit = 50, offset = 0 } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');

  const { data, error } = await supabase
    .from('emergency_message')
    .select('*')
    .eq('emergency_report_id', emergencyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);

  return data || [];
}

// ============================================================================
// Handler: getEmails
// ============================================================================

async function handleGetEmails(
  payload: { emergencyId: string; limit?: number; offset?: number },
  supabase: SupabaseClient
): Promise<unknown[]> {
  const { emergencyId, limit = 50, offset = 0 } = payload;

  if (!emergencyId) throw new Error('Emergency ID is required');

  const { data, error } = await supabase
    .from('emergency_email_log')
    .select('*')
    .eq('emergency_report_id', emergencyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch emails: ${error.message}`);

  return data || [];
}

// ============================================================================
// Handler: getPresetMessages
// ============================================================================

async function handleGetPresetMessages(
  payload: { category?: string; activeOnly?: boolean },
  supabase: SupabaseClient
): Promise<unknown[]> {
  console.log('[emergency:getPresetMessages] Fetching preset messages');

  const { category, activeOnly = true } = payload;

  let query = supabase
    .from('emergency_preset_message')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (category) query = query.eq('category', category);
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch preset messages: ${error.message}`);

  console.log('[emergency:getPresetMessages] Found', data?.length || 0, 'preset messages');
  return data || [];
}

// ============================================================================
// Handler: getPresetEmails
// ============================================================================

async function handleGetPresetEmails(
  payload: { category?: string; activeOnly?: boolean },
  supabase: SupabaseClient
): Promise<unknown[]> {
  console.log('[emergency:getPresetEmails] Fetching preset emails');

  const { category, activeOnly = true } = payload;

  let query = supabase
    .from('emergency_preset_email')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (category) query = query.eq('category', category);
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch preset emails: ${error.message}`);

  console.log('[emergency:getPresetEmails] Found', data?.length || 0, 'preset emails');
  return data || [];
}

// ============================================================================
// Handler: getTeamMembers
// ============================================================================

async function handleGetTeamMembers(supabase: SupabaseClient): Promise<unknown[]> {
  console.log('[emergency:getTeamMembers] Fetching team members');

  const { data, error } = await supabase
    .from('user')
    .select('id, email, first_name, last_name, phone_number, is_admin')
    .eq('is_admin', true)
    .order('first_name', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);

  console.log('[emergency:getTeamMembers] Found', data?.length || 0, 'team members');

  return (data || []).map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone_number,
    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
  }));
}

console.log("[emergency] Edge Function ready");
