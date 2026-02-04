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
 * Sanitize template JSON to fix bad control characters in string literals
 * Uses a comprehensive approach to handle all possible control character issues.
 *
 * Strategy:
 * 1. Find all JSON string literals using a robust regex
 * 2. For each string literal, properly escape all control characters
 * 3. Reconstruct the JSON with properly escaped strings
 */
function sanitizeTemplateJson(template: string): string {
  // This comprehensive regex matches JSON string literals, including:
  // - Simple strings: "value"
  // - Strings with escaped chars: "value\n"
  // - Strings with escaped quotes: "value\"quote"
  // - Empty strings: ""
  const jsonStringRegex = /"(?:[^"\\]|\\[\s\S])*?"/g;

  return template.replace(jsonStringRegex, (stringLiteral) => {
    // Don't modify strings that are already correctly formatted
    // Try to parse it first - if it works, leave it alone
    try {
      JSON.parse(stringLiteral);
      return stringLiteral;
    } catch {
      // String is malformed, fix it
    }

    // Extract content between quotes
    if (stringLiteral === '""') {
      return '""';
    }

    const content = stringLiteral.slice(1, -1);

    // Step 1: Unescape existing escape sequences to get raw content
    let rawContent = content;
    try {
      // Use a temporary string to unescape
      rawContent = JSON.parse('"' + content + '"');
    } catch (_e) {
      // If unescaping fails, process character by character
      rawContent = '';
      let i = 0;
      while (i < content.length) {
        if (content[i] === '\\' && i + 1 < content.length) {
          const nextChar = content[i + 1];
          switch (nextChar) {
            case 'n': rawContent += '\n'; break;
            case 'r': rawContent += '\r'; break;
            case 't': rawContent += '\t'; break;
            case 'b': rawContent += '\b'; break;
            case 'f': rawContent += '\f'; break;
            case '\\': rawContent += '\\'; break;
            case '"': rawContent += '"'; break;
            case 'u':
              // Unicode escape \uXXXX
              if (i + 5 < content.length) {
                const hex = content.substring(i + 2, i + 6);
                rawContent += String.fromCharCode(parseInt(hex, 16));
                i += 4;
              }
              break;
            default:
              // Unknown escape, keep as-is
              rawContent += nextChar;
          }
          i += 2;
        } else {
          rawContent += content[i];
          i++;
        }
      }
    }

    // Step 2: Re-escape properly using JSON.stringify
    try {
      return JSON.stringify(rawContent);
    } catch (_e) {
      // If JSON.stringify fails, manual escape
      let escaped = '';
      for (let i = 0; i < rawContent.length; i++) {
        const c = rawContent[i];
        const code = c.charCodeAt(0);
        switch (c) {
          case '"': escaped += '\\"'; break;
          case '\\': escaped += '\\\\'; break;
          case '\n': escaped += '\\n'; break;
          case '\r': escaped += '\\r'; break;
          case '\t': escaped += '\\t'; break;
          case '\b': escaped += '\\b'; break;
          case '\f': escaped += '\\f'; break;
          default:
            if (code < 32) {
              // Other control characters - use unicode escape
              escaped += '\\u' + code.toString(16).padStart(4, '0');
            } else {
              escaped += c;
            }
        }
      }
      return '"' + escaped + '"';
    }
  });
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
  // Pre-process template to fix bad control characters in JSON string literals
  // This handles cases where the database template has raw newlines or other
  // control characters that break JSON.parse()
  const sanitized = sanitizeTemplateJson(template);
  const processed = processTemplateInternal(sanitized, variables, true);
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
