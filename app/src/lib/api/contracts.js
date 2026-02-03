// Contract Generator API Client

const CONTRACT_FUNCTION_URL = '/functions/v1/lease-documents';

/**
 * Generate a contract document
 * @param {string} action - The contract generation action
 * @param {object} payload - The contract data
 * @returns {Promise<object>} - The result with document URLs
 */
export async function generateContract(action, payload) {
  const { supabase } = await import('../supabase.js');

  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: { action, payload }
  });

  if (error) {
    throw new Error(`Contract generation failed: ${error.message}`);
  }

  return data;
}

/**
 * List all available contract templates
 * @returns {Promise<Array>} - List of available templates
 */
export async function listTemplates() {
  const { supabase } = await import('../supabase.js');

  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: { action: 'list_templates', payload: {} }
  });

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  return data.templates || [];
}

/**
 * Get template schema for a specific document type
 * @param {string} action - The contract generation action
 * @returns {Promise<object>} - Template schema with fields
 */
export async function getTemplateSchema(action) {
  const { supabase } = await import('../supabase.js');

  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: { action: 'get_template_schema', payload: { action } }
  });

  if (error) {
    throw new Error(`Failed to get template schema: ${error.message}`);
  }

  return data.schema;
}

/**
 * Generate Credit Card Authorization (Prorated)
 * @param {object} payload - Contract data
 * @returns {Promise<object>} - Result with document URLs
 */
export function generateCreditCardAuth(payload) {
  return generateContract('generate_credit_card_auth', payload);
}

/**
 * Generate Credit Card Authorization (Non-Prorated)
 * @param {object} payload - Contract data
 * @returns {Promise<object>} - Result with document URLs
 */
export function generateCreditCardAuthNonProrated(payload) {
  return generateContract('generate_credit_card_auth_nonprorated', payload);
}

/**
 * Generate Host Payout Schedule
 * @param {object} payload - Contract data
 * @returns {Promise<object>} - Result with document URLs
 */
export function generateHostPayout(payload) {
  return generateContract('generate_host_payout', payload);
}

/**
 * Generate Periodic Tenancy Agreement
 * @param {object} payload - Contract data
 * @returns {Promise<object>} - Result with document URLs
 */
export function generatePeriodicTenancy(payload) {
  return generateContract('generate_periodic_tenancy', payload);
}

/**
 * Generate Supplemental Agreement
 * @param {object} payload - Contract data
 * @returns {Promise<object>} - Result with document URLs
 */
export function generateSupplemental(payload) {
  return generateContract('generate_supplemental', payload);
}
