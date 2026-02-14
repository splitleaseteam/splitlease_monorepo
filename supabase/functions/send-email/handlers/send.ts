/**
 * Send Email Handler
 * Split Lease - send-email Edge Function
 *
 * Handles the 'send' action:
 * 1. Fetch template from database
 * 2. Process placeholders
 * 3. Send via SendGrid
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields, validateEmail } from '../../_shared/validation.ts';
import type { SendEmailPayload, EmailTemplate, SendEmailResult } from '../lib/types.ts';
import { processTemplateJson, validatePlaceholders } from '../lib/templateProcessor.ts';
import { sendEmailRaw, isSuccessResponse } from '../lib/sendgridClient.ts';

// Default sender configuration
const DEFAULT_FROM_EMAIL = 'noreply@splitlease.com';
const DEFAULT_FROM_NAME = 'Split Lease';

/**
 * Mapping from code variable names (underscore) to template placeholder names (space)
 * The database templates use space-delimited placeholders like $$from email$$
 * but the code uses underscore-delimited names like from_email
 */
const VARIABLE_NAME_MAPPING: Record<string, string> = {
  'from_email': 'from email',
  'from_name': 'from name',
  'to_email': 'to',
  'to_name': 'to name',
  'body_intro': 'body text',
  'body_text': 'body text',
  'logo_url': 'logo url',
  'button_text': 'buttontext',
  'button_url': 'buttonurl',
  'reply_to': 'reply_to',
  'first_name': 'first_name',
};

/**
 * Generate a styled HTML button for email templates
 * The BASIC_EMAIL template expects a complete HTML table row with button
 */
function generateButtonHtml(buttonText: string, buttonUrl: string): string {
  if (!buttonText || !buttonUrl) {
    return '';
  }

  return `<tr>
  <td align="center" style="padding:24px 32px;">
    <a href="${buttonUrl}" style="display:inline-block; background:#7c3aed; color:#ffffff; padding:14px 28px; border-radius:8px; font-weight:600; font-size:16px; text-decoration:none;">
      ${buttonText}
    </a>
  </td>
</tr>`;
}

/**
 * Normalize variable names to match template placeholders
 * Adds both underscore and space versions of each variable
 * This ensures compatibility with templates using either format
 */
function normalizeVariableNames(variables: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    // Keep the original key
    normalized[key] = value;

    // If there's a mapping, add the mapped version too
    if (VARIABLE_NAME_MAPPING[key]) {
      normalized[VARIABLE_NAME_MAPPING[key]] = value;
    }

    // Also add space-to-underscore conversion for any key with underscores
    if (key.includes('_')) {
      normalized[key.replace(/_/g, ' ')] = value;
    }
  }

  // Generate combined button HTML if button_text and button_url are provided
  // Template expects $$button$$ to be a complete HTML table row
  const buttonText = variables.button_text || variables.buttontext;
  const buttonUrl = variables.button_url || variables.buttonurl;
  if (buttonText && buttonUrl) {
    normalized['button'] = generateButtonHtml(buttonText, buttonUrl);
  } else if (!normalized['button']) {
    // If no button provided, set empty string to remove placeholder cleanly
    normalized['button'] = '';
  }

  // Set defaults for optional placeholders to prevent JSON breakage
  // These are marked as "optional" in the BASIC_EMAIL template
  if (!normalized['header']) {
    normalized['header'] = '';
  }
  if (!normalized['logo url'] && !normalized['logo_url']) {
    normalized['logo url'] = '';
    normalized['logo_url'] = '';
  }

  // STRUCTURAL PLACEHOLDERS: These sit outside JSON string values in Bubble templates
  // They need to be valid JSON fragments or empty strings
  // The template structure is: "to": [...] $$cc$$ $$bcc$$
  // When populated, these should inject: , "cc": [{"email": "..."}]

  // Handle $$cc$$ - needs to be empty (will be injected via SendGrid body later if needed)
  if (!normalized['cc']) {
    normalized['cc'] = '';
  }

  // Handle $$bcc$$ - needs to be empty (will be injected via SendGrid body later if needed)
  if (!normalized['bcc']) {
    normalized['bcc'] = '';
  }

  // Handle $$from name$$ - should be: , "name": "Value" or empty
  // This is injected after "email": "..." in the from object
  const fromName = variables.from_name || variables['from name'] || DEFAULT_FROM_NAME;
  if (fromName) {
    normalized['from name'] = `, "name": "${escapeJsonValue(fromName)}"`;
  } else {
    normalized['from name'] = '';
  }

  // Handle $$reply_to$$ - should be: "reply_to": {"email": "..."}, or empty
  // This sits between "from" and "subject"
  if (!normalized['reply_to']) {
    normalized['reply_to'] = '';
  }

  // Handle $$attachment$$ - should be empty for now (attachments not implemented)
  if (!normalized['attachment']) {
    normalized['attachment'] = '';
  }

  return normalized;
}

/**
 * Escape a string value for safe JSON embedding
 */
function escapeJsonValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Handle send email action
 */
export async function handleSend(
  payload: Record<string, unknown>
): Promise<SendEmailResult> {
  console.log('[send-email:send] ========== SEND EMAIL ==========');
  console.log('[send-email:send] Payload:', JSON.stringify({
    ...payload,
    variables: '(redacted for logging)'
  }, null, 2));

  // Validate required fields
  validateRequiredFields(payload, ['template_id', 'to_email', 'variables']);

  const {
    template_id,
    to_email,
    to_name,
    from_email,
    from_name,
    subject: providedSubject,
    variables,
    cc_emails,
    bcc_emails,
  } = payload as SendEmailPayload;

  // Validate email format
  validateEmail(to_email);

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  const sendgridEmailEndpoint = Deno.env.get('SENDGRID_EMAIL_ENDPOINT');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!sendgridApiKey) {
    throw new Error('Missing SENDGRID_API_KEY environment variable');
  }

  if (!sendgridEmailEndpoint) {
    throw new Error('Missing SENDGRID_EMAIL_ENDPOINT environment variable');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Step 1: Fetch template from database
  console.log('[send-email:send] Step 1/3: Fetching template...');
  console.log('[send-email:send] Looking up template_id:', template_id);

  const { data: template, error: templateError } = await supabase
    .from('zat_email_html_template_eg_sendbasicemailwf_')
    .select('id, name, email_template_json, description, email_reference, logo, placeholder')
    .eq('id', template_id)
    .single();

  console.log('[send-email:send] Query result - data:', template ? 'found' : 'null');
  console.log('[send-email:send] Query result - error:', templateError ? JSON.stringify(templateError) : 'none');

  if (templateError || !template) {
    console.error('[send-email:send] Template fetch error:', templateError);
    console.error('[send-email:send] Template data:', template);
    throw new Error(`Template not found: ${template_id}. Error: ${templateError?.message || 'No data returned'}`);
  }

  const emailTemplate = template as EmailTemplate & {
    name?: string;
    email_template_json?: string;
  };
  console.log('[send-email:send] Template found:', emailTemplate.name || template_id);

  const templateJsonString = emailTemplate.email_template_json;
  if (!templateJsonString) {
    throw new Error(`Template ${template_id} has no content (Email Template JSON is empty)`);
  }

  // Step 2: Process template placeholders
  // The template is a SendGrid JSON payload with $$placeholder$$ variables
  console.log('[send-email:send] Step 2/3: Processing template placeholders...');

  // Debug: Log template content around problematic positions
  // The error mentions position ~3900, let's show content around that area
  const debugStart = 3850;
  const debugEnd = 3950;
  if (templateJsonString.length > debugEnd) {
    console.log('[send-email:send] === TEMPLATE DEBUG (chars ' + debugStart + '-' + debugEnd + ') ===');
    const debugContent = templateJsonString.substring(debugStart, debugEnd);
    console.log('[send-email:send] Debug content:', JSON.stringify(debugContent));
    // Build character code array without template literal nesting issues
    const charCodes: string[] = [];
    for (let i = 0; i < debugContent.length; i++) {
      const c = debugContent[i];
      const code = c.charCodeAt(0);
      const pos = debugStart + i;
      if (code < 32 || code > 126) {
        charCodes.push(pos + ':0x' + code.toString(16));
      } else {
        charCodes.push(pos + ":'" + c + "'");
      }
    }
    console.log('[send-email:send] Char codes:', charCodes.join(', '));
  }

  // Build the base variables object with explicit payload values
  const baseVariables: Record<string, string> = {
    ...variables,
    // Override with explicit payload values if provided
    to_email: to_email,
    from_email: from_email || DEFAULT_FROM_EMAIL,
    from_name: from_name || DEFAULT_FROM_NAME,
    subject: providedSubject || variables.subject || 'Message from Split Lease',
    // Add current year for footer
    year: new Date().getFullYear().toString(),
  };

  // Add to_name if provided
  if (to_name) {
    baseVariables.to_name = to_name;
  }

  // Normalize variable names to support both underscore and space formats
  // Template uses $$from email$$ but code passes from_email
  const allVariables = normalizeVariableNames(baseVariables);

  // Log placeholder replacements for debugging
  console.log('[send-email:send] Placeholder replacements:', JSON.stringify(allVariables, null, 2));

  // Validate all placeholders have values (warning only)
  const missingPlaceholders = validatePlaceholders(templateJsonString, allVariables);
  if (missingPlaceholders.length > 0) {
    console.warn('[send-email:send] Missing placeholder values:', missingPlaceholders.join(', '));
  }

  // Process placeholders in the entire JSON string (with JSON-safe escaping)
  const processedJsonString = processTemplateJson(templateJsonString, allVariables);
  console.log('[send-email:send] Template processed successfully');
  console.log('[send-email:send] Processed JSON payload:', processedJsonString);

  // Step 3: Parse and send via SendGrid
  console.log('[send-email:send] Step 3/3: Sending via SendGrid...');

  let sendGridBody: Record<string, unknown>;
  try {
    sendGridBody = JSON.parse(processedJsonString);
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    console.error('[send-email:send] ========== JSON PARSE ERROR ==========');
    console.error('[send-email:send] Error:', errorMessage);
    console.error('[send-email:send] JSON length:', processedJsonString.length);
    console.error('[send-email:send] JSON preview (first 2000 chars):', processedJsonString.substring(0, 2000));
    console.error('[send-email:send] JSON preview (last 500 chars):', processedJsonString.substring(processedJsonString.length - 500));
    throw new Error(`Template ${template_id} produced invalid JSON: ${errorMessage}`);
  }

  // Inject CC and BCC recipients into personalizations if provided
  if ((cc_emails && cc_emails.length > 0) || (bcc_emails && bcc_emails.length > 0)) {
    const personalizations = sendGridBody.personalizations as Array<Record<string, unknown>>;
    if (personalizations && personalizations.length > 0) {
      // Add CC recipients
      if (cc_emails && cc_emails.length > 0) {
        const validCcEmails = cc_emails.filter(email => email && email.trim() && email.includes('@'));
        if (validCcEmails.length > 0) {
          personalizations[0].cc = validCcEmails.map(email => ({ email: email.trim() }));
          console.log('[send-email:send] Added CC recipients:', validCcEmails.length);
        }
      }
      // Add BCC recipients
      if (bcc_emails && bcc_emails.length > 0) {
        const validBccEmails = bcc_emails.filter(email => email && email.trim() && email.includes('@'));
        if (validBccEmails.length > 0) {
          personalizations[0].bcc = validBccEmails.map(email => ({ email: email.trim() }));
          console.log('[send-email:send] Added BCC recipients:', validBccEmails.length);
        }
      }
    }
  }

  const sendGridResponse = await sendEmailRaw(sendgridApiKey, sendgridEmailEndpoint, sendGridBody);

  if (!isSuccessResponse(sendGridResponse)) {
    const errorMessage = typeof sendGridResponse.body === 'object'
      ? JSON.stringify(sendGridResponse.body)
      : String(sendGridResponse.body);
    throw new Error(`SendGrid API error (${sendGridResponse.statusCode}): ${errorMessage}`);
  }

  console.log('[send-email:send] ========== SUCCESS ==========');

  // Extract message ID if available
  const messageId = sendGridResponse.body && typeof sendGridResponse.body === 'object'
    ? (sendGridResponse.body as { messageId?: string }).messageId
    : undefined;

  return {
    message_id: messageId,
    template_id: template_id,
    to_email: to_email,
    status: 'sent',
    sent_at: new Date().toISOString(),
  };
}
