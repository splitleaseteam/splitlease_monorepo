/**
 * Signup Handler - Register new user via Supabase Auth (Native)
 * Split Lease - auth-user
 *
 * Flow:
 * 1. Validate email/password/retype in payload
 * 2. Client-side validation (password length, match)
 * 3. Check if email already exists in public.user table
 * 4. Check if email already exists in Supabase Auth
 * 5. Generate user_id using generate_unique_id()
 * 6. Create Supabase Auth user (auth.users table)
 * 7. Sign in user to get session tokens
 * 8. Insert user profile into public.user table with:
 *    - id = generated user_id (also used as host reference in listings/proposals)
 *    - Receptivity = 0 (host field migrated from account_host)
 * 9. Return session tokens and user data
 *
 * NOTE: account_host table and "Account - Host / Landlord" column have been removed
 * User.id is now used directly as the host reference in listings and proposals
 *
 * NO FALLBACK - If any operation fails, entire signup fails
 * Uses Supabase Auth natively - no Bubble dependency
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key for admin operations
 * @param payload - Request payload {email, password, retype, additionalData?}
 *   additionalData may include: firstName, lastName, userType, birthDate, phoneNumber
 * @returns {access_token, refresh_token, user_id, host_account_id, supabase_user_id, expires_in}
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError } from '../../_shared/errors.ts';
import { validateRequiredFields, validateEmail } from '../../_shared/validation.ts';
import { mapUserTypeToDisplay } from '../../_shared/userTypeMapping.ts';
import {
  sendWelcomeEmail,
  sendInternalSignupNotification,
  sendWelcomeSms
} from '../../_shared/emailUtils.ts';
import { createDefaultNotificationPreferences } from '../../_shared/notificationSender.ts';
import {
  getNotificationPreferences,
  shouldSendEmail as _checkEmailPreference,
  shouldSendSms as checkSmsPreference,
} from '../../_shared/notificationHelpers.ts';

interface SignupAdditionalData {
  firstName?: string;
  lastName?: string;
  userType?: 'Host' | 'Guest';
  birthDate?: string; // ISO format: YYYY-MM-DD
  phoneNumber?: string;
}

export async function handleSignup(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: any
): Promise<any> {
  console.log('[signup] ========== SIGNUP REQUEST (SUPABASE NATIVE) v3 ==========');
  console.log('[signup] 🔑 DATABASE CONNECTION INFO:');
  console.log('[signup]    supabaseUrl:', supabaseUrl);
  console.log('[signup]    Project ID (from URL):', supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1] || 'UNKNOWN');

  // Validate required fields
  validateRequiredFields(payload, ['email', 'password', 'retype']);
  const { email, password, retype, additionalData } = payload;

  // Extract additional signup data
  const {
    firstName = '',
    lastName = '',
    userType = 'Guest',
    birthDate = '',
    phoneNumber = ''
  }: SignupAdditionalData = additionalData || {};

  // Map userType string to os_user_type.display for foreign key constraint
  const userTypeDisplay = mapUserTypeToDisplay(userType);

  console.log(`[signup] Registering new user: ${email}`);
  console.log(`[signup] Additional data: firstName=${firstName}, lastName=${lastName}, userType=${userType} -> display="${userTypeDisplay}"`);

  // Client-side validation
  if (password.length < 4) {
    throw new ApiError('Password must be at least 4 characters long.', 400);
  }

  if (password !== retype) {
    throw new ApiError('The two passwords do not match!', 400);
  }

  // Email format validation
  try {
    validateEmail(email);
  } catch {
    throw new ApiError('Please enter a valid email address.', 400);
  }

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // ========== CHECK FOR EXISTING USER ==========
    console.log('[signup] ========== EMAIL CHECK v2 ==========');
    console.log('[signup] Checking if email already exists...');
    console.log('[signup] Email to check:', email.toLowerCase());

    // Check in public.user table
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('user')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    console.log('[signup] public.user check result:', { existingUser, userCheckError: userCheckError?.message });

    if (userCheckError) {
      console.error('[signup] Error checking existing user:', userCheckError.message);
      throw new ApiError('Failed to verify email availability', 500);
    }

    if (existingUser) {
      console.log('[signup] ❌ BLOCKED: Email already exists in user table:', email, 'user_id:', existingUser.id);
      throw new ApiError('This email is already in use.', 400, 'USED_EMAIL');
    }

    console.log('[signup] ✅ Email NOT in public.user table');

    // Check in Supabase Auth
    let existingAuthUser = null;
    try {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      console.log('[signup] auth.listUsers result:', {
        userCount: authUsers?.users?.length || 0,
        listError: listError?.message
      });
      if (!listError && authUsers?.users) {
        existingAuthUser = authUsers.users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
        if (existingAuthUser) {
          console.log('[signup] ❌ BLOCKED: Found matching auth user:', existingAuthUser.id, existingAuthUser.email);
        }
      }
    } catch (listErr) {
      console.log('[signup] Could not list auth users:', listErr);
    }

    if (existingAuthUser) {
      console.log('[signup] ❌ BLOCKED: Email already exists in Supabase Auth:', email);
      throw new ApiError('This email is already in use.', 400, 'USED_EMAIL');
    }

    console.log('[signup] ✅ Email NOT in Supabase Auth');
    console.log('[signup] ✅ Email is available - proceeding with signup');

    // ========== GENERATE UNIQUE ID ==========
    console.log('[signup] Generating ID using generate_unique_id()...');

    const { data: generatedUserId, error: userIdError } = await supabaseAdmin.rpc('generate_unique_id');

    if (userIdError) {
      console.error('[signup] Failed to generate ID:', userIdError);
      throw new ApiError('Failed to generate unique ID', 500);
    }

    // User.id is now used directly as host reference - no separate host account ID needed
    // Keep generatedHostId for backwards compatibility with user_metadata
    const generatedHostId = generatedUserId;

    console.log(`[signup]    Generated User ID: ${generatedUserId}`);

    // ========== CREATE SUPABASE AUTH USER ==========
    console.log('[signup] Creating Supabase Auth user...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm for immediate login
      user_metadata: {
        user_id: generatedUserId,
        host_account_id: generatedHostId,
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        birth_date: birthDate,
        phone_number: phoneNumber
      }
    });

    if (authError) {
      console.error('[signup] Supabase Auth user creation failed:', authError.message);

      // Map Supabase auth errors to user-friendly messages
      if (authError.message.includes('already registered')) {
        throw new ApiError('This email is already in use.', 400, 'USED_EMAIL');
      }
      throw new ApiError(`Failed to create account: ${authError.message}`, 500);
    }

    const supabaseUserId = authData.user?.id;
    console.log('[signup] ✅ Supabase Auth user created:', supabaseUserId);

    // ========== SIGN IN TO GET SESSION TOKENS ==========
    console.log('[signup] Signing in user to get session tokens...');

    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError || !sessionData.session) {
      console.error('[signup] Failed to sign in user:', signInError?.message);
      // User was created but couldn't get session - clean up
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId!);
      throw new ApiError('Failed to create session. Please try again.', 500);
    }

    const { access_token, refresh_token, expires_in } = sessionData.session;
    console.log('[signup] ✅ Session created, expires in:', expires_in, 'seconds');

    // ========== CREATE DATABASE RECORDS ==========
    const now = new Date().toISOString();
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

    // Parse birthDate to timestamp if provided
    let dateOfBirth: string | null = null;
    if (birthDate) {
      try {
        dateOfBirth = new Date(birthDate).toISOString();
      } catch (_e) {
        console.log('[signup] Could not parse birthDate:', birthDate);
      }
    }

    // NOTE: account_host table and "Account - Host / Landlord" column have been removed
    // User.id is now used directly as the host reference in listings and proposals
    console.log('[signup] Creating user record (user.id serves as host reference)');

    // Insert into public.user table (includes host fields that were previously in account_host)
    console.log('[signup] Inserting into public.user table...');

    const userRecord = {
      id: generatedUserId,
      supabase_user_id: supabaseUserId,
      'email': email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      'Date of Birth': dateOfBirth,
      phone_number: phoneNumber || null,
      current_user_role: userTypeDisplay, // Foreign key to os_user_type.display
      'Type - User Signup': userTypeDisplay,  // Foreign key to os_user_type.display
      // Note: "Account - Host / Landlord" column removed - user.id is used directly as host reference
      created_at: now,
      updated_at: now,
      'authentication': {}, // Required jsonb field
      'user_signed_up': true, // Required boolean field
      // Host fields (migrated from account_host table)
      'Receptivity': 0,
      'MedianHoursToReply': null,
      'Listings': null  // Will be populated when user creates listings
    };

    console.log('[signup] User record to insert:', JSON.stringify(userRecord, null, 2));

    const { error: userInsertError } = await supabaseAdmin
      .from('user')
      .insert(userRecord);

    if (userInsertError) {
      console.error('[signup] Failed to insert into public.user:', userInsertError.message);
      // Clean up: delete auth user (no account_host to clean up anymore)
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId!);
      throw new ApiError(
        `Failed to create user profile: ${userInsertError.message}`,
        500
      );
    }

    console.log('[signup] ✅ User inserted into public.user table');

    // ========== CREATE NOTIFICATION PREFERENCES ==========
    // Create default notification preferences row with opt-out model
    // All notifications enabled by default (except promotional SMS)
    console.log('[signup] Creating default notification preferences...');

    const prefsResult = await createDefaultNotificationPreferences(supabaseAdmin, generatedUserId);
    if (prefsResult.success) {
      console.log('[signup] ✅ Notification preferences created (opt-out model)');
    } else {
      // Non-blocking - user can configure preferences later via UI
      console.warn('[signup] ⚠️ Failed to create notification preferences:', prefsResult.error);
    }

    console.log(`[signup] ========== SIGNUP COMPLETE ==========`);
    console.log(`[signup]    User ID (id): ${generatedUserId}`);
    console.log(`[signup]    Host Account ID (legacy FK): ${generatedHostId}`);
    console.log(`[signup]    Supabase Auth ID: ${supabaseUserId}`);
    console.log(`[signup]    public.user created: yes`);
    console.log(`[signup]    notification_preferences created: ${prefsResult.success ? 'yes' : 'no'}`);
    console.log(`[signup]    account_host created: SKIPPED (deprecated)`);

    // ========== SEND WELCOME EMAILS & SMS ==========
    // Fire-and-forget pattern: promises run without awaiting
    // This matches Bubble's "Schedule API Workflow" pattern
    // Emails/SMS are sent after response returns, but before function terminates
    // Respects notification preferences (account_assistance category)
    console.log('[signup] Triggering welcome emails and SMS (async)...');

    // Generate email verification magic link
    const siteUrl = Deno.env.get('SITE_URL') || 'https://split.lease';
    let verificationLink = `${siteUrl}/email-verified`;

    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
        options: {
          redirectTo: `${siteUrl}/email-verified`,
        },
      });
      verificationLink = linkData?.properties?.action_link || verificationLink;
      console.log('[signup] ✅ Verification magic link generated');
    } catch (linkError) {
      console.error('[signup] Failed to generate verification link (non-blocking):', linkError);
    }

    // Send welcome email with verification link
    // IMPORTANT: Welcome email is ALWAYS sent for new signups, regardless of preferences
    // This is critical for email verification and account confirmation
    // NOTE: Must be awaited in Deno Edge Functions - fire-and-forget IIFEs are cancelled when handler returns
    try {
      console.log('[signup] 📧 Sending welcome email to:', email.toLowerCase());
      const result = await sendWelcomeEmail(userType as 'Host' | 'Guest', email.toLowerCase(), firstName, verificationLink);
      if (!result.success) {
        console.error('[signup] Welcome email failed:', result.error);
        // Non-blocking: Continue with signup even if email fails
      } else {
        console.log('[signup] ✅ Welcome email sent');
      }
    } catch (err) {
      console.error('[signup] Welcome email error:', err);
      // Non-blocking: Continue with signup even if email fails
    }

    // Send internal notification (non-blocking, but awaited to prevent Deno Edge Function cancellation)
    // Note: Internal notifications to team are always sent (not preference-gated)
    // NOTE: Must be awaited in Deno Edge Functions - fire-and-forget promises are cancelled when handler returns
    try {
      const result = await sendInternalSignupNotification(generatedUserId, email.toLowerCase(), firstName, lastName, userType as 'Host' | 'Guest');
      if (!result.success) {
        console.error('[signup] Internal notification failed:', result.error);
      } else {
        console.log('[signup] ✅ Internal notification sent');
      }
    } catch (err) {
      console.error('[signup] Internal notification error:', err);
    }

    // Send welcome SMS to Guests with phone numbers
    // Checks notification_preferences table
    // NOTE: Must be awaited in Deno Edge Functions - fire-and-forget IIFEs are cancelled when handler returns
    if (userType === 'Guest' && phoneNumber) {
      try {
        const prefs = await getNotificationPreferences(supabaseAdmin, generatedUserId);
        if (!checkSmsPreference(prefs, 'account_assistance')) {
          console.log('[signup] Welcome SMS SKIPPED (preference: account_assistance disabled)');
        } else {
          const result = await sendWelcomeSms(phoneNumber, firstName);
          if (!result.success) {
            console.error('[signup] Welcome SMS failed:', result.error);
          } else {
            console.log('[signup] ✅ Welcome SMS sent');
          }
        }
      } catch (_err) {
        console.error('[signup] Welcome SMS error:', _err);
      }
    }

    console.log('[signup] Email/SMS/notification processing complete');

    // Return session and user data
    return {
      access_token,
      refresh_token,
      expires_in,
      user_id: generatedUserId,
      host_account_id: generatedHostId,
      supabase_user_id: supabaseUserId,
      user_type: userType
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error(`[signup] ========== SIGNUP ERROR ==========`);
    console.error(`[signup] Error:`, error);

    throw new ApiError(
      `Failed to register user: ${error.message}`,
      500
    );
  }
}
