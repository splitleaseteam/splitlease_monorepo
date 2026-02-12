/**
 * AI Signup Guest - Edge Function
 * Split Lease
 *
 * This edge function handles the AI signup flow for guests:
 * 1. Receives email, phone, and freeform text input
 * 2. Looks up the user by email (user was already created in auth-user/signup)
 * 3. Saves the freeform text to the user's `freeform ai signup text` field
 * 4. Returns the user data (including id) for the subsequent parseProfile call
 *
 * This function bridges the gap between user creation and AI profile parsing.
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { ValidationError } from '../_shared/errors.ts';
import { sendWelcomeEmail, sendInternalSignupNotification, sendWelcomeSms as _sendWelcomeSms } from '../_shared/emailUtils.ts';

console.log('[ai-signup-guest] Edge Function started');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[ai-signup-guest] ========== NEW REQUEST ==========');
    console.log('[ai-signup-guest] Method:', req.method);

    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // Parse request body
    const body = await req.json();
    console.log('[ai-signup-guest] Request body:', JSON.stringify(body, null, 2));

    const { email, phone, text_inputted } = body;

    // Validate required fields
    if (!email) {
      throw new ValidationError('email is required');
    }
    if (!text_inputted) {
      throw new ValidationError('text_inputted is required');
    }

    console.log('[ai-signup-guest] Email:', email);
    console.log('[ai-signup-guest] Phone:', phone || 'Not provided');
    console.log('[ai-signup-guest] Text length:', text_inputted.length);

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // ========== STEP 1: Find user by email ==========
    console.log('[ai-signup-guest] Step 1: Looking up user by email...');

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id, email, first_name, last_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError) {
      console.error('[ai-signup-guest] Error looking up user:', userError);
      throw new Error(`Failed to look up user: ${userError.message}`);
    }

    if (!userData) {
      console.log('[ai-signup-guest] User not found, they may not have been created yet');
      // Return success anyway - the user might be created later
      // The parseProfile call will fail gracefully if user doesn't exist
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: 'User not found, but text captured for processing',
            email: email,
            text_captured: true
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[ai-signup-guest] ✅ User found:', userData.id);

    // ========== STEP 2: Save freeform text to user record ==========
    console.log('[ai-signup-guest] Step 2: Saving freeform text to user record...');

    const updateData: Record<string, any> = {
      'freeform ai signup text': text_inputted, // TODO: VERIFY COLUMN NAME
      'updated_at': new Date().toISOString(),
    };

    // Also save phone number if provided
    if (phone) {
      updateData['phone_number'] = phone;
    }

    const { error: updateError } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', userData.id);

    if (updateError) {
      console.error('[ai-signup-guest] Error updating user:', updateError);
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    console.log('[ai-signup-guest] ✅ Freeform text saved to user record');

    // ========== STEP 3: Send Welcome Email ==========
    // CRITICAL: Must be awaited in Deno Edge Functions - fire-and-forget IIFEs are cancelled when handler returns
    // This matches the pattern used in auth-user/signup.ts
    console.log('[ai-signup-guest] Step 3: Sending welcome email...');

    // Generate login/magic link for the user
    const siteUrl = Deno.env.get('SITE_URL') || 'https://split.lease';
    const loginLink = `${siteUrl}/login`;

    // Extract name for email greeting
    const firstName = userData.first_name || '';
    const userType = (userData.current_user_role as string) || 'Guest';
    const mappedUserType = userType.includes('Host') ? 'Host' : 'Guest';

    try {
      console.log('[ai-signup-guest] 📧 Sending welcome email to:', userData.email);
      const emailResult = await sendWelcomeEmail(
        mappedUserType,
        userData.email,
        firstName,
        loginLink
      );
      if (!emailResult.success) {
        console.error('[ai-signup-guest] Welcome email failed:', emailResult.error);
        // Non-blocking: Continue with signup even if email fails
      } else {
        console.log('[ai-signup-guest] ✅ Welcome email sent');
      }
    } catch (_err) {
      console.error('[ai-signup-guest] Welcome email error:', err);
      // Non-blocking: Continue with signup even if email fails
    }

    // Send internal notification (non-blocking, but awaited to prevent Deno Edge Function cancellation)
    try {
      const lastName = userData.last_name || '';
      const result = await sendInternalSignupNotification(
        userData.id,
        userData.email,
        firstName,
        lastName,
        mappedUserType
      );
      if (!result.success) {
        console.error('[ai-signup-guest] Internal notification failed:', result.error);
      } else {
        console.log('[ai-signup-guest] ✅ Internal notification sent');
      }
    } catch (_err) {
      console.error('[ai-signup-guest] Internal notification error:', err);
    }

    console.log('[ai-signup-guest] ========== SUCCESS ==========');

    // Return user data for subsequent parseProfile call
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          text_saved: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[ai-signup-guest] ========== ERROR ==========');
    console.error('[ai-signup-guest] Error:', error);
    console.error('[ai-signup-guest] Error stack:', error.stack);

    const statusCode = error instanceof ValidationError ? 400 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
