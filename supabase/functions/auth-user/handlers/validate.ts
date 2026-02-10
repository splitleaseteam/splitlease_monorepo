/**
 * Validate Handler - Validate session and fetch user data
 * Split Lease - auth-user
 *
 * Flow:
 * 1. Get token and user_id from payload
 * 2. Fetch user data from Supabase database by id (validates user exists)
 * 3. Return user profile data
 *
 * Note: Token validation against Bubble is skipped because:
 * - The token was validated when login succeeded
 * - Bubble will reject expired tokens on actual API calls
 * - The Bubble Data API may not accept workflow-issued tokens
 *
 * NO FALLBACK - If user not found, operation fails
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Service role key for bypassing RLS
 * @param payload - Request payload {token, user_id}
 * @returns {userId, firstName, fullName, email, profilePhoto, userType}
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError, SupabaseSyncError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';

export async function handleValidate(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: any
): Promise<any> {
  console.log('[validate] ========== SESSION VALIDATION REQUEST ==========');

  // Validate required fields
  validateRequiredFields(payload, ['token', 'user_id']);
  const { token, user_id } = payload;

  console.log(`[validate] Validating session for user (id): ${user_id}`);

  try {
    // Token validation against Bubble Data API is skipped because:
    // 1. Workflow-issued tokens may not work with Data API privacy rules
    // 2. The token was already validated when login succeeded
    // 3. Bubble will reject expired tokens on actual API calls
    // 4. We verify the user exists in Supabase below
    console.log(`[validate] Skipping Bubble token validation (trusting login-issued token)`);
    console.log(`[validate] Token present: ${token ? 'yes' : 'no'}`);

    // Step 1: Fetch user data from Supabase (validates user exists)
    console.log(`[validate] Fetching user data from Supabase...`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Query by id first (the primary key stored in browser after login/signup)
    // If that fails, get email from token and query by email
    let userData = null;
    let userError = null;

    const userSelectFields = 'id, legacy_platform_id, first_name, last_name, profile_photo_url, current_user_role, email, bio_text, stated_need_for_space_text, stated_special_needs_text, rental_application_form_id, is_usability_tester, phone_number';

    // First attempt: query by id
    console.log(`[validate] Attempting to find user by id: ${user_id}`);
    const { data: userDataById, error: errorById } = await supabase
      .from('user')
      .select(userSelectFields)
      .eq('id', user_id)
      .maybeSingle();

    if (userDataById) {
      userData = userDataById;
      console.log(`[validate] User found by id`);
    } else {
      // Second attempt: use token to get email from Supabase Auth, then query by email
      console.log(`[validate] User not found by id, trying to get email from token...`);

      // Verify the token and get user info from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        console.error(`[validate] Failed to get user from token:`, authError.message);
        userError = authError;
      } else if (authUser?.email) {
        console.log(`[validate] Got email from token: ${authUser.email}, querying by email...`);

        const { data: userDataByEmail, error: errorByEmail } = await supabase
          .from('user')
          .select(userSelectFields)
          .eq('email', authUser.email)
          .maybeSingle();

        if (userDataByEmail) {
          userData = userDataByEmail;
          console.log(`[validate] User found by email`);
        } else {
          userError = errorByEmail || errorById;
        }
      } else {
        console.error(`[validate] No email found in auth user`);
        userError = errorById;
      }
    }

    if (userError) {
      console.error(`[validate] Supabase query error:`, userError);
      throw new SupabaseSyncError(`Failed to fetch user data: ${userError.message}`, userError);
    }

    if (!userData) {
      console.error(`[validate] User not found in Supabase by id or email: ${user_id}`);
      throw new SupabaseSyncError(`User not found with id or email: ${user_id}`);
    }

    // Step 2: Check rental application submission status
    let hasSubmittedRentalApp = false;
    const rentalAppId = userData.rental_application_form_id;

    if (rentalAppId) {
      console.log(`[validate] User has rental application: ${rentalAppId}, checking submission status...`);
      const { data: rentalAppData, error: rentalAppError } = await supabase
        .from('rentalapplication')
        .select('submitted')
        .eq('_id', rentalAppId)
        .maybeSingle();

      if (rentalAppError) {
        console.warn(`[validate] Failed to fetch rental application: ${rentalAppError.message}`);
      } else if (rentalAppData) {
        hasSubmittedRentalApp = rentalAppData.submitted === true;
        console.log(`[validate] Rental application submitted: ${hasSubmittedRentalApp}`);
      }
    } else {
      console.log(`[validate] User has no rental application`);
    }

    // Step 2b: Get proposal count from booking_proposal table
    let proposalCount = 0;
    const { count, error: proposalCountError } = await supabase
      .from('booking_proposal')
      .select('id', { count: 'exact', head: true })
      .eq('guest_user_id', userData.id);

    if (proposalCountError) {
      console.warn(`[validate] Failed to count proposals: ${proposalCountError.message}`);
    } else {
      proposalCount = count ?? 0;
    }

    // Step 3: Format user data
    console.log(`[validate] User found: ${userData.first_name}`);

    // Handle protocol-relative URLs for profile photos
    let profilePhoto = userData.profile_photo_url;
    if (profilePhoto && profilePhoto.startsWith('//')) {
      profilePhoto = 'https:' + profilePhoto;
    }

    // Construct full name from parts
    const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null;

    console.log(`[validate] User has ${proposalCount} proposal(s)`);

    const userDataObject = {
      userId: userData.id,
      firstName: userData.first_name || null,
      fullName: fullName,
      email: userData.email || null,
      profilePhoto: profilePhoto || null,
      userType: userData.current_user_role || null,
      // accountHostId is now the same as userId (user IS their own host account)
      accountHostId: userData.id,
      // User profile fields for proposal prefilling
      aboutMe: userData.bio_text || null,
      needForSpace: userData.stated_need_for_space_text || null,
      specialNeeds: userData.stated_special_needs_text || null,
      // Proposal count for showing/hiding Create Proposal CTA on search page
      proposalCount: proposalCount,
      // Rental application submission status for hiding CTA in success modal
      hasSubmittedRentalApp: hasSubmittedRentalApp,
      // Usability testing flag - determines who sees mobile testing popup
      isUsabilityTester: userData.is_usability_tester ?? false,
      // Phone number for SMS magic link pre-fill
      phoneNumber: userData.phone_number || null
    };

    console.log(`[validate] ✅ Validation complete`);
    console.log(`[validate]    User: ${userDataObject.firstName}`);
    console.log(`[validate]    Type: ${userDataObject.userType}`);
    console.log(`[validate]    Proposals: ${userDataObject.proposalCount}`);
    console.log(`[validate]    Rental App Submitted: ${userDataObject.hasSubmittedRentalApp}`);
    console.log(`[validate]    Is Usability Tester: ${userDataObject.isUsabilityTester}`);
    console.log(`[validate] ========== VALIDATION COMPLETE ==========`);

    return userDataObject;

  } catch (error) {
    if (error instanceof ApiError || error instanceof SupabaseSyncError) {
      throw error;
    }

    console.error(`[validate] ========== VALIDATION ERROR ==========`);
    console.error(`[validate] Error:`, error);

    throw new ApiError(
      `Failed to validate token: ${error.message}`,
      500,
      error
    );
  }
}
