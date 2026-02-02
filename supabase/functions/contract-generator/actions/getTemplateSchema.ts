// Get Template Schema Action

import { getTemplateByAction as _getTemplateByAction } from '../lib/storage.ts';

export interface SchemaResult {
  success: boolean;
  schema?: TemplateSchema;
  error?: string;
}

export interface TemplateSchema {
  name: string;
  description: string;
  action: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'textarea' | 'array';
  label: string;
  required: boolean;
  description?: string;
  placeholder?: string;
}

// Schemas for each document type
const SCHEMAS: Record<string, TemplateSchema> = {
  generate_credit_card_auth: {
    name: 'Credit Card Authorization (Prorated)',
    description: 'Recurring credit card authorization form with prorated payments',
    action: 'generate_credit_card_auth',
    fields: [
      { name: 'agreementNumber', type: 'text', label: 'Agreement Number', required: true, description: 'Unique identifier for the agreement' },
      { name: 'hostName', type: 'text', label: 'Host Name', required: true },
      { name: 'guestName', type: 'text', label: 'Guest Name', required: true },
      { name: 'fourWeekRent', type: 'currency', label: 'Four Week Rent', required: true, placeholder: '$1,000.00' },
      { name: 'maintenanceFee', type: 'currency', label: 'Maintenance Fee', required: true, placeholder: '$100.00' },
      { name: 'damageDeposit', type: 'currency', label: 'Damage Deposit', required: true, placeholder: '$500.00' },
      { name: 'splitleaseCredit', type: 'currency', label: 'Splitlease Credit', required: true, placeholder: '$0.00' },
      { name: 'lastPaymentRent', type: 'currency', label: 'Last Payment Rent', required: true, placeholder: '$1,000.00' },
      { name: 'weeksNumber', type: 'number', label: 'Weeks Number', required: true, description: 'Total number of weeks' },
      { name: 'listingDescription', type: 'textarea', label: 'Listing Description', required: true },
      { name: 'penultimateWeekNumber', type: 'number', label: 'Penultimate Week Number', required: true, description: 'Week number of the penultimate payment' },
      { name: 'numberOfPayments', type: 'number', label: 'Number of Payments', required: true },
      { name: 'lastPaymentWeeks', type: 'number', label: 'Last Payment Weeks', required: true, description: 'Number of weeks in the last payment' }
    ]
  },
  generate_credit_card_auth_nonprorated: {
    name: 'Credit Card Authorization (Non-Prorated)',
    description: 'Recurring credit card authorization form with standard payments',
    action: 'generate_credit_card_auth_nonprorated',
    fields: [
      { name: 'agreementNumber', type: 'text', label: 'Agreement Number', required: true },
      { name: 'hostName', type: 'text', label: 'Host Name', required: true },
      { name: 'guestName', type: 'text', label: 'Guest Name', required: true },
      { name: 'fourWeekRent', type: 'currency', label: 'Four Week Rent', required: true, placeholder: '$1,000.00' },
      { name: 'maintenanceFee', type: 'currency', label: 'Maintenance Fee', required: true, placeholder: '$100.00' },
      { name: 'damageDeposit', type: 'currency', label: 'Damage Deposit', required: true, placeholder: '$500.00' },
      { name: 'splitleaseCredit', type: 'currency', label: 'Splitlease Credit', required: true, placeholder: '$0.00' },
      { name: 'lastPaymentRent', type: 'currency', label: 'Last Payment Rent', required: true, placeholder: '$1,000.00' },
      { name: 'weeksNumber', type: 'number', label: 'Weeks Number', required: true },
      { name: 'listingDescription', type: 'textarea', label: 'Listing Description', required: true },
      { name: 'penultimateWeekNumber', type: 'number', label: 'Penultimate Week Number', required: true },
      { name: 'numberOfPayments', type: 'number', label: 'Number of Payments', required: true },
      { name: 'lastPaymentWeeks', type: 'number', label: 'Last Payment Weeks', required: true }
    ]
  },
  generate_host_payout: {
    name: 'Host Payout Schedule',
    description: 'Host payout schedule form with up to 13 payment periods',
    action: 'generate_host_payout',
    fields: [
      { name: 'agreementNumber', type: 'text', label: 'Agreement Number', required: true },
      { name: 'hostName', type: 'text', label: 'Host Name', required: true },
      { name: 'hostEmail', type: 'text', label: 'Host Email', required: true, placeholder: 'host@example.com' },
      { name: 'hostPhone', type: 'text', label: 'Host Phone', required: true, placeholder: '(555) 123-4567' },
      { name: 'address', type: 'textarea', label: 'Address', required: true },
      { name: 'payoutNumber', type: 'text', label: 'Payout Number', required: true },
      { name: 'maintenanceFee', type: 'currency', label: 'Maintenance Fee', required: true, placeholder: '$100.00' },
      { name: 'periods', type: 'array', label: 'Payout Periods', required: true, description: 'Array of up to 13 payout periods with date, rent, and total' }
    ]
  },
  generate_periodic_tenancy: {
    name: 'Periodic Tenancy Agreement',
    description: 'Full periodic tenancy agreement with image support',
    action: 'generate_periodic_tenancy',
    fields: [
      { name: 'agreementNumber', type: 'text', label: 'Agreement Number', required: true },
      { name: 'checkInDate', type: 'date', label: 'Check In Date', required: true, placeholder: 'MM/DD/YY' },
      { name: 'checkOutDate', type: 'date', label: 'Check Out Date', required: true, placeholder: 'MM/DD/YY' },
      { name: 'checkInDay', type: 'text', label: 'Check In Day', required: true, description: 'Day of week (e.g., Monday)' },
      { name: 'checkOutDay', type: 'text', label: 'Check Out Day', required: true, description: 'Day of week (e.g., Friday)' },
      { name: 'numberOfWeeks', type: 'number', label: 'Number of Weeks', required: true },
      { name: 'guestsAllowed', type: 'number', label: 'Guests Allowed', required: true },
      { name: 'hostName', type: 'text', label: 'Host Name', required: true },
      { name: 'guestName', type: 'text', label: 'Guest Name', required: true },
      { name: 'supplementalNumber', type: 'text', label: 'Supplemental Number', required: true },
      { name: 'authorizationCardNumber', type: 'text', label: 'Authorization Card Number', required: true },
      { name: 'hostPayoutScheduleNumber', type: 'text', label: 'Host Payout Schedule Number', required: true },
      { name: 'cancellationPolicyRest', type: 'textarea', label: 'Cancellation Policy Rest', required: true },
      { name: 'damageDeposit', type: 'currency', label: 'Damage Deposit', required: true, placeholder: '$500.00' },
      { name: 'listingTitle', type: 'text', label: 'Listing Title', required: true },
      { name: 'spaceDetails', type: 'textarea', label: 'Space Details', required: true },
      { name: 'listingDescription', type: 'textarea', label: 'Listing Description', required: true },
      { name: 'location', type: 'text', label: 'Location', required: true },
      { name: 'typeOfSpace', type: 'text', label: 'Type of Space', required: true },
      { name: 'houseRules', type: 'textarea', label: 'House Rules', required: true, description: 'JSON array or newline-separated list' },
      { name: 'image1', type: 'text', label: 'Image 1', required: false, description: 'Base64 or URL' },
      { name: 'image2', type: 'text', label: 'Image 2', required: false, description: 'Base64 or URL' },
      { name: 'image3', type: 'text', label: 'Image 3', required: false, description: 'Base64 or URL' }
    ]
  },
  generate_supplemental: {
    name: 'Supplemental Agreement',
    description: 'Supplemental agreement addendum',
    action: 'generate_supplemental',
    fields: [
      { name: 'agreementNumber', type: 'text', label: 'Agreement Number', required: true },
      { name: 'checkInDate', type: 'date', label: 'Check In Date', required: true, placeholder: 'MM/DD/YY' },
      { name: 'checkOutDate', type: 'date', label: 'Check Out Date', required: true, placeholder: 'MM/DD/YY' },
      { name: 'numberOfWeeks', type: 'number', label: 'Number of Weeks', required: true },
      { name: 'guestsAllowed', type: 'number', label: 'Guests Allowed', required: true },
      { name: 'hostName', type: 'text', label: 'Host Name', required: true },
      { name: 'listingDescription', type: 'textarea', label: 'Listing Description', required: true },
      { name: 'listingTitle', type: 'text', label: 'Listing Title', required: true },
      { name: 'spaceDetails', type: 'textarea', label: 'Space Details', required: true },
      { name: 'location', type: 'text', label: 'Location', required: true },
      { name: 'typeOfSpace', type: 'text', label: 'Type of Space', required: true },
      { name: 'supplementalNumber', type: 'text', label: 'Supplemental Number', required: true },
      { name: 'image1', type: 'text', label: 'Image 1', required: false, description: 'Base64 or URL' },
      { name: 'image2', type: 'text', label: 'Image 2', required: false, description: 'Base64 or URL' },
      { name: 'image3', type: 'text', label: 'Image 3', required: false, description: 'Base64 or URL' }
    ]
  }
};

/**
 * Get template schema for a specific document type
 */
export function handleGetTemplateSchema(action: string): Promise<SchemaResult> {
  const schema = SCHEMAS[action];

  if (!schema) {
    return {
      success: false,
      error: `Unknown action: ${action}`
    };
  }

  return {
    success: true,
    schema
  };
}

/**
 * Get all available schemas
 */
export function getAllSchemas(): Record<string, TemplateSchema> {
  return SCHEMAS;
}
