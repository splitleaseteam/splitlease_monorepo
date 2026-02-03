/**
 * Credit Card Authorization Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API.
 * Generates the Recurring Credit Card Authorization Form document.
 * Templates:
 * - Prorated: recurringcreditcardauthorizationprorated.docx
 * - Non-Prorated: recurringcreditcardauthorization.docx
 *
 * Template Variables (matching Python implementation):
 * - agreement_number, host_name, guest_name, maintenancefee, weeks_number
 * - ListingDescription, fourweekrent, damagedeposit, totalfirstpayment
 * - penultimateweeknumber, totalsecondpayment, slcredit, lastpaymenttotal
 * - numberofpayments, lastpaymentweeks, lastpaymentrent
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CreditCardAuthPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateCreditCardAuthPayload } from '../lib/validators.ts';
import { formatCurrencyRaw } from '../lib/formatters.ts';
import { calculatePayments } from '../lib/calculations.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';
import { uploadToSupabaseStorage } from '../lib/supabaseStorage.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateCreditCardAuth(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generateCreditCardAuth] Starting document generation...');

  // Validate payload (Python-compatible format)
  const validatedPayload = validateCreditCardAuthPayload(payload);
  const agreementNumber = validatedPayload['Agreement Number'];
  const isProrated = validatedPayload['Is Prorated'] === true;
  console.log(`[generateCreditCardAuth] Agreement: ${agreementNumber}, Prorated: ${isProrated}`);

  // Calculate payment totals
  const payments = calculatePayments({
    fourWeekRent: validatedPayload['Four Week Rent'],
    maintenanceFee: validatedPayload['Maintenance Fee'],
    damageDeposit: validatedPayload['Damage Deposit'],
    splitleaseCredit: validatedPayload['Splitlease Credit'],
    lastPaymentRent: validatedPayload['Last Payment Rent'],
  });

  // Prepare template data (mapping to Python template variables)
  const templateData = prepareTemplateData(validatedPayload, payments);

  // Select template based on prorated flag
  const templatePath = isProrated
    ? TEMPLATE_PATHS.creditCardAuthProrated
    : TEMPLATE_PATHS.creditCardAuthNonProrated;

  // Render the template
  const documentContent = await downloadAndRenderTemplate(
    supabase,
    templatePath,
    templateData
  );

  // Generate filename (matching Python output format)
  const proratedSuffix = isProrated ? 'prorated' : 'nonprorated';
  const filename = `recurring_credit_card_auth-${proratedSuffix}-${agreementNumber}.docx`;

  // Perform uploads
  const [driveUploadResult, storageUploadResult] = await Promise.all([
    uploadToGoogleDrive(documentContent, filename),
    uploadToSupabaseStorage(
      supabase,
      documentContent,
      filename,
      'credit_card_authorization'
    ),
  ]);

  // Log failures for debugging
  if (!driveUploadResult.success) {
    console.error(`[generateCreditCardAuth] Drive upload failed: ${driveUploadResult.error}`);
  }
  if (!storageUploadResult.success) {
    console.error(`[generateCreditCardAuth] Supabase upload failed: ${storageUploadResult.error}`);
  }

  // FAIL-SAFE LOGIC:
  if (!driveUploadResult.success && !storageUploadResult.success) {
    const errorMsg = `Failed to upload Credit Card Authorization: Drive (${driveUploadResult.error}) | Supabase (${storageUploadResult.error})`;
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
    await notifySlack(`[WARNING] Credit Card Auth uploaded to Supabase ONLY (Drive failed): ${filename}`, true);
  } else {
    await notifySlack(`Successfully created Credit Card Authorization: ${filename}`);
  }

  return result;
}

// ================================================
// TEMPLATE DATA PREPARATION
// ================================================

interface CalculatedPayments {
  fourWeekRent: number;
  maintenanceFee: number;
  damageDeposit: number;
  splitleaseCredit: number;
  lastPaymentRent: number;
  totalFirstPayment: number;
  totalSecondPayment: number;
  totalLastPayment: number;
}

/**
 * Maps Python-style payload to template variables.
 * Template variables match the Python docxtpl template exactly.
 */
function prepareTemplateData(
  payload: CreditCardAuthPayload,
  payments: CalculatedPayments
): Record<string, string> {
  return {
    agreement_number: payload['Agreement Number'],
    host_name: payload['Host Name'] || '',
    guest_name: payload['Guest Name'] || '',
    maintenancefee: formatCurrencyRaw(payments.maintenanceFee),
    weeks_number: payload['Weeks Number'] || '',
    ListingDescription: payload['Listing Description'] || '',
    fourweekrent: formatCurrencyRaw(payments.fourWeekRent),
    damagedeposit: formatCurrencyRaw(payments.damageDeposit),
    totalfirstpayment: formatCurrencyRaw(payments.totalFirstPayment),
    penultimateweeknumber: payload['Penultimate Week Number'] || '',
    totalsecondpayment: formatCurrencyRaw(payments.totalSecondPayment),
    slcredit: formatCurrencyRaw(payments.splitleaseCredit),
    lastpaymenttotal: formatCurrencyRaw(payments.totalLastPayment),
    numberofpayments: payload['Number of Payments'] || '',
    lastpaymentweeks: payload['Last Payment Weeks'] || '',
    lastpaymentrent: formatCurrencyRaw(payments.lastPaymentRent),
  };
}
