/**
 * Host Payout Schedule Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API.
 * Generates the Host Payout Schedule Form document.
 * Template: hostpayoutscheduleform.docx
 *
 * Template Variables (matching Python implementation):
 * - address, agreement_number, host_email, host_name, host_phone, payout_number
 * - date1-13, rent1-13, total1-13, maintenance_fee1-13 (payment entries)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { HostPayoutPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateHostPayoutPayload } from '../lib/validators.ts';
import { formatDate, formatCurrency } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToSupabaseStorage } from '../lib/supabaseStorage.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateHostPayout(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generateHostPayout] Starting document generation...');

  // Validate payload (Python-compatible format)
  const validatedPayload = validateHostPayoutPayload(payload);
  const agreementNumber = validatedPayload['Agreement Number'];
  console.log(`[generateHostPayout] Agreement: ${agreementNumber}`);

  // Prepare template data (mapping to Python template variables)
  const templateData = prepareTemplateData(validatedPayload);

  // Render the template
  const documentContent = await downloadAndRenderTemplate(
    supabase,
    TEMPLATE_PATHS.hostPayout,
    templateData
  );

  // Generate filename (matching Python output format)
  const filename = `host_payout_schedule-${agreementNumber}.docx`;

  // Perform uploads
  const [driveUploadResult, storageUploadResult] = await Promise.all([
    uploadToGoogleDrive(documentContent, filename),
    uploadToSupabaseStorage(supabase, documentContent, filename, 'host_payout'),
  ]);

  // Log failures for debugging
  if (!driveUploadResult.success) {
    console.error(`[generateHostPayout] Drive upload failed: ${driveUploadResult.error}`);
  }
  if (!storageUploadResult.success) {
    console.error(`[generateHostPayout] Supabase upload failed: ${storageUploadResult.error}`);
  }

  // FAIL-SAFE LOGIC:
  if (!driveUploadResult.success && !storageUploadResult.success) {
    const errorMsg = `Failed to upload Host Payout Schedule: Drive (${driveUploadResult.error}) | Supabase (${storageUploadResult.error})`;
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
    await notifySlack(`[WARNING] Host Payout uploaded to Supabase ONLY (Drive failed): ${filename}`, true);
  } else {
    await notifySlack(`Successfully created Host Payout Schedule: ${filename}`);
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
function prepareTemplateData(payload: HostPayoutPayload): Record<string, string> {
  const data: Record<string, string> = {
    address: payload['Address'] || '',
    agreement_number: payload['Agreement Number'],
    host_email: payload['Host Email'] || '',
    host_name: payload['Host Name'] || '',
    host_phone: payload['Host Phone'] || '',
    payout_number: payload['Payout Number'] || '',
  };

  const maintenanceFee = payload['Maintenance Fee'] || '';

  // Add payment schedule data (up to 13 entries)
  // Matches Python's Date1-13, Rent1-13, Total1-13 format
  for (let i = 1; i <= 13; i++) {
    const dateKey = `Date${i}` as keyof HostPayoutPayload;
    const rentKey = `Rent${i}` as keyof HostPayoutPayload;
    const totalKey = `Total${i}` as keyof HostPayoutPayload;

    const dateValue = payload[dateKey];
    const rentValue = payload[rentKey];
    const totalValue = payload[totalKey];

    if (dateValue && rentValue && totalValue) {
      data[`date${i}`] = formatDate(dateValue as string);
      data[`rent${i}`] = formatCurrency(rentValue as string);
      data[`total${i}`] = formatCurrency(totalValue as string);
      // Maintenance fee is the same for all payment rows (Python behavior)
      data[`maintenance_fee${i}`] = formatCurrency(maintenanceFee);
    } else {
      // Empty values for unused rows (Python behavior)
      data[`date${i}`] = '';
      data[`rent${i}`] = '';
      data[`total${i}`] = '';
      data[`maintenance_fee${i}`] = '';
    }
  }

  return data;
}
