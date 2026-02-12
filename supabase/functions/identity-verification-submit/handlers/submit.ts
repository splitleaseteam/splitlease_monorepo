/**
 * Submit Identity Verification Handler
 * Split Lease - Identity Verification Edge Function
 *
 * Handles submission of identity verification documents.
 * Updates user record with document URLs and submission timestamp.
 * Sends confirmation email upon successful submission.
 *
 * Payload:
 * - documentType: string (e.g., "Driver's License / State ID")
 * - selfieUrl: string (signed URL to selfie in storage)
 * - frontIdUrl: string (signed URL to front ID in storage)
 * - backIdUrl: string (signed URL to back ID in storage)
 */

import { createClient } from '@supabase/supabase-js';
import { ValidationError } from '../../_shared/errors.ts';
import { sendEmail, EMAIL_TEMPLATES } from '../../_shared/emailUtils.ts';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SubmitVerificationPayload {
  readonly documentType: string;
  readonly selfieUrl: string;
  readonly frontIdUrl: string;
  readonly backIdUrl: string;
}

interface User {
  readonly id: string;
  readonly email?: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ALLOWED_DOCUMENT_TYPES = [
  "Driver's License / State ID",
  "Passport",
  "National ID Card",
  "Residence Permit",
] as const;

// ─────────────────────────────────────────────────────────────
// Validation Functions (Pure)
// ─────────────────────────────────────────────────────────────

function validatePayload(payload: unknown): SubmitVerificationPayload {
  const p = payload as Record<string, unknown>;

  if (!p.documentType || typeof p.documentType !== 'string') {
    throw new ValidationError('Missing or invalid documentType');
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(p.documentType as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    throw new ValidationError(
      `Invalid documentType. Allowed values: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
    );
  }

  if (!p.selfieUrl || typeof p.selfieUrl !== 'string') {
    throw new ValidationError('Missing or invalid selfieUrl');
  }

  if (!p.frontIdUrl || typeof p.frontIdUrl !== 'string') {
    throw new ValidationError('Missing or invalid frontIdUrl');
  }

  if (!p.backIdUrl || typeof p.backIdUrl !== 'string') {
    throw new ValidationError('Missing or invalid backIdUrl');
  }

  return {
    documentType: p.documentType,
    selfieUrl: p.selfieUrl,
    frontIdUrl: p.frontIdUrl,
    backIdUrl: p.backIdUrl,
  };
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export async function handleSubmitVerification(
  supabaseUrl: string,
  supabaseServiceKey: string,
  user: User,
  payload: unknown
): Promise<{ submitted: boolean; submittedAt: string }> {
  console.log('[submit] Starting identity verification submission');
  console.log('[submit] User ID:', user.id);

  // Validate payload
  const validatedPayload = validatePayload(payload);
  console.log('[submit] Validated payload, document type:', validatedPayload.documentType);

  // Create admin client for database operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Get current timestamp
  const submittedAt = new Date().toISOString();

  // ─────────────────────────────────────────────────────────
  // Step 1: Fetch current user data to check profile photo
  // ─────────────────────────────────────────────────────────

  const { data: currentUserData, error: fetchError } = await supabaseAdmin
    .from('user')
    .select('supabase_user_id, profile_photo_url, first_name, email')
    .eq('supabase_user_id', user.id)
    .single();

  if (fetchError) {
    console.error('[submit] Error fetching user data:', fetchError);
    throw new Error(`Failed to fetch user data: ${fetchError.message}`);
  }

  console.log('[submit] Current user data fetched');

  // ─────────────────────────────────────────────────────────
  // Step 2: Prepare update data
  // ─────────────────────────────────────────────────────────

  const updateData: Record<string, unknown> = {
    identity_document_type: validatedPayload.documentType,
    selfie_url: validatedPayload.selfieUrl,
    front_id_url: validatedPayload.frontIdUrl,
    back_id_url: validatedPayload.backIdUrl,
    identity_submitted_at: submittedAt,
    // Reset verified status when new documents are submitted
    identity_verified: false,
    identity_verified_at: null,
  };

  // Update profile photo with selfie if currently empty
  if (!currentUserData.profile_photo_url) {
    console.log('[submit] Profile photo empty, updating with selfie URL');
    updateData.profile_photo_url = validatedPayload.selfieUrl;
  }

  // ─────────────────────────────────────────────────────────
  // Step 3: Update user record
  // ─────────────────────────────────────────────────────────

  const { error: updateError } = await supabaseAdmin
    .from('user')
    .update(updateData)
    .eq('supabase_user_id', user.id);

  if (updateError) {
    console.error('[submit] Error updating user:', updateError);
    throw new Error(`Failed to update user record: ${updateError.message}`);
  }

  console.log('[submit] User record updated successfully');

  // ─────────────────────────────────────────────────────────
  // Step 4: Send confirmation email (fire and forget)
  // ─────────────────────────────────────────────────────────

  const userEmail = currentUserData.email || user.email;
  const firstName = currentUserData.first_name || 'there';

  if (userEmail) {
    console.log('[submit] Sending confirmation email to:', userEmail);

    // Fire and forget - don't await, don't fail if email fails
    sendVerificationSubmittedEmail(userEmail, firstName).catch((error) => {
      console.error('[submit] Failed to send confirmation email:', error);
    });
  }

  console.log('[submit] Identity verification submission complete');

  return {
    submitted: true,
    submittedAt,
  };
}

// ─────────────────────────────────────────────────────────────
// Email Helper
// ─────────────────────────────────────────────────────────────

async function sendVerificationSubmittedEmail(
  email: string,
  firstName: string
): Promise<void> {
  await sendEmail({
    templateId: EMAIL_TEMPLATES.BASIC_EMAIL,
    toEmail: email,
    toName: firstName,
    subject: 'Identity Verification Submitted - Split Lease',
    variables: {
      first_name: firstName,
      body_intro: 'Thank you for submitting your identity verification documents.',
      body_main: `We have received the following:
• Your selfie photo
• Front of your ID document
• Back of your ID document

Our team will review your documents within 24-48 hours. You will receive another email once the verification is complete.

If you have any questions, please don't hesitate to contact our support team.`,
      button_text: 'View Your Profile',
      button_url: 'https://split.lease/account-profile',
    },
  });
}
