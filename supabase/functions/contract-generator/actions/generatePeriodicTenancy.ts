// Periodic Tenancy Document Handler

import { renderDocxTemplate, generateFilename, createTemplateImage } from '../lib/docx.ts';
import { loadTemplateFromStorage, getTemplateByAction } from '../lib/storage.ts';
import { uploadToGoogleDrive } from '../lib/googleDrive.ts';
import { formatCurrencyDisplay } from '../lib/currency.ts';
import { formatDateForTemplate, getDayOfWeekFromString } from '../lib/dates.ts';
import { processImageInput, processHouseRules } from '../lib/images.ts';
import { validatePeriodicTenancyPayload } from '../lib/validation.ts';
import type { PeriodicTenancyPayload } from '../types/contracts.ts';

export interface GenerationResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  driveUrl?: string;
  driveFileId?: string;
  error?: string;
}

/**
 * Generate Periodic Tenancy Agreement document
 */
export async function handleGeneratePeriodicTenancy(
  payload: PeriodicTenancyPayload,
  supabase: any
): Promise<GenerationResult> {
  // Validate payload
  const validation = validatePeriodicTenancyPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    };
  }

  try {
    // Load template
    const templateInfo = getTemplateByAction('generate_periodic_tenancy');
    if (!templateInfo) {
      return { success: false, error: 'Template configuration not found' };
    }

    const templateBytes = await loadTemplateFromStorage(supabase, templateInfo.filename);

    // Format damage deposit
    const damageDeposit = formatCurrencyDisplay(
      parseFloat(payload.damageDeposit.replace(/[$,]/g, '').trim())
    );

    // Process house rules
    const houseRulesItems = processHouseRules(payload.houseRules);

    // Process images
    const image1 = payload.image1 ? await processImageInput(payload.image1) : null;
    const image2 = payload.image2 ? await processImageInput(payload.image2) : null;
    const image3 = payload.image3 ? await processImageInput(payload.image3) : null;

    // Prepare template data
    const templateData: Record<string, unknown> = {
      agreement_number: payload.agreementNumber,
      start_date: formatDateForTemplate(payload.checkInDate),
      end_date: formatDateForTemplate(payload.checkOutDate),
      last_date: formatDateForTemplate(payload.checkOutDate),
      check_in: getDayOfWeekFromString(payload.checkInDate),
      check_out: getDayOfWeekFromString(payload.checkOutDate),
      week_duration: payload.numberOfWeeks,
      guests_allowed: payload.guestsAllowed,
      host_name: payload.hostName,
      guest_name: payload.guestName,
      supplemental_number: payload.supplementalNumber,
      credit_card_form_number: payload.authorizationCardNumber,
      payout_number: payload.hostPayoutScheduleNumber,
      cancellation_policy_rest: payload.cancellationPolicyRest,
      damage_deposit: damageDeposit,
      listing_title: payload.listingTitle,
      spacedetails: payload.spaceDetails,
      listing_description: payload.listingDescription,
      location: payload.location,
      type_of_space: payload.typeOfSpace,
      House_rules_items: houseRulesItems
    };

    // Add images if available
    const images: Record<string, ReturnType<typeof createTemplateImage>> = {};
    if (image1) {
      images.image1 = createTemplateImage(image1, 300, 200);
    }
    if (image2) {
      images.image2 = createTemplateImage(image2, 300, 200);
    }
    if (image3) {
      images.image3 = createTemplateImage(image3, 300, 200);
    }

    // Render document
    const documentBytes = await renderDocxTemplate(templateBytes, templateData, images);

    // Generate filename
    const filename = generateFilename('periodic_tenancy_agreement', payload.agreementNumber);

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
