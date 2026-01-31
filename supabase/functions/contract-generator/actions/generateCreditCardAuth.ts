// Credit Card Authorization (Prorated) Document Handler

import { renderDocxTemplate, generateFilename, transformTemplateData as _transformTemplateData } from '../lib/docx.ts';
import { loadTemplateFromStorage, getTemplateByAction } from '../lib/storage.ts';
import { uploadToGoogleDrive } from '../lib/googleDrive.ts';
import { convertCurrencyToFloat, roundDown, formatCurrency } from '../lib/currency.ts';
import { validateCreditCardAuthPayload } from '../lib/validation.ts';
import type { CreditCardAuthPayload } from '../types/contracts.ts';

export interface GenerationResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  driveUrl?: string;
  driveFileId?: string;
  error?: string;
}

/**
 * Generate Credit Card Authorization (Prorated) document
 */
export async function handleGenerateCreditCardAuth(
  payload: CreditCardAuthPayload,
  supabase: any
): Promise<GenerationResult> {
  // Validate payload
  const validation = validateCreditCardAuthPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    };
  }

  try {
    // Load template
    const templateInfo = getTemplateByAction('generate_credit_card_auth');
    if (!templateInfo) {
      return { success: false, error: 'Template configuration not found' };
    }

    const templateBytes = await loadTemplateFromStorage(supabase, templateInfo.filename);

    // Calculate payment totals
    const fourWeekRent = roundDown(convertCurrencyToFloat(payload.fourWeekRent));
    const maintenanceFee = roundDown(convertCurrencyToFloat(payload.maintenanceFee));
    const damageDeposit = roundDown(convertCurrencyToFloat(payload.damageDeposit));
    const splitleaseCredit = roundDown(convertCurrencyToFloat(payload.splitleaseCredit));
    const lastPaymentRent = roundDown(convertCurrencyToFloat(payload.lastPaymentRent));

    const totalFirstPayment = roundDown(fourWeekRent + maintenanceFee + damageDeposit);
    const totalSecondPayment = roundDown(fourWeekRent + maintenanceFee);
    const totalLastPayment = roundDown(lastPaymentRent + maintenanceFee - splitleaseCredit);

    // Prepare template data (matching Python variable names)
    const templateData = {
      agreement_number: payload.agreementNumber,
      host_name: payload.hostName,
      guest_name: payload.guestName,
      maintenancefee: formatCurrency(maintenanceFee),
      weeks_number: payload.weeksNumber,
      ListingDescription: payload.listingDescription,
      fourweekrent: formatCurrency(fourWeekRent),
      damagedeposit: formatCurrency(damageDeposit),
      totalfirstpayment: formatCurrency(totalFirstPayment),
      penultimateweeknumber: payload.penultimateWeekNumber,
      totalsecondpayment: formatCurrency(totalSecondPayment),
      slcredit: formatCurrency(splitleaseCredit),
      lastpaymenttotal: formatCurrency(totalLastPayment),
      numberofpayments: payload.numberOfPayments,
      lastpaymentweeks: payload.lastPaymentWeeks,
      lastpaymentrent: formatCurrency(lastPaymentRent)
    };

    // Render document
    const documentBytes = await renderDocxTemplate(templateBytes, templateData);

    // Generate filename
    const filename = generateFilename('recurring_credit_card_auth-prorated', payload.agreementNumber);

    // Upload to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase
      .storage
      .from('contract-templates')
      .upload(`generated/${filename}`, documentBytes, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      return {
        success: false,
        error: `Failed to save document: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('contract-templates')
      .getPublicUrl(`generated/${filename}`);

    // Upload to Google Drive (optional, doesn't fail if it fails)
    const driveResult = await uploadToGoogleDrive(documentBytes, filename);

    return {
      success: true,
      filename,
      downloadUrl: publicUrl,
      driveUrl: driveResult.success ? driveResult.webViewLink : undefined,
      driveFileId: driveResult.success ? driveResult.fileId : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
