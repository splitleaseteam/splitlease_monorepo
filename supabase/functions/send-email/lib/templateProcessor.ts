/**
 * Template Processor for Email Templates
 * Split Lease - send-email Edge Function
 *
 * Handles placeholder replacement for multiple syntaxes:
 * - Double dollar-sign style: $$variable$$ (Bubble templates)
 * - Jinja-style: {{ variable }} (legacy support)
 */

/**
 * Replace placeholders in a template string (HTML content)
 * Supports both $$variable$$ (primary) and {{ variable }} (fallback) syntaxes
 *
 * @param template - The HTML template with placeholders
 * @param variables - Key-value pairs for replacement
 * @returns Processed HTML string
 */
export function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return processTemplateInternal(template, variables, false);
}

/**
 * Replace placeholders in a JSON template string
 * Values are escaped to be JSON-safe (handles quotes, newlines, backslashes)
 * Also cleans up JSON syntax issues that result from empty placeholder replacement
 *
 * @param template - The JSON template string with placeholders
 * @param variables - Key-value pairs for replacement
 * @returns Processed JSON string (valid JSON after replacement)
 */
export function processTemplateJson(
  template: string,
  variables: Record<string, string>
): string {
  const processed = processTemplateInternal(template, variables, true);
  // Clean up JSON syntax issues from Bubble-style templates
  return cleanupJsonSyntax(processed);
}

/**
 * Internal function to process templates with configurable escaping
 */
function processTemplateInternal(
  template: string,
  variables: Record<string, string>,
  jsonSafe: boolean
): string {
  if (!template) {
    throw new Error('Template content is empty');
  }

  const escapeValue = jsonSafe ? escapeJsonString : escapeHtml;

  let processedTemplate = template;

  // First pass: Replace $$variable$$ placeholders (Bubble template style - double dollar signs)
  // Supports: $$var$$, $$var_name$$, $$var-name$$, $$var name$$ (with spaces)
  const dollarRegex = /\$\$([a-zA-Z0-9_\-\s]+)\$\$/g;

  processedTemplate = processedTemplate.replace(dollarRegex, (match, variableName) => {
    const value = variables[variableName];

    if (value === undefined) {
      console.warn(`[templateProcessor] Dollar placeholder "${variableName}" not found in variables, keeping original`);
      // For JSON templates, return empty string for missing placeholders to keep JSON valid
      return jsonSafe ? '' : match;
    }

    const stringValue = String(value);

    // For JSON templates: Don't escape structural JSON fragments
    // Structural fragments are: empty strings, or values starting with comma/brace/bracket
    // These are pre-built JSON structures that should be inserted raw
    if (jsonSafe) {
      const isStructuralFragment =
        stringValue === '' ||
        stringValue.startsWith(',') ||
        stringValue.startsWith('{') ||
        stringValue.startsWith('[') ||
        stringValue.startsWith('<');  // HTML content like buttons

      if (isStructuralFragment) {
        return stringValue;
      }
    }

    return escapeValue(stringValue);
  });

  // Second pass: Replace {{ variable }} placeholders (Jinja-style fallback)
  const jinjaRegex = /\{\{\s*([a-zA-Z0-9_\-.]+)\s*\}\}/g;

  processedTemplate = processedTemplate.replace(jinjaRegex, (match, variableName) => {
    const value = variables[variableName];

    if (value === undefined) {
      console.warn(`[templateProcessor] Jinja placeholder "${variableName}" not found in variables, keeping original`);
      return jsonSafe ? '' : match;
    }

    return escapeValue(String(value));
  });

  return processedTemplate;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

/**
 * Escape a string to be safely embedded in a JSON string value
 * Handles: quotes, backslashes, newlines, tabs, and other control characters
 */
function escapeJsonString(text: string): string {
  // Use JSON.stringify to properly escape, then strip the surrounding quotes
  const escaped = JSON.stringify(text);
  // JSON.stringify adds quotes around the string, remove them
  return escaped.slice(1, -1);
}

/**
 * Clean up JSON syntax issues that result from Bubble-style template processing
 * Bubble templates use structural placeholders ($$cc$$, $$bcc$$, etc.) that sit
 * outside of JSON string values. When replaced with empty strings, they leave
 * syntax holes. This function repairs the JSON.
 */
function cleanupJsonSyntax(json: string): string {
  let cleaned = json;

  // 1. Remove trailing commas before ] or } (with optional whitespace)
  //    Matches: ,] or ,} with any whitespace/newlines between
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // 2. Remove empty lines and consolidate whitespace
  //    Replace multiple newlines/spaces with single space (but preserve structure)
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');

  // 3. Fix missing commas between properties
  //    Pattern: "value" followed by whitespace then "key": (missing comma)
  cleaned = cleaned.replace(/(")\s*\n\s*(")/g, '$1,\n  $2');

  // 4. Fix missing commas after } or ] followed by "key":
  //    Pattern: } or ] followed by whitespace then "key": (missing comma)
  cleaned = cleaned.replace(/([}\]])\s*\n\s*(")/g, '$1,\n  $2');

  // 5. Remove any double commas that might result from cleanup
  cleaned = cleaned.replace(/,\s*,/g, ',');

  // 6. Final pass: remove trailing commas again (cleanup might create new ones)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  return cleaned;
}

/**
 * Extract all placeholder names from a template
 * Supports both $$variable$$ and {{ variable }} syntaxes
 * Useful for validation and debugging
 */
export function extractPlaceholders(template: string): string[] {
  const placeholders: string[] = [];

  // Extract $$variable$$ placeholders (Bubble style - double dollar signs)
  // Supports spaces to match templates using $$from email$$ format
  const dollarRegex = /\$\$([a-zA-Z0-9_\-\s]+)\$\$/g;
  let match;

  while ((match = dollarRegex.exec(template)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  // Extract {{ variable }} placeholders (Jinja style)
  const jinjaRegex = /\{\{\s*([a-zA-Z0-9_\-.]+)\s*\}\}/g;

  while ((match = jinjaRegex.exec(template)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  return placeholders;
}

/**
 * Validate that all required placeholders have values
 * Returns list of missing placeholders
 */
export function validatePlaceholders(
  template: string,
  variables: Record<string, string>
): string[] {
  const required = extractPlaceholders(template);
  return required.filter(placeholder => variables[placeholder] === undefined);
}
