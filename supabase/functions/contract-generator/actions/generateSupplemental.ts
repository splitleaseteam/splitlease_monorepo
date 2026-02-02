// Supplemental Agreement Document Handler

import { renderDocxTemplate, generateFilename, createTemplateImage } from '../lib/docx.ts';
import { loadTemplateFromStorage, getTemplateByAction } from '../lib/storage.ts';
import { uploadToGoogleDrive } from '../lib/googleDrive.ts';
import { formatDateForTemplate } from '../lib/dates.ts';
import { processImageInput } from '../lib/images.ts';
import { validateSupplementalPayload } from '../lib/validation.ts';
import type { SupplementalPayload } from '../types/contracts.ts';

export interface GenerationResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  driveUrl?: string;
  driveFileId?: string;
  error?: string;
}

/**
 * Generate Supplemental Agreement document
 */
export async function handleGenerateSupplemental(
  payload: SupplementalPayload,
  supabase: any
): Promise<GenerationResult> {
  // Validate payload
  const validation = validateSupplementalPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    };
  }

  try {
    // Load template
    const templateInfo = getTemplateByAction('generate_supplemental');
    if (!templateInfo) {
      return { success: false, error: 'Template configuration not found' };
    }

    const templateBytes = await loadTemplateFromStorage(supabase, templateInfo.filename);

    // Process images
    const image1 = payload.image1 ? await processImageInput(payload.image1) : null;
    const image2 = payload.image2 ? await processImageInput(payload.image2) : null;
    const image3 = payload.image3 ? await processImageInput(payload.image3) : null;

    // Prepare template data
    const templateData: Record<string, string> = {
      agreement_number: payload.agreementNumber,
      start_date: formatDateForTemplate(payload.checkInDate),
      end_date: formatDateForTemplate(payload.checkOutDate),
      weeks_number: payload.numberOfWeeks,
      guest_allowed: payload.guestsAllowed,
      guests_allowed: payload.guestsAllowed, // Both variations used in templates
      host_name: payload.hostName,
      listing_description: payload.listingDescription,
      listing_title: payload.listingTitle,
      spacedetails: payload.spaceDetails,
      location: payload.location,
      type_of_space: payload.typeOfSpace,
      supplement_number: payload.supplementalNumber
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
    const filename = generateFilename('supplemental_agreement', payload.agreementNumber);

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
