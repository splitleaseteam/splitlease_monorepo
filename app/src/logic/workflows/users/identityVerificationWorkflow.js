/**
 * identityVerificationWorkflow
 *
 * Orchestrates the complete identity verification submission process.
 * Handles file uploads to Supabase Storage and submission to Edge Function.
 *
 * Workflow Steps:
 * 1. Upload selfie to storage
 * 2. Upload front ID to storage
 * 3. Upload back ID to storage
 * 4. Submit verification via Edge Function
 *
 * @param {Object} params - Workflow parameters
 * @param {string} params.userId - User ID (Supabase auth user ID)
 * @param {string} params.documentType - Type of document being submitted
 * @param {File} params.selfieFile - Selfie file to upload
 * @param {File} params.frontIdFile - Front ID file to upload
 * @param {File} params.backIdFile - Back ID file to upload
 * @param {Object} params.supabase - Supabase client instance
 * @param {Function} [params.onProgress] - Optional callback for progress updates
 * @returns {Promise<Object>} Result from Edge Function
 *
 * @example
 * const result = await identityVerificationWorkflow({
 *   userId: 'abc123',
 *   documentType: "Driver's License / State ID",
 *   selfieFile,
 *   frontIdFile,
 *   backIdFile,
 *   supabase,
 *   onProgress: (message) => setStatus(message)
 * });
 */
export async function identityVerificationWorkflow({
  userId,
  documentType,
  selfieFile,
  frontIdFile,
  backIdFile,
  supabase,
  onProgress,
}) {
  const notifyProgress = onProgress || (() => {});

  // Step 1: Upload selfie
  notifyProgress('Uploading selfie...');
  const selfieUrl = await uploadDocument(supabase, userId, 'selfie', selfieFile);

  // Step 2: Upload front ID
  notifyProgress('Uploading front ID...');
  const frontIdUrl = await uploadDocument(supabase, userId, 'front_id', frontIdFile);

  // Step 3: Upload back ID
  notifyProgress('Uploading back ID...');
  const backIdUrl = await uploadDocument(supabase, userId, 'back_id', backIdFile);

  // Step 4: Submit verification via Edge Function
  notifyProgress('Submitting verification...');
  const result = await submitVerification(supabase, {
    documentType,
    selfieUrl,
    frontIdUrl,
    backIdUrl,
  });

  notifyProgress('Verification submitted successfully!');

  return result;
}

/**
 * Upload a single document to Supabase Storage
 *
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID for folder path
 * @param {string} documentType - Type of document (selfie, front_id, back_id)
 * @param {File} file - File to upload
 * @returns {Promise<string>} Signed URL to the uploaded file
 */
async function uploadDocument(supabase, userId, documentType, file) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${documentType}_${timestamp}.${extension}`;

  // Upload file to storage
  const { data: _data, error } = await supabase.storage
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
 * Submit verification to Edge Function
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} payload - Verification payload
 * @returns {Promise<Object>} Edge Function response
 */
async function submitVerification(supabase, payload) {
  const { data, error } = await supabase.functions.invoke('identity-verification-submit', {
    body: {
      action: 'submit_verification',
      payload,
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

/**
 * Get current verification status for a user
 *
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Verification status
 */
export async function getVerificationStatusWorkflow(supabase) {
  const { data, error } = await supabase.functions.invoke('identity-verification-submit', {
    body: {
      action: 'get_status',
      payload: {},
    },
  });

  if (error) {
    throw new Error(`Failed to get verification status: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to get verification status');
  }

  return data.data;
}
