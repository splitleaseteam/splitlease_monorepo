// Contract Data Processors for Template Formatting

/**
 * Format currency number for template (2 decimal places)
 * Pure function - no side effects
 */
export function formatCurrencyForTemplate(value: number): string {
  return value.toFixed(2);
}

/**
 * Format currency with dollar sign and commas for display
 * Pure function - no side effects
 */
export function formatCurrencyDisplay(value: number): string {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format date for template (Month day, Year format)
 * Pure function - no side effects
 */
export function formatDateForTemplate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Parse date string supporting multiple formats
 * Pure function - no side effects
 */
export function parseContractDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  // Try MM/dd/yy format
  const pattern1 = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const match1 = dateStr.match(pattern1);
  if (match1) {
    const [, month, day, year] = match1;
    const fullYear = 2000 + parseInt(year, 10);
    const date = new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try yyyy-MM-dd format
  const pattern2 = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match2 = dateStr.match(pattern2);
  if (match2) {
    const [, year, month, day] = match2;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Process house rules from string or array to template format
 * Pure function - no side effects
 */
export function processHouseRules(rules: string | Array<{ text?: string }>): Array<{ text: string }> {
  if (typeof rules === 'string') {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(rules);
      if (Array.isArray(parsed)) {
        return parsed.map((r: unknown) => ({
          text: typeof r === 'string' ? r : (r as { text?: string }).text || ''
        }));
      }
    } catch {
      // Split by newlines if not valid JSON
      return rules.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(text => ({ text }));
    }
  }

  if (Array.isArray(rules)) {
    return rules.map(r => ({
      text: typeof r === 'string' ? r : (r as { text?: string }).text || ''
    }));
  }

  return [];
}

/**
 * Process image input to template format
 * Returns Uint8Array if valid, null otherwise
 */
export async function processImageForTemplate(image: string | undefined): Promise<Uint8Array | null> {
  if (!image || image.trim() === '') {
    return null;
  }

  // Base64 handling
  if (image.startsWith('data:image/')) {
    const base64Data = image.split(',')[1] || image;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // URL handling
  if (image.startsWith('http://') || image.startsWith('https://')) {
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error(`Invalid image input: must be base64 or URL`);
}
