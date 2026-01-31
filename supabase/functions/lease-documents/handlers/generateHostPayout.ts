/**
 * Host Payout Schedule Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * Generates the Host Payout Schedule Form document.
 * Template: hostpayoutscheduleform.docx
 *
 * Variables:
 * - address, agreement_number, host_email, host_name, host_phone, payout_number
 * - date1-13, rent1-13, total1-13, maintenance_fee1-13 (payment entries)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { HostPayoutPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateHostPayoutPayload } from '../lib/validators.ts';
import { formatDate, formatCurrency } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
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

  // Validate payload
  const validatedPayload = validateHostPayoutPayload(payload);
  console.log(`[generateHostPayout] Agreement: ${validatedPayload.agreementNumber}`);

  // Prepare template data
  const templateData = prepareTemplateData(validatedPayload);

  // Render the template
  const documentContent = await downloadAndRenderTemplate(
    supabase,
    TEMPLATE_PATHS.hostPayout,
    templateData
  );

  // Generate filename
  const filename = `host_payout_schedule-${validatedPayload.agreementNumber}.docx`;

  // Upload to Google Drive
  const uploadResult = await uploadToGoogleDrive(documentContent, filename);

  if (!uploadResult.success) {
    const errorMsg = `Failed to upload Host Payout Schedule: ${uploadResult.error}`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // Success notification
  await notifySlack(`Successfully created Host Payout Schedule: ${filename}`);

  return {
    success: true,
    filename,
    driveUrl: uploadResult.webViewLink,
    fileId: uploadResult.fileId,
  };
}

// ================================================
// TEMPLATE DATA PREPARATION
// ================================================

function prepareTemplateData(payload: HostPayoutPayload): Record<string, string> {
  const data: Record<string, string> = {
    address: payload.address,
    agreement_number: payload.agreementNumber,
    host_email: payload.hostEmail,
    host_name: payload.hostName,
    host_phone: payload.hostPhone,
    payout_number: payload.payoutNumber,
  };

  // Add payment schedule data (up to 13 entries)
  for (let i = 1; i <= 13; i++) {
    const paymentIndex = i - 1;
    const payment = payload.payments[paymentIndex];

    if (payment && payment.date && payment.rent && payment.total) {
      data[`date${i}`] = formatDate(payment.date);
      data[`rent${i}`] = formatCurrency(payment.rent);
      data[`total${i}`] = formatCurrency(payment.total);
      // Maintenance fee is the same for all payment rows
      data[`maintenance_fee${i}`] = formatCurrency(payload.maintenanceFee);
    } else {
      // Empty values for unused rows
      data[`date${i}`] = '';
      data[`rent${i}`] = '';
      data[`total${i}`] = '';
      data[`maintenance_fee${i}`] = '';
    }
  }

  return data;
}
