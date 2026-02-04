/**
 * Create Emergency Handler
 * Split Lease - Emergency Edge Function
 *
 * Creates a new emergency report (can be called by guests)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Inline Slack helper (fire-and-forget, no external dependency)
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

interface CreatePayload {
  proposal_id?: string;
  reported_by_user_id?: string;
  emergency_type: string;
  description: string;
  photo1_url?: string;
  photo2_url?: string;
}

export async function handleCreate(
  payload: CreatePayload,
  supabase: SupabaseClient
): Promise<unknown> {
  console.log('[emergency:create] Creating new emergency report');

  const {
    proposal_id,
    reported_by_user_id,
    emergency_type,
    description,
    photo1_url,
    photo2_url,
  } = payload;

  // Validate required fields
  if (!emergency_type) {
    throw new Error('Emergency type is required');
  }

  if (!description) {
    throw new Error('Description is required');
  }

  // Create emergency report
  const { data, error } = await supabase
    .from('emergency_report')
    .insert({
      proposal_id,
      reported_by_user_id,
      emergency_type,
      description,
      photo1_url,
      photo2_url,
      status: 'REPORTED',
      is_hidden: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[emergency:create] Insert error:', error);
    throw new Error(`Failed to create emergency report: ${error.message}`);
  }

  console.log('[emergency:create] Emergency created:', data.id);

  // Send Slack notification
  try {
    await notifySlackNewEmergency(data, supabase);
  } catch (slackError) {
    console.warn('[emergency:create] Slack notification failed:', slackError);
    // Don't fail the request if Slack notification fails
  }

  return data;
}

/**
 * Send Slack notification for new emergency
 */
async function notifySlackNewEmergency(
  emergency: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  // Fetch additional context
  let proposalInfo = '';
  let guestInfo = '';

  if (emergency.proposal_id) {
    const { data: proposal } = await supabase
      .from('proposal')
      .select('_id, "Agreement #", "Guest", "Listing"')
      .eq('_id', emergency.proposal_id)
      .single();

    if (proposal) {
      proposalInfo = `Agreement #: ${proposal['Agreement #'] || 'N/A'}`;

      if (proposal.Guest) {
        const { data: guest } = await supabase
          .from('user')
          .select('"First name", "Last name", email')
          .eq('_id', proposal.Guest)
          .single();

        if (guest) {
          guestInfo = `Guest: ${guest['First name'] || ''} ${guest['Last name'] || ''} (${guest.email || 'N/A'})`;
        }
      }
    }
  }

  const message = {
    text: [
      `🚨 *NEW EMERGENCY REPORTED*`,
      ``,
      `*Type:* ${emergency.emergency_type}`,
      `*Description:* ${(emergency.description as string).substring(0, 200)}${(emergency.description as string).length > 200 ? '...' : ''}`,
      proposalInfo ? `*${proposalInfo}*` : '',
      guestInfo ? `*${guestInfo}*` : '',
      ``,
      `*Emergency ID:* ${emergency.id}`,
      `*Created:* ${new Date(emergency.created_at as string).toLocaleString()}`,
    ].filter(Boolean).join('\n'),
  };

  // Use the database webhook channel for emergency notifications
  sendToSlack('database', message);
}
