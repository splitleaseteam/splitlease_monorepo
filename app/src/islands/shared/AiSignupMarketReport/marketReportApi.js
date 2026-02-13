/**
 * API and communication functions for AI Signup Market Report
 * Handles signup submission, profile parsing, and welcome communications
 */

import { signupUser } from '../../../lib/auth/index.js';
import { extractName, generatePassword } from './marketReportUtils.js';

// ============ COMMUNICATION FUNCTIONS ============

/**
 * Send welcome email to new user (Step 7 from Bubble workflow)
 * Uses the send-email Edge Function with template placeholders
 *
 * Email contains:
 * - Welcome message
 * - Login credentials (email + temporary password)
 * - Magic link button for one-click login
 *
 * IMPORTANT: Uses fetch with keepalive:true to survive page reload/navigation
 * while still allowing Authorization headers (unlike sendBeacon)
 *
 * @param {Object} data - Email data
 * @param {string} data.email - User's email
 * @param {string} data.password - Generated password (SL{Name}77)
 * @param {string} data.magicLink - Magic login link URL
 * @returns {{success: boolean}}
 */
function sendWelcomeEmail(data) {
  console.log('[AiSignupMarketReport] Sending welcome email to:', data.email);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-email`;

  // Build the email body HTML (matches Bubble's CORE-Send Basic Email format)
  // Uses <br> tags for line breaks as expected by the Basic template
  const emailBodyHtml = `Hey <br> <br> You have a new split lease account<br> <br> Sign in using your: <br> email: ${data.email}<br> temporary password: ${data.password} <br> <br> We recommend you change your password to something private. <br> <br> You can reach out to Robert if you have any questions at robert@leasesplit.com or via text at 9376737470.`;

  // Build button HTML for the template
  const buttonHtml = `<a href="${data.magicLink || 'https://splitlease.com/login'}" style="background-color: #291D54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Go to your Account</a>`;

  // Use fetch with keepalive:true - survives page unload AND supports headers
  // Unlike sendBeacon, this allows us to include the Authorization header
  fetch(edgeFunctionUrl, {
    method: 'POST',
    keepalive: true, // Critical: keeps request alive during page navigation
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        // Basic template - flexible for welcome emails
        // From: reference_table.zat_email_html_template_eg_sendbasicemailwf_
        template_id: '1560447575939x331870423481483500',
        to_email: data.email,
        from_email: 'tech@leasesplit.com',
        from_name: 'Split Lease Signup',
        subject: 'New Split Lease Account!',
        variables: {
          // All 13 placeholders expected by the Basic template ($$variable$$ format)
          'to': data.email,
          'from email': 'tech@leasesplit.com',
          'from name': ', "name": "Split Lease Signup"',
          'subject': 'New Split Lease Account!',
          'header': 'Welcome to Split Lease!',
          'body text': emailBodyHtml,
          'button': buttonHtml,
          'year': new Date().getFullYear().toString(),
          'logo url': '/assets/images/sl-logo.png',
          'cc': '',
          'bcc': '',
          'reply_to': '',
          'attachment': '',
        },
        bcc_emails: [
          'splitleaseteam@gmail.com',
          'acquisition-aaaachs52tzodgc5t3o2oeipli@splitlease.slack.com'
        ]
      }
    }),
  }).then(response => {
    if (response.ok) {
      console.log('[AiSignupMarketReport] Welcome email sent successfully');
    } else {
      console.error('[AiSignupMarketReport] Welcome email failed:', response.status);
    }
  }).catch(error => {
    console.error('[AiSignupMarketReport] Welcome email error:', error.message);
  });

  console.log('[AiSignupMarketReport] Welcome email request initiated (keepalive)');
  return { success: true };
}

/**
 * Send internal notification email to customer-acquisition team (Step 5 from Bubble)
 * Alerts the team about new AI signups with user details
 *
 * IMPORTANT: Uses fetch with keepalive:true to survive page reload/navigation
 * while still allowing Authorization headers (unlike sendBeacon)
 *
 * @param {Object} data - Notification data
 * @param {string} data.email - User's email
 * @param {string} data.phone - User's phone (if provided)
 * @param {string} data.name - Extracted name
 * @param {string} data.password - Generated password
 * @param {string} data.freeformText - Original freeform input
 * @returns {{success: boolean}}
 */
function sendInternalNotificationEmail(data) {
  console.log('[AiSignupMarketReport] Sending internal notification email');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-email`;

  // Build plain text body for internal notification
  const emailBody = `Name: ${data.name || 'Not extracted'}
Email: ${data.email}
Phone number: ${data.phone || 'Not provided'}
Their temporary password is: ${data.password}

----
free form text inputted: ${data.freeformText}`;

  // Convert to HTML with line breaks preserved
  const emailBodyHtml = emailBody.replace(/\n/g, '<br>');

  // Use fetch with keepalive:true - survives page unload AND supports headers
  fetch(edgeFunctionUrl, {
    method: 'POST',
    keepalive: true, // Critical: keeps request alive during page navigation
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        // Basic template - flexible for internal notifications
        // From: reference_table.zat_email_html_template_eg_sendbasicemailwf_
        template_id: '1560447575939x331870423481483500',
        // Slack channel email for #customer-acquisition
        to_email: 'acquisition-aaaachs52tzodgc5t3o2oeipli@splitlease.slack.com',
        from_email: 'noreply@splitlease.com',
        from_name: 'Guest AI Signup',
        subject: `${data.name || 'New User'}, ${data.email}, SIGNED UP thru AI signup feature`,
        variables: {
          // All 13 placeholders expected by the Basic template
          'to': 'acquisition-aaaachs52tzodgc5t3o2oeipli@splitlease.slack.com',
          'from email': 'noreply@splitlease.com',
          'from name': ', "name": "Guest AI Signup"',
          'subject': `${data.name || 'New User'}, ${data.email}, SIGNED UP thru AI signup feature`,
          'header': 'New AI Signup',
          'body text': emailBodyHtml,
          'button': '', // No button for internal notification
          'year': new Date().getFullYear().toString(),
          'logo url': '/assets/images/sl-logo.png',
          'cc': '',
          'bcc': '',
          'reply_to': '',
          'attachment': '',
        },
      }
    }),
  }).then(response => {
    if (response.ok) {
      console.log('[AiSignupMarketReport] Internal notification sent successfully');
    } else {
      console.error('[AiSignupMarketReport] Internal notification failed:', response.status);
    }
  }).catch(error => {
    console.error('[AiSignupMarketReport] Internal notification error:', error.message);
  });

  console.log('[AiSignupMarketReport] Internal notification request initiated (keepalive)');
  return { success: true };
}

/**
 * Send welcome SMS to new user (Steps 8/9 from Bubble workflow)
 * Contains login credentials and magic link
 *
 * Uses the public Split Lease SMS number which doesn't require auth
 * IMPORTANT: Uses fetch with keepalive:true to survive page reload/navigation
 * while still allowing Authorization headers (unlike sendBeacon)
 *
 * @param {Object} data - SMS data
 * @param {string} data.phone - User's phone number
 * @param {string} data.email - User's email
 * @param {string} data.password - Generated password
 * @param {string} data.magicLink - Magic login link URL
 * @returns {{success: boolean, skipped?: boolean}}
 */
function sendWelcomeSms(data) {
  if (!data.phone) {
    console.log('[AiSignupMarketReport] No phone number provided, skipping SMS');
    return { success: true, skipped: true };
  }

  console.log('[AiSignupMarketReport] Sending welcome SMS to:', data.phone);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-sms`;

  // Format phone to E.164 (add +1 if needed)
  let formattedPhone = data.phone.replace(/\D/g, ''); // Remove non-digits
  if (formattedPhone.length === 10) {
    formattedPhone = `+1${formattedPhone}`;
  } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
    formattedPhone = `+${formattedPhone}`;
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  const smsBody = `You have a new split lease account. Sign in with your email: ${data.email}. Your temporary password: ${data.password}. Click this link to proceed: ${data.magicLink || 'https://splitlease.com/login'}`;

  // Use fetch with keepalive:true - survives page unload AND supports headers
  fetch(edgeFunctionUrl, {
    method: 'POST',
    keepalive: true, // Critical: keeps request alive during page navigation
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        to: formattedPhone,
        from: '+14155692985', // Public Split Lease SMS number (no auth required)
        body: smsBody
      }
    }),
  }).then(response => {
    if (response.ok) {
      console.log('[AiSignupMarketReport] Welcome SMS sent successfully');
    } else {
      console.error('[AiSignupMarketReport] Welcome SMS failed:', response.status);
    }
  }).catch(error => {
    console.error('[AiSignupMarketReport] Welcome SMS error:', error.message);
  });

  console.log('[AiSignupMarketReport] Welcome SMS request initiated (keepalive)');
  return { success: true };
}

/**
 * Send all welcome communications after successful signup
 * This orchestrates: magic link generation -> email -> SMS -> internal notification
 *
 * IMPORTANT: Uses fetch with keepalive:true for email/SMS to survive page reload
 * while still allowing Authorization headers (required by Edge Functions).
 * Magic link generation is attempted first, but communications are sent
 * regardless (with fallback login URL if magic link fails).
 *
 * @param {Object} data - Communication data
 * @param {string} data.email - User's email
 * @param {string} data.phone - User's phone (optional)
 * @param {string} data.name - Extracted name
 * @param {string} data.password - Generated password (SL{Name}77)
 * @param {string} data.freeformText - Original freeform text
 */
export function sendWelcomeCommunications(data) {
  console.log('[AiSignupMarketReport] ========== SENDING WELCOME COMMUNICATIONS ==========');
  console.log('[AiSignupMarketReport] Email:', data.email);
  console.log('[AiSignupMarketReport] Phone:', data.phone || 'Not provided');
  console.log('[AiSignupMarketReport] Name:', data.name || 'Not extracted');

  // CRITICAL: Send communications IMMEDIATELY with fallback URL
  // DO NOT await magic link - page reloads at 4 seconds and async awaits won't complete
  // The fetch({ keepalive: true }) survives page reload, but only if initiated!
  const fallbackLoginUrl = 'https://splitlease.com/login';

  console.log('[AiSignupMarketReport] Firing communications IMMEDIATELY (no await)');

  // Welcome email to user (Step 7) - FIRE IMMEDIATELY
  sendWelcomeEmail({
    email: data.email,
    password: data.password,
    magicLink: fallbackLoginUrl // Use login URL - user has password
  });

  // Welcome SMS to user (Steps 8/9) - only if phone provided - FIRE IMMEDIATELY
  if (data.phone) {
    sendWelcomeSms({
      phone: data.phone,
      email: data.email,
      password: data.password,
      magicLink: fallbackLoginUrl
    });
  }

  // Internal notification to team (Step 5) - FIRE IMMEDIATELY
  sendInternalNotificationEmail({
    email: data.email,
    phone: data.phone,
    name: data.name,
    password: data.password,
    freeformText: data.freeformText
  });

  console.log('[AiSignupMarketReport] All welcome communications initiated (keepalive fetch)');
}

// ============ PROFILE PARSING FUNCTIONS ============

/**
 * Queue AI profile parsing via Supabase Edge Function
 * This is non-blocking - user doesn't wait for GPT-4 to finish
 *
 * @param {Object} data - Data for queuing
 * @param {string} data.user_id - User ID to parse
 * @param {string} data.email - User email
 * @param {string} data.freeform_text - Freeform text to parse
 * @returns {Promise<Object>} - Queue result with job ID
 */
async function queueProfileParsing(data) {
  console.log('[AiSignupMarketReport] Queuing profile parsing (async)...');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-parse-profile`;

  try {
    // Use queue_and_process to both queue AND process in one call
    // This ensures GPT-4 parsing actually happens (not just queued forever)
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'queue_and_process',
        payload: {
          user_id: data.user_id,
          email: data.email,
          freeform_text: data.freeform_text,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AiSignupMarketReport] Queue error:', errorText);
      // Non-fatal - don't throw, just log
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[AiSignupMarketReport] Profile parsing queued successfully');
    console.log('[AiSignupMarketReport] Job ID:', result.data?.jobId);
    return result;
  } catch (error) {
    console.warn('[AiSignupMarketReport] Queue error (non-fatal):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Submit AI signup via Supabase Edge Function (GUEST endpoint)
 * Also creates a user account with generated password
 *
 * MIGRATED: No more hardcoded API key!
 * UNAUTHENTICATED: Works for guest users without login
 * NEW: Creates user account with password format SL{Name}77
 * ASYNC QUEUE: Profile parsing happens in background (non-blocking)
 * API key is now stored server-side in Supabase Secrets
 *
 * @param {Object} data - Signup data
 * @param {string} data.email - User email
 * @param {string} data.phone - User phone (optional)
 * @param {string} data.marketResearchText - The market research description
 * @param {string} data.name - Extracted name for account creation
 * @returns {Promise<Object>} - Result with success status and data
 */
export async function submitSignup(data) {
  // Validate required fields
  if (!data.email) {
    console.error('[AiSignupMarketReport] Error: Missing email');
    throw new Error('Email is required');
  }

  if (!data.marketResearchText) {
    console.error('[AiSignupMarketReport] Error: Missing market research text');
    throw new Error('Market research description is required');
  }

  // Extract name from text or email for password generation
  const extractedName = data.name || extractName(data.marketResearchText, data.email);
  const generatedPassword = generatePassword(extractedName);

  console.log('[AiSignupMarketReport] ========== SIGNUP REQUEST ==========');
  console.log('[AiSignupMarketReport] Email:', data.email);
  console.log('[AiSignupMarketReport] Phone:', data.phone || 'Not provided');
  console.log('[AiSignupMarketReport] Extracted Name:', extractedName || 'Not found (using default)');
  console.log('[AiSignupMarketReport] Generated Password:', generatedPassword);
  console.log('[AiSignupMarketReport] Text length:', data.marketResearchText.length);
  console.log('[AiSignupMarketReport] ================================================================');

  // ========== STEP 1: Create User Account ==========
  console.log('[AiSignupMarketReport] Step 1: Creating user account...');

  let signupResult = null;

  try {
    signupResult = await signupUser(
      data.email,
      generatedPassword,
      generatedPassword, // retype (same as password)
      {
        firstName: extractedName || 'Guest',
        lastName: '', // Not available from freeform text
        userType: 'Guest',
        phoneNumber: data.phone || ''
      }
    );

    if (signupResult.success) {
      console.log('[AiSignupMarketReport] User account created successfully');
      console.log('[AiSignupMarketReport] User ID:', signupResult.user_id);
    } else {
      // Check if the error is because email already exists
      if (signupResult.error?.includes('already in use') ||
          signupResult.error?.includes('already registered') ||
          signupResult.error?.includes('USED_EMAIL')) {
        console.log('[AiSignupMarketReport] User already exists - need to login first');
        // Return special flag for email already exists
        return {
          success: false,
          emailAlreadyExists: true,
          email: data.email,
          marketResearchText: data.marketResearchText,
          error: 'An account with this email already exists. Please log in to continue.',
        };
      } else {
        console.warn('[AiSignupMarketReport] Account creation failed:', signupResult.error);
        throw new Error(signupResult.error || 'Account creation failed');
      }
    }
  } catch (signupError) {
    // Check for email exists error from exception
    if (signupError.message?.includes('already in use') ||
        signupError.message?.includes('already registered') ||
        signupError.message?.includes('USED_EMAIL')) {
      console.log('[AiSignupMarketReport] User already exists (from exception) - need to login first');
      return {
        success: false,
        emailAlreadyExists: true,
        email: data.email,
        marketResearchText: data.marketResearchText,
        error: 'An account with this email already exists. Please log in to continue.',
      };
    }
    console.error('[AiSignupMarketReport] Account creation error:', signupError.message);
    throw signupError;
  }

  // ========== STEP 2: Submit Market Research (save freeform text) ==========
  console.log('[AiSignupMarketReport] Step 2: Submitting market research...');

  // Get Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-signup-guest`;

  console.log('[AiSignupMarketReport] Edge Function URL:', edgeFunctionUrl);

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        phone: data.phone || '',
        text_inputted: data.marketResearchText,
      }),
    });

    console.log('[AiSignupMarketReport] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AiSignupMarketReport] ========== ERROR RESPONSE ==========');
      console.error('[AiSignupMarketReport] Status:', response.status);
      console.error('[AiSignupMarketReport] Response Body:', errorText);
      console.error('[AiSignupMarketReport] ===========================================');

      let errorMessage = 'Failed to submit signup';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch (_e) {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[AiSignupMarketReport] ========== SUCCESS ==========');
    console.log('[AiSignupMarketReport] Market research submitted successfully');
    console.log('[AiSignupMarketReport] Result:', JSON.stringify(result, null, 2));
    console.log('[AiSignupMarketReport] ================================');

    // ========== STEP 3: Queue Profile Parsing (ASYNC - Non-blocking) ==========
    // User doesn't wait for GPT-4 - it happens in background
    console.log('[AiSignupMarketReport] Step 3: Queuing profile parsing (async)...');

    const userId = signupResult?.user_id || result.data?.id;
    if (userId) {
      // Queue the parsing job - this returns immediately
      queueProfileParsing({
        user_id: userId,
        email: data.email,
        freeform_text: data.marketResearchText,
      }).then(queueResult => {
        if (queueResult?.success) {
          console.log('[AiSignupMarketReport] Parsing job queued:', queueResult.data?.jobId);
        } else {
          console.warn('[AiSignupMarketReport] Failed to queue parsing (non-fatal)');
        }
      }).catch(err => {
        console.warn('[AiSignupMarketReport] Queue error (non-fatal):', err.message);
      });
    } else {
      console.warn('[AiSignupMarketReport] No user ID for queuing profile parsing');
    }

    // ========== STEP 4: Welcome emails now sent from backend ==========
    // The ai-signup-guest Edge Function now handles welcome emails
    // This ensures emails are awaited properly and not cancelled by Deno Edge Function termination
    console.log('[AiSignupMarketReport] Step 4: Welcome emails handled by backend Edge Function');

    return {
      success: true,
      data: result.data,
      generatedPassword: generatedPassword, // Include for reference (will be sent via email)
      extractedName: extractedName,
      isAsync: true, // Flag indicating parsing is happening in background
    };
  } catch (error) {
    console.error('[AiSignupMarketReport] ========== EXCEPTION ==========');
    console.error('[AiSignupMarketReport] Error:', error);
    console.error('[AiSignupMarketReport] Error message:', error.message);
    console.error('[AiSignupMarketReport] ==================================');
    throw error;
  }
}

/**
 * Parse user profile using AI (GPT-4)
 * Calls the bubble-proxy edge function with parse_profile action
 *
 * This extracts structured data from freeform text:
 * - Biography, Special Needs, Need for Space, Reasons to Host
 * - Credit Score, Name, Transportation
 * - Preferred boroughs, neighborhoods, days, weekly schedule
 *
 * Also auto-favorites listings that match user preferences
 *
 * @param {Object} data - Data for parsing
 * @param {string} data.user_id - User ID to update
 * @param {string} data.email - User email
 * @param {string} data.text_inputted - Freeform text to parse
 * @returns {Promise<Object>} - Parsing result with extracted data
 */
export async function parseProfileWithAI(data) {
  if (!data.user_id) {
    console.warn('[AiSignupMarketReport] Skipping profile parsing - no user_id');
    return null;
  }

  if (!data.text_inputted) {
    console.warn('[AiSignupMarketReport] Skipping profile parsing - no text_inputted');
    return null;
  }

  console.log('[AiSignupMarketReport] ========== PARSE PROFILE REQUEST ==========');
  console.log('[AiSignupMarketReport] User ID:', data.user_id);
  console.log('[AiSignupMarketReport] Email:', data.email);
  console.log('[AiSignupMarketReport] Text length:', data.text_inputted.length);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcfifybkaddcoimjroca.supabase.co';
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/bubble-proxy`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'parse_profile',
        payload: {
          user_id: data.user_id,
          email: data.email,
          text_inputted: data.text_inputted,
        },
      }),
    });

    console.log('[AiSignupMarketReport] Parse response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AiSignupMarketReport] Parse error response:', errorText);
      throw new Error(`Failed to parse profile: ${response.status}`);
    }

    const result = await response.json();
    console.log('[AiSignupMarketReport] Parse result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('[AiSignupMarketReport] Parse profile error:', error);
    throw error;
  }
}
