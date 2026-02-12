/**
 * OAuth Signup Handler - Create user record from OAuth provider data
 * Split Lease - auth-user
 *
 * Flow:
 * 1. Validate OAuth payload
 * 2. Check if email already exists in public.user table
 * 3. If duplicate: Return indicator for frontend to show confirmation modal
 * 4. If new: Generate ID, create user record
 * 5. Return user data
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key
 * @param payload - Request payload from OAuth callback
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { mapUserTypeToDisplay } from '../../_shared/userTypeMapping.ts';

interface OAuthSignupPayload {
  email: string;
  firstName: string;
  lastName: string;
  userType: 'Host' | 'Guest';
  provider: string;
  supabaseUserId: string;
  access_token: string;
  refresh_token: string;
  profilePhoto?: string | null; // Optional - LinkedIn profile picture URL
}

export async function handleOAuthSignup(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: OAuthSignupPayload
): Promise<any> {
  console.log('[oauth-signup] ========== OAUTH SIGNUP REQUEST ==========');

  // Validate required fields
  validateRequiredFields(payload, ['email', 'supabaseUserId']);

  const {
    email,
    firstName = '',
    lastName = '',
    userType = 'Guest',
    provider,
    supabaseUserId,
    access_token,
    refresh_token,
    profilePhoto = null,
  } = payload;

  const userTypeDisplay = mapUserTypeToDisplay(userType);

  console.log(`[oauth-signup] Provider: ${provider}`);
  console.log(`[oauth-signup] Email: ${email}`);
  console.log(`[oauth-signup] Name: ${firstName} ${lastName}`);
  console.log(`[oauth-signup] UserType: ${userType} -> ${userTypeDisplay}`);
  console.log(`[oauth-signup] Profile Photo: ${profilePhoto ? 'provided' : 'not provided'}`);

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // ========== CHECK FOR EXISTING USER ==========
    console.log('[oauth-signup] Checking if email already exists...');

    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('user')
      .select('id, email, first_name, last_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userCheckError) {
      console.error('[oauth-signup] Error checking existing user:', userCheckError.message);
      throw new ApiError('Failed to verify email availability', 500);
    }

    if (existingUser) {
      console.log('[oauth-signup] Email already exists in user table:', email);
      // Return duplicate indicator for frontend to show confirmation modal
      return {
        isDuplicate: true,
        existingEmail: email,
        existingUserId: existingUser.id,
        message: 'An account with this email already exists.',
      };
    }

    console.log('[oauth-signup] Email is available');

    // ========== GENERATE UNIQUE ID ==========
    console.log('[oauth-signup] Generating ID using generate_unique_id()...');

    const { data: generatedUserId, error: userIdError } = await supabaseAdmin.rpc('generate_unique_id');

    if (userIdError) {
      console.error('[oauth-signup] Failed to generate ID:', userIdError);
      throw new ApiError('Failed to generate unique ID', 500);
    }

    const generatedHostId = generatedUserId;
    console.log(`[oauth-signup] Generated User ID: ${generatedUserId}`);

    // ========== CREATE DATABASE RECORD ==========
    const now = new Date().toISOString();
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

    console.log('[oauth-signup] Creating user record...');

    const userRecord = {
      'id': generatedUserId,
      'email': email.toLowerCase(),
      'first_name': firstName || null,
      'last_name': lastName || null,
      'phone_number': null, // OAuth signup skips phone
      'profile_photo_url': profilePhoto || null, // LinkedIn profile picture (if available)
      'current_user_role': userTypeDisplay,
      'created_at': now,
      'updated_at': now,
      'authentication': {},
      'user_signed_up': true,
    };

    console.log('[oauth-signup] User record to insert:', JSON.stringify(userRecord, null, 2));

    const { error: userInsertError } = await supabaseAdmin
      .from('user')
      .insert(userRecord);

    if (userInsertError) {
      console.error('[oauth-signup] Failed to insert user:', userInsertError.message);
      throw new ApiError(
        `Failed to create user profile: ${userInsertError.message}`,
        500
      );
    }

    console.log('[oauth-signup] User inserted into public.user table');

    // ========== UPDATE SUPABASE AUTH USER METADATA ==========
    console.log('[oauth-signup] Updating Supabase Auth user metadata...');

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      supabaseUserId,
      {
        user_metadata: {
          user_id: generatedUserId,
          host_account_id: generatedHostId,
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        }
      }
    );

    if (updateError) {
      console.warn('[oauth-signup] Failed to update user metadata (non-blocking):', updateError);
      // Non-blocking - user record already created
    }

    console.log('[oauth-signup] ========== OAUTH SIGNUP COMPLETE ==========');

    return {
      isNewUser: true,
      user_id: generatedUserId,
      host_account_id: generatedHostId,
      supabase_user_id: supabaseUserId,
      user_type: userType,
      access_token,
      refresh_token,
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('[oauth-signup] Error:', error);
    throw new ApiError(
      `Failed to complete OAuth signup: ${error.message}`,
      500
    );
  }
}
