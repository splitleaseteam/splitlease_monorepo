/**
 * Supplemental Agreement Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API.
 * Generates the Supplemental Agreement document.
 * Template: supplementalagreement.docx
 *
 * Template Variables (matching Python implementation):
 * - agreement_number, start_date, end_date, weeks_number, guest_allowed, guests_allowed
 * - host_name, listing_description, listing_title, spacedetails, location, type_of_space
 * - supplement_number, image1, image2, image3
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupplementalPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateSupplementalPayload } from '../lib/validators.ts';
import { formatDate } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';
import { uploadToSupabaseStorage } from '../lib/supabaseStorage.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateSupplemental(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generateSupplemental] Starting document generation...');

  // Validate payload (Python-compatible format)
  const validatedPayload = validateSupplementalPayload(payload);
  const agreementNumber = validatedPayload['Agreement Number'];
  console.log(`[generateSupplemental] Agreement: ${agreementNumber}`);

  // Prepare template data (mapping to Python template variables)
  const templateData = prepareTemplateData(validatedPayload);

  // Prepare image URLs for embedding
  const imageUrls: Record<string, string> = {};
  if (validatedPayload['image1']) {
    imageUrls.image1 = validatedPayload['image1'];
  }
  if (validatedPayload['image2']) {
    imageUrls.image2 = validatedPayload['image2'];
  }
  if (validatedPayload['image3']) {
    imageUrls.image3 = validatedPayload['image3'];
  }

  // Render the template with images
  const documentContent = await downloadAndRenderTemplate(
    supabase,
    TEMPLATE_PATHS.supplemental,
    templateData,
    {
      useImages: true,
      imageUrls,
    }
  );

  // Generate filename (matching Python output format)
  const filename = `supplement_agreement-${agreementNumber}.docx`;

  // Perform uploads
  const [driveUploadResult, storageUploadResult] = await Promise.all([
    uploadToGoogleDrive(documentContent, filename),
    uploadToSupabaseStorage(supabase, documentContent, filename, 'supplemental_agreement'),
  ]);

  // Log failures for debugging
  if (!driveUploadResult.success) {
    console.error(`[generateSupplemental] Drive upload failed: ${driveUploadResult.error}`);
  }
  if (!storageUploadResult.success) {
    console.error(`[generateSupplemental] Supabase upload failed: ${storageUploadResult.error}`);
  }

  // FAIL-SAFE LOGIC:
  if (!driveUploadResult.success && !storageUploadResult.success) {
    const errorMsg = `Failed to upload Supplemental Agreement: Drive (${driveUploadResult.error}) | Supabase (${storageUploadResult.error})`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
      returned_error: 'yes',
    };
  }

  // Construct response
  const result: DocumentResult = {
    success: true,
    filename,
    driveUrl: driveUploadResult.success ? driveUploadResult.webViewLink : storageUploadResult.publicUrl,
    drive_url: driveUploadResult.success ? driveUploadResult.webViewLink : storageUploadResult.publicUrl,
    web_view_link: driveUploadResult.success ? driveUploadResult.webViewLink : storageUploadResult.publicUrl,
    fileId: storageUploadResult.success ? storageUploadResult.filePath : driveUploadResult.fileId,
    file_id: storageUploadResult.success ? storageUploadResult.filePath : driveUploadResult.fileId,
    returned_error: 'no',
  };

  // Notification logic
  if (!driveUploadResult.success) {
    await notifySlack(`[WARNING] Supplemental Agreement uploaded to Supabase ONLY (Drive failed): ${filename}`, true);
  } else {
    await notifySlack(`Successfully created Supplemental Agreement: ${filename}`);
  }

  return result;
}

// ================================================
// TEMPLATE DATA PREPARATION
// ================================================

/**
 * Maps Python-style payload to template variables.
 * Template variables match the Python docxtpl template exactly.
 */
function prepareTemplateData(payload: SupplementalPayload): Record<string, string> {
  return {
    agreement_number: payload['Agreement Number'],
    start_date: formatDate(payload['Check in Date']),
    end_date: formatDate(payload['Check Out Date']),
    weeks_number: payload['Number of weeks'] || '',
    guest_allowed: payload['Guests Allowed'] || '',
    guests_allowed: payload['Guests Allowed'] || '', // Duplicate key for template compatibility
    host_name: payload['Host Name'] || '',
    listing_description: payload['Listing Description'] || '',
    listing_title: payload['Listing Title'] || '',
    spacedetails: payload['Space Details'] || '',
    location: payload['Location'] || '',
    type_of_space: payload['Type of Space'] || '',
    supplement_number: payload['Supplemental Number'] || '',
    image1: payload['image1'] || '',
    image2: payload['image2'] || '',
    image3: payload['image3'] || '',
  };
}
