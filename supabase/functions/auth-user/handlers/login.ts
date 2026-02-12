/**
 * Login Handler - Authenticate user via Supabase Auth (Native)
 * Split Lease - auth-user
 *
 * Flow:
 * 1. Validate email/password in payload
 * 2. Authenticate via Supabase Auth (signInWithPassword)
 * 3. Fetch user profile from public.user table
 * 4. Return session tokens and user data
 *
 * NO FALLBACK - If login fails, entire operation fails
 * Uses Supabase Auth natively - no Bubble dependency
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key for admin operations
 * @param payload - Request payload {email, password}
 * @returns {access_token, refresh_token, user_id, expires_in, user_type}
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError, SupabaseSyncError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { sendLoginNotificationEmail } from '../../_shared/emailUtils.ts';
import {
  getNotificationPreferences,
  shouldSendEmail as checkEmailPreference,
} from '../../_shared/notificationHelpers.ts';

export async function handleLogin(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: any
): Promise<any> {
  console.log('[login] ========== LOGIN REQUEST (SUPABASE NATIVE) ==========');

  // Validate required fields
  validateRequiredFields(payload, ['email', 'password']);
  const { email, password } = payload;

  console.log(`[login] Authenticating user: ${email}`);

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // ========== AUTHENTICATE VIA SUPABASE AUTH ==========
    console.log('[login] Signing in via Supabase Auth...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (authError) {
      console.error(`[login] Auth error:`, authError.message);

      // Map common auth errors to user-friendly messages
      if (authError.message.includes('Invalid login credentials')) {
        throw new ApiError('Invalid email or password. Please try again.', 401);
      }
      if (authError.message.includes('Email not confirmed')) {
        throw new ApiError('Please verify your email address before logging in.', 401);
      }

      throw new ApiError(authError.message, 401);
    }

    if (!authData.session || !authData.user) {
      console.error(`[login] No session returned from auth`);
      throw new ApiError('Authentication failed. Please try again.', 401);
    }

    const { session, user: authUser } = authData;
    console.log(`[login] ✅ Supabase Auth successful`);
    console.log(`[login]    Auth User ID: ${authUser.id}`);
    console.log(`[login]    Email: ${authUser.email}`);
    console.log(`[login]    Existing user_metadata.user_id:`, authUser.user_metadata?.user_id);

    // ========== FETCH USER PROFILE ==========
    console.log('[login] Fetching user profile from public.user table...');

    // First try to find user by email
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user')
      .select('id, email, first_name, last_name, profile_photo_url')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error(`[login] Profile fetch error:`, profileError.message);
      // Don't fail login - user might exist in auth but not in public.user yet
    }

    // Get user_id from profile or user_metadata
    const userId = userProfile?.id || authUser.user_metadata?.user_id || authUser.id;
    const userType = authUser.user_metadata?.user_type || 'Guest';
    // hostAccountId is now the same as userId (user.id is used directly as host reference)
    const hostAccountId = userId;

    // ========== MIGRATION: UPDATE USER METADATA IF NEEDED ==========
    // For users created before the signup flow was updated, their user_metadata.user_id
    // might not be set. We update it here to ensure subsequent Edge Function calls work correctly.
    if (userProfile?.id && !authUser.user_metadata?.user_id) {
      console.log('[login] 🔄 MIGRATION: Updating user_metadata.user_id for legacy user:', userProfile.id);

      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          {
            user_metadata: {
              ...authUser.user_metadata,
              user_id: userProfile.id,
              host_account_id: userProfile.id, // Same as user_id now
            }
          }
        );

        if (updateError) {
          console.error('[login] ⚠️ Failed to update user_metadata (non-blocking):', updateError.message);
        } else {
          console.log('[login] ✅ user_metadata.user_id updated successfully');
        }
      } catch (metadataError) {
        console.error('[login] ⚠️ Failed to update user_metadata (non-blocking):', metadataError);
      }
    } else if (authUser.user_metadata?.user_id) {
      console.log('[login] ✅ user_metadata.user_id already set:', authUser.user_metadata.user_id);
    }

    console.log(`[login] ✅ User profile loaded`);
    console.log(`[login]    User ID: ${userId}`);
    console.log(`[login]    User Type: ${userType}`);

    // ========== RETURN SESSION DATA ==========
    const { access_token, refresh_token, expires_in } = session;

    // ========== SEND LOGIN NOTIFICATION EMAIL ==========
    // NOTE: Must be awaited in Deno Edge Functions - fire-and-forget IIFEs are cancelled when handler returns
    // Respects notification preferences (account_assistance category)
    const loginTimestamp = new Date().toISOString();
    const firstName = userProfile?.first_name || '';

    try {
      // Check notification preferences before sending
      const prefs = await getNotificationPreferences(supabaseAdmin, userId);
      if (!checkEmailPreference(prefs, 'account_assistance')) {
        console.log('[login] Login notification email SKIPPED (preference: account_assistance disabled)');
      } else {
        const result = await sendLoginNotificationEmail(authUser.email!, firstName, loginTimestamp);
        if (!result.success) {
          console.error('[login] Login notification email failed:', result.error);
        } else {
          console.log('[login] ✅ Login notification email sent');
        }
      }
    } catch (err) {
      console.error('[login] Login notification email error:', err);
      // Non-blocking: Continue with login even if email fails
    }

    console.log(`[login] ========== LOGIN COMPLETE ==========`);

    return {
      access_token,
      refresh_token,
      expires_in,
      user_id: userId,
      supabase_user_id: authUser.id,
      user_type: userType,
      host_account_id: hostAccountId,
      email: authUser.email,
      firstName: userProfile?.first_name || '',
      lastName: userProfile?.last_name || '',
      profilePhoto: userProfile?.profile_photo_url || null
    };

  } catch (error) {
    if (error instanceof ApiError || error instanceof SupabaseSyncError) {
      throw error;
    }

    console.error(`[login] ========== LOGIN ERROR ==========`);
    console.error(`[login] Error:`, error);

    throw new ApiError(
      `Failed to authenticate user: ${error.message}`,
      500,
      error
    );
  }
}
