/**
 * Notifications Handler for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Sends multi-channel notifications when a lease is created:
 * - Email (via send-email Edge Function)
 * - SMS (via send-sms Edge Function)
 * - In-app messaging (via messages Edge Function)
 *
 * Uses notification_preferences table for preference checking.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { MagicLinksResult } from '../lib/types.ts';
import {
  getNotificationPreferences,
  shouldSendEmail as checkEmailPreference,
  shouldSendSms as checkSmsPreference,
} from '../../_shared/notificationHelpers.ts';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  phone_number?: string;
}

/**
 * Send lease creation notifications via multiple channels
 *
 * Notifications are non-blocking - failures are logged but don't
 * fail the lease creation process.
 *
 * @param supabase - Supabase client
 * @param guestId - ID of the guest
 * @param hostId - ID of the host
 * @param leaseId - ID of the lease
 * @param agreementNumber - Agreement number (e.g., "SL-00001")
 * @param magicLinks - Magic links for host and guest
 */
export async function sendLeaseNotifications(
  supabase: SupabaseClient,
  guestId: string,
  hostId: string,
  leaseId: string,
  agreementNumber: string,
  magicLinks: MagicLinksResult
): Promise<void> {
  console.log('[lease:notifications] Sending notifications for lease:', leaseId);

  // Fetch user data (preferences are now in separate notification_preferences table)
  const { data: users, error: usersError } = await supabase
    .from('user')
    .select('id, email, first_name, phone_number')
    .in('id', [guestId, hostId]);

  if (usersError || !users) {
    console.warn('[lease:notifications] Could not fetch user data:', usersError?.message);
    return;
  }

  const guest = users.find((u) => u.id === guestId) as UserData | undefined;
  const host = users.find((u) => u.id === hostId) as UserData | undefined;

  if (!guest || !host) {
    console.warn('[lease:notifications] Could not find guest or host data');
    return;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[lease:notifications] Missing environment variables');
    return;
  }

  // Fetch notification preferences for both users
  const [guestPrefs, hostPrefs] = await Promise.all([
    getNotificationPreferences(supabase, guestId),
    getNotificationPreferences(supabase, hostId),
  ]);

  // Send all notifications concurrently (non-blocking)
  // Note: Preferences are checked in each function
  await Promise.allSettled([
    // Email notifications
    sendGuestEmail(supabaseUrl, serviceRoleKey, guest, agreementNumber, magicLinks.guest, guestPrefs),
    sendHostEmail(supabaseUrl, serviceRoleKey, host, guest, agreementNumber, magicLinks.host, hostPrefs),
    // SMS notifications
    sendGuestSms(supabaseUrl, serviceRoleKey, guest, agreementNumber, guestPrefs),
    sendHostSms(supabaseUrl, serviceRoleKey, host, guest, agreementNumber, hostPrefs),
    // In-app message
    sendInAppMessage(supabaseUrl, serviceRoleKey, guestId, hostId, leaseId, agreementNumber),
  ]);

  console.log('[lease:notifications] All notification requests sent');
}

// Import NotificationPreferences type for function signatures
import type { NotificationPreferences } from '../../_shared/notificationHelpers.ts';

/**
 * Send email notification to guest
 * Uses notification_preferences table for preference checking
 */
async function sendGuestEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  guest: UserData,
  agreementNumber: string,
  magicLink: string,
  prefs: NotificationPreferences | null
): Promise<void> {
  if (!guest.email) {
    console.log('[lease:notifications] Skipping guest email (no email)');
    return;
  }

  if (!checkEmailPreference(prefs, 'lease_requests')) {
    console.log('[lease:notifications] Skipping guest email (preference: lease_requests disabled)');
    return;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          template_id: 'LEASE_CREATED_GUEST_TEMPLATE_ID', // TODO: Get actual template ID
          to_email: guest.email,
          to_name: guest.first_name,
          variables: {
            guest_name: guest.first_name || 'Guest',
            agreement_number: agreementNumber,
            magic_link: magicLink,
          },
        },
      }),
    });
    console.log('[lease:notifications] Guest email sent');
  } catch (error) {
    console.warn('[lease:notifications] Guest email failed (non-blocking):', error);
  }
}

/**
 * Send email notification to host
 * Uses notification_preferences table for preference checking
 */
async function sendHostEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  host: UserData,
  guest: UserData,
  agreementNumber: string,
  magicLink: string,
  prefs: NotificationPreferences | null
): Promise<void> {
  if (!host.email) {
    console.log('[lease:notifications] Skipping host email (no email)');
    return;
  }

  if (!checkEmailPreference(prefs, 'lease_requests')) {
    console.log('[lease:notifications] Skipping host email (preference: lease_requests disabled)');
    return;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          template_id: 'LEASE_CREATED_HOST_TEMPLATE_ID', // TODO: Get actual template ID
          to_email: host.email,
          to_name: host.first_name,
          variables: {
            host_name: host.first_name || 'Host',
            guest_name: guest.first_name || 'Guest',
            agreement_number: agreementNumber,
            magic_link: magicLink,
          },
        },
      }),
    });
    console.log('[lease:notifications] Host email sent');
  } catch (error) {
    console.warn('[lease:notifications] Host email failed (non-blocking):', error);
  }
}

/**
 * Send SMS notification to guest
 * Uses notification_preferences table for preference checking
 */
async function sendGuestSms(
  supabaseUrl: string,
  serviceRoleKey: string,
  guest: UserData,
  agreementNumber: string,
  prefs: NotificationPreferences | null
): Promise<void> {
  if (!guest.phone_number) {
    console.log('[lease:notifications] Skipping guest SMS (no phone)');
    return;
  }

  if (!checkSmsPreference(prefs, 'lease_requests')) {
    console.log('[lease:notifications] Skipping guest SMS (preference: lease_requests disabled)');
    return;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          to: guest.phone_number,
          from: '+14155692985', // Split Lease Twilio number
          body: `Split Lease: Your lease (${agreementNumber}) is being drafted! Check your email for details.`,
        },
      }),
    });
    console.log('[lease:notifications] Guest SMS sent');
  } catch (error) {
    console.warn('[lease:notifications] Guest SMS failed (non-blocking):', error);
  }
}

/**
 * Send SMS notification to host
 * Uses notification_preferences table for preference checking
 */
async function sendHostSms(
  supabaseUrl: string,
  serviceRoleKey: string,
  host: UserData,
  guest: UserData,
  agreementNumber: string,
  prefs: NotificationPreferences | null
): Promise<void> {
  if (!host.phone_number) {
    console.log('[lease:notifications] Skipping host SMS (no phone)');
    return;
  }

  if (!checkSmsPreference(prefs, 'lease_requests')) {
    console.log('[lease:notifications] Skipping host SMS (preference: lease_requests disabled)');
    return;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payload: {
          to: host.phone_number,
          from: '+14155692985', // Split Lease Twilio number
          body: `Split Lease: A lease (${agreementNumber}) with ${guest.first_name || 'a guest'} is being drafted!`,
        },
      }),
    });
    console.log('[lease:notifications] Host SMS sent');
  } catch (error) {
    console.warn('[lease:notifications] Host SMS failed (non-blocking):', error);
  }
}

/**
 * Send in-app message notification
 */
async function sendInAppMessage(
  supabaseUrl: string,
  serviceRoleKey: string,
  guestId: string,
  hostId: string,
  leaseId: string,
  agreementNumber: string
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_proposal_thread',
        payload: {
          proposalId: leaseId, // Using lease ID for thread context
          guestId,
          hostId,
          listingId: '', // Will be looked up from lease
          proposalStatus: 'Lease Drafting',
          customMessageBody: `Your lease (${agreementNumber}) is being drafted! We will notify you when the documents are ready for review.`,
        },
      }),
    });
    console.log('[lease:notifications] In-app message sent');
  } catch (error) {
    console.warn('[lease:notifications] In-app message failed (non-blocking):', error);
  }
}
