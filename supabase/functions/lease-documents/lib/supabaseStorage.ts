/**
 * Supabase Storage Uploader for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Alternative to Google Drive - stores generated documents in Supabase Storage.
 * Documents are stored in the 'generated-documents' bucket.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ================================================
// TYPES
// ================================================

export interface StorageUploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

// ================================================
// CONSTANTS
// ================================================

const BUCKET_NAME = 'generated-documents';

// ================================================
// SUPABASE STORAGE UPLOAD
// ================================================

/**
 * Upload a file to Supabase Storage.
 *
 * @param supabase - Supabase client with service role key
 * @param fileContent - The file content as Uint8Array
 * @param fileName - The name for the file
 * @param folder - Optional folder path (e.g., 'host_payout', 'supplemental')
 * @returns Upload result with file path and public URL
 */
export async function uploadToSupabaseStorage(
  supabase: SupabaseClient,
  fileContent: Uint8Array,
  fileName: string,
  folder?: string
): Promise<StorageUploadResult> {
  // Build file path with optional folder and timestamp for uniqueness
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueFileName = `${timestamp}_${fileName}`;
  const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

  console.log(`[supabaseStorage] Uploading file: ${filePath}`);

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileContent, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (error) {
      console.error(`[supabaseStorage] Upload failed: ${error.message}`);
      return {
        success: false,
        error: `Storage upload failed: ${error.message}`,
      };
    }

    // Get the public URL (if bucket is public) or signed URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // If bucket is private, create a signed URL instead (valid for 7 days)
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    const downloadUrl = signedUrlData?.signedUrl || urlData?.publicUrl;

    console.log(`[supabaseStorage] Upload successful: ${filePath}`);

    return {
      success: true,
      filePath: data.path,
      publicUrl: downloadUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[supabaseStorage] Upload error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFromSupabaseStorage(
  supabase: SupabaseClient,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error(`[supabaseStorage] Delete failed: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[supabaseStorage] Delete error: ${error}`);
    return false;
  }
}
