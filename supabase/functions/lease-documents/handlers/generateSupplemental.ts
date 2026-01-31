/**
 * Supplemental Agreement Generator Handler
 * Split Lease - Supabase Edge Functions
 *
 * Generates the Supplemental Agreement document.
 * Template: supplementalagreement.docx
 *
 * Variables:
 * - agreement_number, start_date, end_date, weeks_number, guest_allowed, guests_allowed
 * - host_name, listing_description, listing_title, spacedetails, location, type_of_space
 * - supplement_number, image1, image2, image3
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { SupplementalPayload, DocumentResult, UserContext } from '../lib/types.ts';
import { validateSupplementalPayload } from '../lib/validators.ts';
import { formatDate } from '../lib/formatters.ts';
import { downloadAndRenderTemplate, TEMPLATE_PATHS } from '../lib/templateRenderer.ts';
import { uploadToGoogleDrive, notifySlack } from '../lib/googleDrive.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateSupplemental(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  console.log('[generateSupplemental] Starting document generation...');

  // Validate payload
  const validatedPayload = validateSupplementalPayload(payload);
  console.log(`[generateSupplemental] Agreement: ${validatedPayload.agreementNumber}`);

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
    TEMPLATE_PATHS.supplemental,
    templateData,
    {
      useImages: Object.keys(imageUrls).length > 0,
      imageUrls,
    }
  );

  // Generate filename
  const filename = `supplement_agreement-${validatedPayload.agreementNumber}.docx`;

  // Upload to Google Drive
  const uploadResult = await uploadToGoogleDrive(documentContent, filename);

  if (!uploadResult.success) {
    const errorMsg = `Failed to upload Supplemental Agreement: ${uploadResult.error}`;
    await notifySlack(errorMsg, true);
    return {
      success: false,
      error: errorMsg,
    };
  }

  // Success notification
  await notifySlack(`Successfully created Supplemental Agreement: ${filename}`);

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

function prepareTemplateData(payload: SupplementalPayload): Record<string, string> {
  return {
    agreement_number: payload.agreementNumber,
    start_date: formatDate(payload.checkInDate),
    end_date: formatDate(payload.checkOutDate),
    weeks_number: payload.numberOfWeeks,
    guest_allowed: payload.guestsAllowed,
    guests_allowed: payload.guestsAllowed,
    host_name: payload.hostName,
    listing_description: payload.listingDescription,
    listing_title: payload.listingTitle,
    spacedetails: payload.spaceDetails,
    location: payload.location,
    type_of_space: payload.typeOfSpace,
    supplement_number: payload.supplementalNumber,
  };
}
