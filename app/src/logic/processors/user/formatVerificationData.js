/**
 * formatVerificationData
 *
 * Processor function to format identity verification data for API submission.
 * Extracts file metadata and prepares the payload structure.
 *
 * @param {Object} params - Verification parameters
 * @param {string} params.documentType - Type of document (e.g., "Driver's License / State ID")
 * @param {File|null} params.selfieFile - Selfie file object
 * @param {File|null} params.frontIdFile - Front ID file object
 * @param {File|null} params.backIdFile - Back ID file object
 * @param {string} params.userId - User ID
 * @returns {Object} Formatted data with file metadata
 *
 * @example
 * const formattedData = formatVerificationData({
 *   documentType: "Driver's License / State ID",
 *   selfieFile: selfieInput.files[0],
 *   frontIdFile: frontIdInput.files[0],
 *   backIdFile: backIdInput.files[0],
 *   userId: 'user123'
 * });
 */
export function formatVerificationData({ documentType, selfieFile, frontIdFile, backIdFile, userId }) {
  return {
    documentType,
    selfie: selfieFile ? formatFileMetadata(selfieFile) : null,
    frontId: frontIdFile ? formatFileMetadata(frontIdFile) : null,
    backId: backIdFile ? formatFileMetadata(backIdFile) : null,
    userId,
  };
}

/**
 * Format file metadata for logging and validation
 *
 * @param {File} file - File object
 * @returns {Object} File metadata
 */
function formatFileMetadata(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeFormatted: formatFileSize(file.size),
  };
}

/**
 * Format file size to human-readable string
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file for identity verification upload
 *
 * @param {File} file - File to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateVerificationFile(file) {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type (must be image)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!file.type.startsWith('image/') || !allowedTypes.some(type => file.type === type || file.type.startsWith('image/'))) {
    return { valid: false, error: 'Please upload an image file (JPG, PNG, WEBP, or HEIC)' };
  }

  // Check file size (max 10MB)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

/**
 * Format verification submission payload for Edge Function
 *
 * @param {Object} params - Submission parameters
 * @param {string} params.documentType - Document type
 * @param {string} params.selfieUrl - Signed URL to uploaded selfie
 * @param {string} params.frontIdUrl - Signed URL to uploaded front ID
 * @param {string} params.backIdUrl - Signed URL to uploaded back ID
 * @returns {Object} Formatted payload for API
 */
export function formatSubmissionPayload({ documentType, selfieUrl, frontIdUrl, backIdUrl }) {
  return {
    documentType,
    selfieUrl,
    frontIdUrl,
    backIdUrl,
  };
}
