/**
 * Template Renderer for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Uses docxtemplater via npm specifier for DOCX template rendering.
 * Templates are stored in Supabase Storage bucket 'document-templates'.
 */

import Docxtemplater from 'npm:docxtemplater@3.47.4';
import PizZip from 'npm:pizzip@3.1.7';
import ImageModule from 'npm:docxtemplater-image-module-free@1.1.1';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ================================================
// CONSTANTS
// ================================================

const TEMPLATES_BUCKET = 'document-templates';

// Template paths within the bucket
export const TEMPLATE_PATHS = {
  hostPayout: 'host_payout/hostpayoutscheduleform.docx',
  supplemental: 'supplemental/supplementalagreement.docx',
  periodicTenancy: 'periodic_tenancy/periodictenancyagreement.docx',
  creditCardAuthProrated: 'credit_card_auth/recurringcreditcardauthorizationprorated.docx',
  creditCardAuthNonProrated: 'credit_card_auth/recurringcreditcardauthorization.docx',
} as const;

// ================================================
// TEMPLATE DOWNLOAD
// ================================================

/**
 * Download a template from Supabase Storage.
 */
export async function downloadTemplate(
  supabase: SupabaseClient,
  templatePath: string
): Promise<Uint8Array> {
  console.log(`[templateRenderer] Downloading template: ${templatePath}`);

  const { data, error } = await supabase.storage
    .from(TEMPLATES_BUCKET)
    .download(templatePath);

  if (error) {
    throw new Error(`Failed to download template ${templatePath}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// ================================================
// IMAGE HANDLING
// ================================================

/**
 * Extract base64 payload from a data URL.
 */
function extractBase64FromDataUrl(value: string): string | null {
  const match = value.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
  return match ? match[1] : null;
}

/**
 * Basic base64 shape check for raw image payloads.
 */
function looksLikeBase64(value: string): boolean {
  const normalized = value.replace(/\s/g, '');
  if (normalized.length < 32) {
    return false;
  }
  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

/**
 * Fetch an image from a URL or data URL and return as base64.
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return null;
  }

  const dataUrlBase64 = extractBase64FromDataUrl(trimmed);
  if (dataUrlBase64) {
    return dataUrlBase64;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (looksLikeBase64(trimmed)) {
      return trimmed.replace(/\s/g, '');
    }
    console.warn(`[templateRenderer] Unsupported image format: ${trimmed.slice(0, 80)}...`);
    return null;
  }

  try {
    console.log(`[templateRenderer] Fetching image: ${trimmed}`);
    const response = await fetch(trimmed);

    if (!response.ok) {
      console.warn(`[templateRenderer] Failed to fetch image (${response.status}): ${trimmed}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.warn(`[templateRenderer] Error fetching image: ${error}`);
    return null;
  }
}

/**
 * Create image module options for docxtemplater.
 */
function createImageModuleOptions() {
  return {
    centered: false,
    fileType: 'docx',
    getImage: (tagValue: string): Uint8Array | null => {
      // tagValue is base64 encoded image data
      if (!tagValue) {
        return null;
      }
      try {
        const binaryString = atob(tagValue);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch {
        return null;
      }
    },
    getSize: (): [number, number] => {
      // Default size: 48mm x 48mm (in EMUs, 1mm = 9525 EMUs)
      // Return in points: 48mm ≈ 136 points
      return [136, 136];
    },
  };
}

// ================================================
// TEMPLATE RENDERING
// ================================================

export interface RenderOptions {
  /** If true, use image module for image tags */
  useImages?: boolean;
  /** Image URLs to fetch and embed (key is the tag name without image prefix) */
  imageUrls?: Record<string, string>;
}

/**
 * Render a DOCX template with the provided data.
 *
 * @param templateContent - The template file content as Uint8Array
 * @param data - Template variable data
 * @param options - Rendering options
 * @returns The rendered document as Uint8Array
 */
export async function renderTemplate(
  templateContent: Uint8Array,
  data: Record<string, unknown>,
  options: RenderOptions = {}
): Promise<Uint8Array> {
  console.log('[templateRenderer] Rendering template...');

  // Load the template into PizZip
  const zip = new PizZip(templateContent);

  // Process images if needed
  let processedData = { ...data };
  const modules: unknown[] = [];

  if (options.useImages && options.imageUrls) {
    const imageModule = new ImageModule(createImageModuleOptions());
    modules.push(imageModule);

    // Fetch all images and add to data
    for (const [key, url] of Object.entries(options.imageUrls)) {
      if (url) {
        const base64 = await fetchImageAsBase64(url);
        if (base64) {
          processedData[key] = base64;
        } else {
          // Set to empty string if image fetch failed
          processedData[key] = '';
        }
      }
    }
  }

  // Create docxtemplater instance
  const doc = new Docxtemplater(zip, {
    modules,
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  // Render the template
  try {
    doc.render(processedData);
  } catch (error: unknown) {
    console.error('[templateRenderer] Template render error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Template render failed: ${errorMessage}`);
  }

  // Get the rendered document
  const outputBuffer = doc.getZip().generate({
    type: 'uint8array',
    compression: 'DEFLATE',
  });

  console.log('[templateRenderer] Template rendered successfully');
  return outputBuffer;
}

// ================================================
// TABLE ROW REMOVAL (Post-processing)
// ================================================

/**
 * Remove empty rows from tables in a rendered DOCX.
 * This is needed for the Host Payout Schedule to remove unused payment rows.
 *
 * Note: This is a simplified implementation. For complex table manipulation,
 * consider using python-docx on a server or a more robust library.
 *
 * For now, we rely on docxtemplater's conditional syntax to hide empty rows.
 * The template should use: {#payments}{date}{/payments} pattern.
 */
export function removeEmptyTableRows(docContent: Uint8Array): Uint8Array {
  // For now, return as-is. The template should handle conditional rows.
  // If needed, we can implement XML manipulation here.
  return docContent;
}

// ================================================
// CONVENIENCE FUNCTIONS
// ================================================

/**
 * Download and render a template in one call.
 */
export async function downloadAndRenderTemplate(
  supabase: SupabaseClient,
  templatePath: string,
  data: Record<string, unknown>,
  options: RenderOptions = {}
): Promise<Uint8Array> {
  const templateContent = await downloadTemplate(supabase, templatePath);
  return renderTemplate(templateContent, data, options);
}
