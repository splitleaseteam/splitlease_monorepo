// Host Payout Document Handler

import { renderDocxTemplate, generateFilename } from '../lib/docx.ts';
import { loadTemplateFromStorage, getTemplateByAction } from '../lib/storage.ts';
import { uploadToGoogleDrive } from '../lib/googleDrive.ts';
import { formatCurrencyDisplay } from '../lib/currency.ts';
import { formatDateForTemplate } from '../lib/dates.ts';
import { validateHostPayoutPayload } from '../lib/validation.ts';
import type { HostPayoutPayload, PayoutPeriod as _PayoutPeriod } from '../types/contracts.ts';

export interface GenerationResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  driveUrl?: string;
  driveFileId?: string;
  error?: string;
}

/**
 * Generate Host Payout document
 */
export async function handleGenerateHostPayout(
  payload: HostPayoutPayload,
  supabase: any
): Promise<GenerationResult> {
  // Validate payload
  const validation = validateHostPayoutPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    };
  }

  try {
    // Load template
    const templateInfo = getTemplateByAction('generate_host_payout');
    if (!templateInfo) {
      return { success: false, error: 'Template configuration not found' };
    }

    const templateBytes = await loadTemplateFromStorage(supabase, templateInfo.filename);

    // Format maintenance fee
    const maintenanceFee = formatCurrencyDisplay(
      parseFloat(payload.maintenanceFee.replace(/[$,]/g, '').trim())
    );

    // Build template data with payout periods (up to 13)
    const templateData: Record<string, string> = {
      address: payload.address,
      agreement_number: payload.agreementNumber,
      host_email: payload.hostEmail,
      host_name: payload.hostName,
      host_phone: payload.hostPhone,
      payout_number: payload.payoutNumber
    };

    // Add maintenance fee to each period
    for (let i = 0; i < 13; i++) {
      const period = payload.periods[i];
      const index = i + 1;

      if (period) {
        templateData[`date${index}`] = formatDateForTemplate(period.date);
        templateData[`rent${index}`] = formatCurrencyDisplay(
          parseFloat(period.rent.replace(/[$,]/g, '').trim())
        );
        templateData[`total${index}`] = formatCurrencyDisplay(
          parseFloat(period.total.replace(/[$,]/g, '').trim())
        );
        templateData[`maintenance_fee${index}`] = maintenanceFee;
      } else {
        // Empty period
        templateData[`date${index}`] = '';
        templateData[`rent${index}`] = '';
        templateData[`total${index}`] = '';
        templateData[`maintenance_fee${index}`] = '';
      }
    }

    // Render document
    const documentBytes = await renderDocxTemplate(templateBytes, templateData);

    // Generate filename
    const filename = generateFilename('host_payout_schedule', payload.agreementNumber);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
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

    // Upload to Google Drive
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
