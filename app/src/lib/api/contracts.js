// Lease Documents API Client

const CONTRACT_FUNCTION_PATH = '/functions/v1/lease-documents';
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEFAULT_CONTRACT_FUNCTION_URL = DEFAULT_SUPABASE_URL
  ? `${DEFAULT_SUPABASE_URL}${CONTRACT_FUNCTION_PATH}`
  : null;

export async function invokeLeaseDocuments({
  action,
  payload = {},
  endpointUrl = DEFAULT_CONTRACT_FUNCTION_URL,
  anonKey = DEFAULT_SUPABASE_ANON_KEY
} = {}) {
  if (!action) {
    throw new Error('action is required');
  }

  if (!endpointUrl) {
    throw new Error('Missing Supabase URL for lease-documents');
  }

  if (!anonKey) {
    throw new Error('Missing Supabase anon key for lease-documents');
  }

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey
    },
    body: JSON.stringify({ action, payload })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.error || `Contract generation failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Generate a contract document
 * @param {string} action - The contract generation action
 * @param {object} payload - The contract data
 * @returns {Promise<object>} - The result with document URLs
 */
export async function generateContract(action, payload) {
  return invokeLeaseDocuments({ action, payload });
}

/**
 * List all available contract templates
 * @returns {Promise<Array>} - List of available templates
 */
export async function listTemplates() {
  const data = await invokeLeaseDocuments({
    action: 'list_templates',
    payload: {}
  });

  return data.templates || [];
}

/**
 * Get template schema for a specific document type
 * @param {string} action - The contract generation action
 * @returns {Promise<object>} - Template schema with fields
 */
export async function getTemplateSchema(action) {
  const data = await invokeLeaseDocuments({
    action: 'get_template_schema',
    payload: { action }
  });

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
