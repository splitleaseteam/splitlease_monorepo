/**
 * Credit Card Authorization Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * Generates the Recurring Credit Card Authorization Form document.
 * Templates:
 * - Prorated: recurringcreditcardauthorizationprorated.docx
 * - Non-Prorated: recurringcreditcardauthorization.docx
 *
 * Variables:
 * - agreement_number, host_name, guest_name, maintenancefee, weeks_number
 * - ListingDescription, fourweekrent, damagedeposit, totalfirstpayment
 * - penultimateweeknumber, totalsecondpayment, slcredit, lastpaymenttotal
 * - numberofpayments, lastpaymentweeks, lastpaymentrent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { CreditCardAuthPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateCreditCardAuthPayload } from '../lib/validators.ts';
import { formatCurrencyRaw } from '../lib/formatters.ts';
import { calculatePayments } from '../lib/calculations.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateCreditCardAuth(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generateCreditCardAuth] Starting document generation...');

  // Validate payload
  const validatedPayload = validateCreditCardAuthPayload(payload);
  console.log(`[generateCreditCardAuth] Agreement: ${validatedPayload.agreementNumber}, Prorated: ${validatedPayload.isProrated}`);

  // Calculate payment totals
  const payments = calculatePayments({
    fourWeekRent: validatedPayload.fourWeekRent,
    maintenanceFee: validatedPayload.maintenanceFee,
    damageDeposit: validatedPayload.damageDeposit,
    splitleaseCredit: validatedPayload.splitleaseCredit,
    lastPaymentRent: validatedPayload.lastPaymentRent,
  });

  // Prepare template data
  const templateData = prepareTemplateData(validatedPayload, payments);

  // Select template based on prorated flag
  const templatePath = validatedPayload.isProrated
    ? TEMPLATE_PATHS.creditCardAuthProrated
    : TEMPLATE_PATHS.creditCardAuthNonProrated;

  // Render the template
  const documentContent = await downloadAndRenderTemplate(
    supabase,
    templatePath,
    templateData
  );

  // Generate filename
  const proratedSuffix = validatedPayload.isProrated ? 'prorated' : 'nonprorated';
  const filename = `recurring_credit_card_auth-${proratedSuffix}-${validatedPayload.agreementNumber}.docx`;

  // Upload to Google Drive
  const uploadResult = await uploadToGoogleDrive(documentContent, filename);

  if (!uploadResult.success) {
    const errorMsg = `Failed to upload Credit Card Authorization: ${uploadResult.error}`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // Success notification
  await notifySlack(`Successfully created Credit Card Authorization: ${filename}`);

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

function prepareTemplateData(
  payload: CreditCardAuthPayload,
  payments: CalculatedPayments
): Record<string, string> {
  return {
    agreement_number: payload.agreementNumber,
    host_name: payload.hostName,
    guest_name: payload.guestName,
    maintenancefee: formatCurrencyRaw(payments.maintenanceFee),
    weeks_number: payload.weeksNumber,
    ListingDescription: payload.listingDescription,
    fourweekrent: formatCurrencyRaw(payments.fourWeekRent),
    damagedeposit: formatCurrencyRaw(payments.damageDeposit),
    totalfirstpayment: formatCurrencyRaw(payments.totalFirstPayment),
    penultimateweeknumber: payload.penultimateWeekNumber,
    totalsecondpayment: formatCurrencyRaw(payments.totalSecondPayment),
    slcredit: formatCurrencyRaw(payments.splitleaseCredit),
    lastpaymenttotal: formatCurrencyRaw(payments.totalLastPayment),
    numberofpayments: payload.numberOfPayments,
    lastpaymentweeks: payload.lastPaymentWeeks,
    lastpaymentrent: formatCurrencyRaw(payments.lastPaymentRent),
  };
}
