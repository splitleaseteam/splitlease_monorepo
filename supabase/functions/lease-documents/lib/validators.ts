/**
 * Input Validators for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API payload format.
 * Validates payloads using space-separated keys matching Python's expected input.
 *
 * NO FALLBACK: All validation errors fail fast with descriptive messages.
 */

import { ValidationError } from '../../_shared/errors.ts';
import type {
  HostPayoutPayload,
  SupplementalPayload,
  PeriodicTenancyPayload,
  CreditCardAuthPayload,
  GenerateAllPayload,
} from './types.ts';

// ================================================
// UTILITY VALIDATORS
// ================================================

function requireString(value: unknown, fieldName: string): string {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  return value;
}

function optionalString(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  return value;
}

function optionalStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  return value;
}

// ================================================
// HOST PAYOUT VALIDATOR (Python-compatible)
// ================================================

/**
 * Validates Host Payout payload using Python API field names.
 * Only "Agreement Number" is strictly required per Python implementation.
 */
export function validateHostPayoutPayload(payload: unknown): HostPayoutPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required per Python routes.py
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  // Check for at least one complete payment entry (Python validation)
  let hasPayment = false;
  for (let i = 1; i <= 13; i++) {
    if (p[`Date${i}`] && p[`Rent${i}`] && p[`Total${i}`]) {
      hasPayment = true;
      break;
    }
  }
  if (!hasPayment) {
    throw new ValidationError(
      'At least one complete payment entry (Date, Rent, Total) is required'
    );
  }

  // Build the payload object
  const result: HostPayoutPayload = {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Host Name': optionalString(p['Host Name']),
    'Host Email': optionalString(p['Host Email']),
    'Host Phone': optionalString(p['Host Phone']),
    'Address': optionalString(p['Address']),
    'Payout Number': optionalString(p['Payout Number']),
    'Maintenance Fee': optionalString(p['Maintenance Fee']),
  };

  // Add payment entries
  for (let i = 1; i <= 13; i++) {
    result[`Date${i}`] = optionalStringOrUndefined(p[`Date${i}`]);
    result[`Rent${i}`] = optionalStringOrUndefined(p[`Rent${i}`]);
    result[`Total${i}`] = optionalStringOrUndefined(p[`Total${i}`]);
  }

  return result;
}

// ================================================
// SUPPLEMENTAL AGREEMENT VALIDATOR (Python-compatible)
// ================================================

/**
 * Validates Supplemental Agreement payload using Python API field names.
 */
export function validateSupplementalPayload(payload: unknown): SupplementalPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required per Python routes.py
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  return {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Check in Date': optionalString(p['Check in Date']),
    'Check Out Date': optionalString(p['Check Out Date']),
    'Number of weeks': optionalString(p['Number of weeks']),
    'Guests Allowed': optionalString(p['Guests Allowed']),
    'Host Name': optionalString(p['Host Name']),
    'Listing Title': optionalString(p['Listing Title']),
    'Listing Description': optionalString(p['Listing Description']),
    'Location': optionalString(p['Location']),
    'Type of Space': optionalString(p['Type of Space']),
    'Space Details': optionalString(p['Space Details']),
    'Supplemental Number': optionalString(p['Supplemental Number']),
    'image1': optionalStringOrUndefined(p['image1']),
    'image2': optionalStringOrUndefined(p['image2']),
    'image3': optionalStringOrUndefined(p['image3']),
  };
}

// ================================================
// PERIODIC TENANCY AGREEMENT VALIDATOR (Python-compatible)
// ================================================

/**
 * Validates Periodic Tenancy Agreement payload using Python API field names.
 */
export function validatePeriodicTenancyPayload(payload: unknown): PeriodicTenancyPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required per Python routes.py
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  return {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Check in Date': optionalString(p['Check in Date']),
    'Check Out Date': optionalString(p['Check Out Date']),
    'Check In Day': optionalString(p['Check In Day']),
    'Check Out Day': optionalString(p['Check Out Day']),
    'Number of weeks': optionalString(p['Number of weeks']),
    'Guests Allowed': optionalString(p['Guests Allowed']),
    'Host name': optionalString(p['Host name']), // lowercase 'name' per Python
    'Guest name': optionalString(p['Guest name']), // lowercase 'name' per Python
    'Supplemental Number': optionalString(p['Supplemental Number']),
    'Authorization Card Number': optionalString(p['Authorization Card Number']),
    'Host Payout Schedule Number': optionalString(p['Host Payout Schedule Number']),
    'Extra Requests on Cancellation Policy': optionalStringOrUndefined(
      p['Extra Requests on Cancellation Policy']
    ),
    'Damage Deposit': optionalString(p['Damage Deposit']),
    'Listing Title': optionalString(p['Listing Title']),
    'Listing Description': optionalString(p['Listing Description']),
    'Location': optionalString(p['Location']),
    'Type of Space': optionalString(p['Type of Space']),
    'Space Details': optionalString(p['Space Details']),
    'House Rules': validateHouseRules(p['House Rules']),
    'image1': optionalStringOrUndefined(p['image1']),
    'image2': optionalStringOrUndefined(p['image2']),
    'image3': optionalStringOrUndefined(p['image3']),
  };
}

function validateHouseRules(value: unknown): string | string[] | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

// ================================================
// CREDIT CARD AUTH VALIDATOR (Python-compatible)
// ================================================

/**
 * Validates Credit Card Authorization payload using Python API field names.
 */
export function validateCreditCardAuthPayload(payload: unknown): CreditCardAuthPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required per Python routes.py
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  // Validate currency field (Four Week Rent is validated in Python)
  // Currency values may include $ symbol and commas (e.g., "$3,292.20")
  if (p['Four Week Rent']) {
    try {
      const cleanValue = String(p['Four Week Rent']).replace(/[$,]/g, '');
      if (isNaN(parseFloat(cleanValue))) {
        throw new ValidationError(
          `Invalid currency value for Four Week Rent: ${p['Four Week Rent']}`
        );
      }
    } catch {
      throw new ValidationError(
        `Invalid currency value for Four Week Rent: ${p['Four Week Rent']}`
      );
    }
  }

  // Parse Is Prorated (boolean or string)
  let isProrated: boolean | undefined;
  if (p['Is Prorated'] !== undefined) {
    if (typeof p['Is Prorated'] === 'boolean') {
      isProrated = p['Is Prorated'];
    } else if (typeof p['Is Prorated'] === 'string') {
      isProrated = p['Is Prorated'].toLowerCase() === 'true';
    }
  }

  return {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Host Name': optionalString(p['Host Name']),
    'Guest Name': optionalString(p['Guest Name']),
    'Four Week Rent': optionalString(p['Four Week Rent']),
    'Maintenance Fee': optionalString(p['Maintenance Fee']),
    'Damage Deposit': optionalString(p['Damage Deposit']),
    'Splitlease Credit': optionalString(p['Splitlease Credit']),
    'Last Payment Rent': optionalString(p['Last Payment Rent']),
    'Weeks Number': optionalString(p['Weeks Number']),
    'Listing Description': optionalString(p['Listing Description']),
    'Penultimate Week Number': optionalString(p['Penultimate Week Number']),
    'Number of Payments': optionalString(p['Number of Payments']),
    'Last Payment Weeks': optionalString(p['Last Payment Weeks']),
    'Is Prorated': isProrated,
  };
}

// ================================================
// GENERATE ALL VALIDATOR
// ================================================

/**
 * Validates the combined payload for generating all documents.
 */
export function validateGenerateAllPayload(payload: unknown): GenerateAllPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  return {
    hostPayout: validateHostPayoutPayload(p.hostPayout),
    supplemental: validateSupplementalPayload(p.supplemental),
    periodicTenancy: validatePeriodicTenancyPayload(p.periodicTenancy),
    creditCardAuth: validateCreditCardAuthPayload(p.creditCardAuth),
  };
}
