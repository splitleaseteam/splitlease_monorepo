/**
 * Identity Verification Service
 *
 * Frontend API client for identity verification operations.
 * Handles file uploads to Supabase Storage and Edge Function calls.
 *
 * Uses the identityVerificationWorkflow from logic layer for the complete flow,
 * but also exposes individual functions for flexibility.
 */

import { supabase } from '../supabase.js';
import { identityVerificationWorkflow, getVerificationStatusWorkflow } from '../../logic/workflows/users/identityVerificationWorkflow.js';

// ─────────────────────────────────────────────────────────────
// Main Service Functions
// ─────────────────────────────────────────────────────────────

/**
 * Submit complete identity verification with files
 *
 * This is the main function to use for submitting identity verification.
 * It handles uploading all files to storage and then submitting to the Edge Function.
 *
 * @param {Object} params - Verification parameters
 * @param {string} params.userId - User ID (Supabase auth user ID)
 * @param {string} params.documentType - Type of document
 * @param {File} params.selfieFile - Selfie file
 * @param {File} params.frontIdFile - Front ID file
 * @param {File} params.backIdFile - Back ID file
 * @param {Function} [params.onProgress] - Optional progress callback
 * @returns {Promise<Object>} Result with submitted status and timestamp
 *
 * @example
 * const result = await submitIdentityVerification({
 *   userId: 'abc123',
 *   documentType: "Driver's License / State ID",
 *   selfieFile,
 *   frontIdFile,
 *   backIdFile,
 *   onProgress: (msg) => console.log(msg)
 * });
 */
export async function submitIdentityVerification({
  userId,
  documentType,
  selfieFile,
  frontIdFile,
  backIdFile,
  onProgress,
}) {
  // Use the workflow from the logic layer
  return identityVerificationWorkflow({
    userId,
    documentType,
    selfieFile,
    frontIdFile,
    backIdFile,
    supabase,
    onProgress,
  });
}

/**
 * Get current identity verification status
 *
 * @returns {Promise<Object>} Verification status object
 *
 * @example
 * const status = await getIdentityVerificationStatus();
 * // Returns: { submitted: true, verified: false, submittedAt: '2024-01-15T...', ... }
 */
export async function getIdentityVerificationStatus() {
  return getVerificationStatusWorkflow(supabase);
}

// ─────────────────────────────────────────────────────────────
// Low-Level Functions (for advanced use)
// ─────────────────────────────────────────────────────────────

/**
 * Upload a single identity document to Supabase Storage
 *
 * @param {string} userId - User ID for folder path
 * @param {string} documentType - Type of document ('selfie', 'front_id', 'back_id')
 * @param {File} file - File to upload
 * @returns {Promise<string>} Signed URL to the uploaded file
 */
export async function uploadIdentityDocument(userId, documentType, file) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${documentType}_${timestamp}.${extension}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from('identity-documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload ${documentType}: ${error.message}`);
  }

  // Get signed URL (bucket is private)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('identity-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry

  if (urlError) {
    throw new Error(`Failed to get signed URL for ${documentType}: ${urlError.message}`);
  }

  return urlData.signedUrl;
}

/**
 * Submit verification to Edge Function (after files are already uploaded)
 *
 * Use this if you've already uploaded files separately and have the signed URLs.
 *
 * @param {Object} params - Submission parameters
 * @param {string} params.documentType - Document type
 * @param {string} params.selfieUrl - Signed URL to selfie
 * @param {string} params.frontIdUrl - Signed URL to front ID
 * @param {string} params.backIdUrl - Signed URL to back ID
 * @returns {Promise<Object>} Edge Function response
 */
export async function submitVerificationWithUrls({
  documentType,
  selfieUrl,
  frontIdUrl,
  backIdUrl,
}) {
  const { data, error } = await supabase.functions.invoke('identity-verification-submit', {
    body: {
      action: 'submit_verification',
      payload: {
        documentType,
        selfieUrl,
        frontIdUrl,
        backIdUrl,
      },
    },
  });

  if (error) {
    throw new Error(`Verification submission failed: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Verification submission failed');
  }

  return data.data;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Delete an identity document from storage
 *
 * @param {string} path - Full path to the file in storage
 * @returns {Promise<void>}
 */
export async function deleteIdentityDocument(path) {
  const { error } = await supabase.storage
    .from('identity-documents')
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
