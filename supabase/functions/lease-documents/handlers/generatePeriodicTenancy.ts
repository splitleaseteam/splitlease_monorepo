/**
 * Periodic Tenancy Agreement Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API.
 * Generates the Periodic Tenancy Agreement document.
 * Template: periodictenancyagreement.docx
 *
 * Template Variables (matching Python implementation):
 * - agreement_number, start_date, end_date, last_date, check_in, check_out
 * - week_duration, guests_allowed, host_name, guest_name
 * - supplemental_number, credit_card_form_number, payout_number
 * - cancellation_policy_rest, damage_deposit
 * - listing_title, spacedetails, listing_description, location, type_of_space
 * - House_rules_items, image1, image2, image3
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { PeriodicTenancyPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validatePeriodicTenancyPayload } from '../lib/validators.ts';
import { formatDate, formatHouseRules } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';
import { uploadToSupabaseStorage } from '../lib/supabaseStorage.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGeneratePeriodicTenancy(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generatePeriodicTenancy] Starting document generation...');

  // Validate payload (Python-compatible format)
  const validatedPayload = validatePeriodicTenancyPayload(payload);
  const agreementNumber = validatedPayload['Agreement Number'];
  console.log(`[generatePeriodicTenancy] Agreement: ${agreementNumber}`);

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
    TEMPLATE_PATHS.periodicTenancy,
    templateData,
    {
      useImages: Object.keys(imageUrls).length > 0,
      imageUrls,
    }
  );

  // Generate filename (matching Python output format)
  const filename = `periodic_tenancy_agreement-${agreementNumber}.docx`;

  const [driveUploadResult, storageUploadResult] = await Promise.all([
    uploadToGoogleDrive(documentContent, filename),
    uploadToSupabaseStorage(supabase, documentContent, filename, 'periodic_tenancy'),
  ]);

  const uploadErrors = [
    driveUploadResult.success ? null : `Drive upload failed: ${driveUploadResult.error}`,
    storageUploadResult.success ? null : `Supabase upload failed: ${storageUploadResult.error}`,
  ].filter(Boolean);

  if (uploadErrors.length > 0) {
    const errorMsg = `Failed to upload Periodic Tenancy Agreement: ${uploadErrors.join(' | ')}`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
      returned_error: 'yes',
    };
  }

  // Success notification
  await notifySlack(`Successfully created Periodic Tenancy Agreement: ${filename}`);

  return {
    success: true,
    filename,
    driveUrl: driveUploadResult.webViewLink,
    drive_url: driveUploadResult.webViewLink, // Python compatibility alias
    web_view_link: driveUploadResult.webViewLink, // Python compatibility alias
    fileId: storageUploadResult.filePath,
    file_id: storageUploadResult.filePath, // Python compatibility alias
    returned_error: 'no',
  };
}

// ================================================
// TEMPLATE DATA PREPARATION
// ================================================

/**
 * Maps Python-style payload to template variables.
 * Template variables match the Python docxtpl template exactly.
 */
function prepareTemplateData(payload: PeriodicTenancyPayload): Record<string, string> {
  return {
    agreement_number: payload['Agreement Number'],
    start_date: formatDate(payload['Check in Date']),
    end_date: formatDate(payload['Check Out Date']),
    last_date: formatDate(payload['Check Out Date']), // Same as end_date per Python
    check_in: payload['Check In Day'] || '',
    check_out: payload['Check Out Day'] || '',
    week_duration: payload['Number of weeks'] || '',
    guests_allowed: payload['Guests Allowed'] || '',
    host_name: payload['Host name'] || '', // lowercase 'name' per Python
    guest_name: payload['Guest name'] || '', // lowercase 'name' per Python
    supplemental_number: payload['Supplemental Number'] || '',
    credit_card_form_number: payload['Authorization Card Number'] || '',
    payout_number: payload['Host Payout Schedule Number'] || '',
    cancellation_policy_rest: payload['Extra Requests on Cancellation Policy'] || 'N/A',
    damage_deposit: payload['Damage Deposit'] || '',
    listing_title: payload['Listing Title'] || '',
    spacedetails: payload['Space Details'] || '',
    listing_description: payload['Listing Description'] || '',
    location: payload['Location'] || '',
    type_of_space: payload['Type of Space'] || '',
    House_rules_items: formatHouseRules(payload['House Rules']),
  };
}
