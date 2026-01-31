/**
 * Periodic Tenancy Agreement Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * Generates the Periodic Tenancy Agreement document.
 * Template: periodictenancyagreement.docx
 *
 * Variables:
 * - agreement_number, start_date, end_date, last_date, check_in, check_out
 * - week_duration, guests_allowed, host_name, guest_name
 * - supplemental_number, credit_card_form_number, payout_number
 * - cancellation_policy_rest, damage_deposit
 * - listing_title, spacedetails, listing_description, location, type_of_space
 * - House_rules_items, image1, image2, image3
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { PeriodicTenancyPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validatePeriodicTenancyPayload } from '../lib/validators.ts';
import { formatDate, formatHouseRules } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGeneratePeriodicTenancy(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generatePeriodicTenancy] Starting document generation...');

  // Validate payload
  const validatedPayload = validatePeriodicTenancyPayload(payload);
  console.log(`[generatePeriodicTenancy] Agreement: ${validatedPayload.agreementNumber}`);

  // Prepare template data
  const templateData = prepareTemplateData(validatedPayload);

  // Prepare image URLs for embedding
  const imageUrls: Record<string, string> = {};
  if (validatedPayload.image1Url) {
    imageUrls.image1 = validatedPayload.image1Url;
  }
  if (validatedPayload.image2Url) {
    imageUrls.image2 = validatedPayload.image2Url;
  }
  if (validatedPayload.image3Url) {
    imageUrls.image3 = validatedPayload.image3Url;
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

  // Generate filename
  const filename = `periodic_tenancy_agreement-${validatedPayload.agreementNumber}.docx`;

  // Upload to Google Drive
  const uploadResult = await uploadToGoogleDrive(documentContent, filename);

  if (!uploadResult.success) {
    const errorMsg = `Failed to upload Periodic Tenancy Agreement: ${uploadResult.error}`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // Success notification
  await notifySlack(`Successfully created Periodic Tenancy Agreement: ${filename}`);

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

function prepareTemplateData(payload: PeriodicTenancyPayload): Record<string, string> {
  return {
    agreement_number: payload.agreementNumber,
    start_date: formatDate(payload.checkInDate),
    end_date: formatDate(payload.checkOutDate),
    last_date: formatDate(payload.checkOutDate),
    check_in: payload.checkInDay,
    check_out: payload.checkOutDay,
    week_duration: payload.numberOfWeeks,
    guests_allowed: payload.guestsAllowed,
    host_name: payload.hostName,
    guest_name: payload.guestName,
    supplemental_number: payload.supplementalNumber,
    credit_card_form_number: payload.authorizationCardNumber,
    payout_number: payload.hostPayoutScheduleNumber,
    cancellation_policy_rest: payload.extraRequestsOnCancellationPolicy || 'N/A',
    damage_deposit: payload.damageDeposit,
    listing_title: payload.listingTitle,
    spacedetails: payload.spaceDetails,
    listing_description: payload.listingDescription,
    location: payload.location,
    type_of_space: payload.typeOfSpace,
    House_rules_items: formatHouseRules(payload.houseRules),
  };
}
