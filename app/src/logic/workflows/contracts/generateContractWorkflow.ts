// Contract Generation Workflow

import { calculatePaymentTotals } from '../../calculators/contracts/calculatePaymentTotals';
import { formatCurrencyForTemplate, formatDateForTemplate, processHouseRules, processImageForTemplate } from '../../processors/contracts/formatCurrencyForTemplate';

export interface ContractGenerationInput {
  action: string;
  payload: Record<string, unknown>;
}

export interface ContractGenerationResult {
  success: boolean;
  data?: {
    filename: string;
    downloadUrl: string;
    driveUrl?: string;
    driveFileId?: string;
  };
  error?: string;
}

/**
 * Main workflow for contract generation
 * Orchestrates validation, calculation, processing, and document creation
 */
export async function generateContractWorkflow(
  input: ContractGenerationInput,
  context: {
    supabase: any;
    renderTemplate: (template: Uint8Array, data: Record<string, unknown>) => Promise<Uint8Array>;
    uploadToStorage: (filename: string, data: Uint8Array) => Promise<string>;
    uploadToDrive?: (filename: string, data: Uint8Array) => Promise<{ webViewLink?: string; fileId?: string }>;
  }
): Promise<ContractGenerationResult> {
  try {
    // Step 1: Determine template based on action
    const templateFilename = getTemplateFilename(input.action);
    const templateBytes = await loadTemplate(context.supabase, templateFilename);

    // Step 2: Process and validate payload
    const processedPayload = await processPayload(input.action, input.payload);

    // Step 3: Render document
    const documentBytes = await context.renderTemplate(templateBytes, processedPayload);

    // Step 4: Generate filename
    const filename = generateFilename(input.action, getIdentifier(processedPayload));

    // Step 5: Upload to Supabase Storage
    const downloadUrl = await context.uploadToStorage(filename, documentBytes);

    // Step 6: Upload to Google Drive (optional)
    let driveUrl: string | undefined;
    let driveFileId: string | undefined;
    if (context.uploadToDrive) {
      const driveResult = await context.uploadToDrive(filename, documentBytes);
      driveUrl = driveResult.webViewLink;
      driveFileId = driveResult.fileId;
    }

    return {
      success: true,
      data: {
        filename,
        downloadUrl,
        driveUrl,
        driveFileId
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get template filename for action
 */
function getTemplateFilename(action: string): string {
  const templates: Record<string, string> = {
    'generate_credit_card_auth': 'recurringcreditcardauthorizationprorated.docx',
    'generate_credit_card_auth_nonprorated': 'recurringcreditcardauthorization.docx',
    'generate_host_payout': 'hostpayoutscheduleform.docx',
    'generate_periodic_tenancy': 'periodictenancyagreement.docx',
    'generate_supplemental': 'supplementalagreement.docx'
  };

  const filename = templates[action];
  if (!filename) {
    throw new Error(`Unknown action: ${action}`);
  }

  return filename;
}

/**
 * Load template from Supabase Storage
 */
async function loadTemplate(supabase: any, filename: string): Promise<Uint8Array> {
  const { data, error } = await supabase
    .storage
    .from('contract-templates')
    .download(filename);

  if (error) {
    throw new Error(`Failed to load template: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Template not found: ${filename}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Process payload based on action type
 */
async function processPayload(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  switch (action) {
    case 'generate_credit_card_auth':
    case 'generate_credit_card_auth_nonprorated':
      return processCreditCardAuthPayload(payload);

    case 'generate_host_payout':
      return processHostPayoutPayload(payload);

    case 'generate_periodic_tenancy':
      return await processPeriodicTenancyPayload(payload);

    case 'generate_supplemental':
      return await processSupplementalPayload(payload);

    default:
      return payload;
  }
}

/**
 * Process credit card auth payload
 */
function processCreditCardAuthPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const input = {
    fourWeekRent: String(payload.fourWeekRent || '0'),
    maintenanceFee: String(payload.maintenanceFee || '0'),
    damageDeposit: String(payload.damageDeposit || '0'),
    splitleaseCredit: String(payload.splitleaseCredit || '0'),
    lastPaymentRent: String(payload.lastPaymentRent || '0')
  };

  const totals = calculatePaymentTotals(input);

  return {
    agreement_number: payload.agreementNumber,
    host_name: payload.hostName,
    guest_name: payload.guestName,
    maintenancefee: formatCurrencyForTemplate(totals.maintenanceFee),
    weeks_number: payload.weeksNumber,
    ListingDescription: payload.listingDescription,
    fourweekrent: formatCurrencyForTemplate(totals.fourWeekRent),
    damagedeposit: formatCurrencyForTemplate(totals.damageDeposit),
    totalfirstpayment: formatCurrencyForTemplate(totals.totalFirstPayment),
    penultimateweeknumber: payload.penultimateWeekNumber,
    totalsecondpayment: formatCurrencyForTemplate(totals.totalSecondPayment),
    slcredit: formatCurrencyForTemplate(totals.splitleaseCredit),
    lastpaymenttotal: formatCurrencyForTemplate(totals.totalLastPayment),
    numberofpayments: payload.numberOfPayments,
    lastpaymentweeks: payload.lastPaymentWeeks,
    lastpaymentrent: formatCurrencyForTemplate(totals.lastPaymentRent)
  };
}

/**
 * Process host payout payload
 */
function processHostPayoutPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const maintenanceFee = formatCurrencyForTemplate(
    parseFloat(String(payload.maintenanceFee || '0').replace(/[$,]/g, ''))
  );

  const periods = Array.isArray(payload.periods) ? payload.periods : [];

  const result: Record<string, unknown> = {
    address: payload.address,
    agreement_number: payload.agreementNumber,
    host_email: payload.hostEmail,
    host_name: payload.hostName,
    host_phone: payload.hostPhone,
    payout_number: payload.payoutNumber
  };

  // Add up to 13 periods
  for (let i = 0; i < 13; i++) {
    const period = periods[i];
    const index = i + 1;

    if (period && typeof period === 'object') {
      const rent = parseFloat(String((period as Record<string, unknown>).rent || '0').replace(/[$,]/g, ''));
      const total = parseFloat(String((period as Record<string, unknown>).total || '0').replace(/[$,]/g, ''));

      result[`date${index}`] = (period as Record<string, unknown>).date;
      result[`rent${index}`] = formatCurrencyForTemplate(rent);
      result[`total${index}`] = formatCurrencyForTemplate(total);
      result[`maintenance_fee${index}`] = maintenanceFee;
    } else {
      result[`date${index}`] = '';
      result[`rent${index}`] = '';
      result[`total${index}`] = '';
      result[`maintenance_fee${index}`] = '';
    }
  }

  return result;
}

/**
 * Process periodic tenancy payload
 */
async function processPeriodicTenancyPayload(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const damageDeposit = formatCurrencyForTemplate(
    parseFloat(String(payload.damageDeposit || '0').replace(/[$,]/g, ''))
  );

  return {
    agreement_number: payload.agreementNumber,
    start_date: formatDateForTemplate(new Date(String(payload.checkInDate))),
    end_date: formatDateForTemplate(new Date(String(payload.checkOutDate))),
    check_in: payload.checkInDay,
    check_out: payload.checkOutDay,
    week_duration: payload.numberOfWeeks,
    guests_allowed: payload.guestsAllowed,
    host_name: payload.hostName,
    guest_name: payload.guestName,
    supplemental_number: payload.supplementalNumber,
    credit_card_form_number: payload.authorizationCardNumber,
    payout_number: payload.hostPayoutScheduleNumber,
    cancellation_policy_rest: payload.cancellationPolicyRest,
    damage_deposit: damageDeposit,
    listing_title: payload.listingTitle,
    spacedetails: payload.spaceDetails,
    listing_description: payload.listingDescription,
    location: payload.location,
    type_of_space: payload.typeOfSpace,
    House_rules_items: processHouseRules(String(payload.houseRules || ''))
  };
}

/**
 * Process supplemental payload
 */
async function processSupplementalPayload(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return {
    agreement_number: payload.agreementNumber,
    start_date: formatDateForTemplate(new Date(String(payload.checkInDate))),
    end_date: formatDateForTemplate(new Date(String(payload.checkOutDate))),
    weeks_number: payload.numberOfWeeks,
    guest_allowed: payload.guestsAllowed,
    guests_allowed: payload.guestsAllowed,
    host_name: payload.hostName,
    listing_description: payload.listingDescription,
    listing_title: payload.listingTitle,
    spacedetails: payload.spaceDetails,
    location: payload.location,
    type_of_space: payload.typeOfSpace,
    supplement_number: payload.supplementalNumber
  };
}

/**
 * Generate filename for document
 */
function generateFilename(action: string, identifier: string): string {
  const actionMap: Record<string, string> = {
    'generate_credit_card_auth': 'credit-card-auth-prorated',
    'generate_credit_card_auth_nonprorated': 'credit-card-auth-nonprorated',
    'generate_host_payout': 'host-payout-schedule',
    'generate_periodic_tenancy': 'periodic-tenancy-agreement',
    'generate_supplemental': 'supplemental-agreement'
  };

  const docType = actionMap[action] || 'contract';
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${docType}-${safeIdentifier}-${timestamp}.docx`;
}

/**
 * Extract identifier from processed payload
 */
function getIdentifier(payload: Record<string, unknown>): string {
  return String(payload.agreement_number || payload.agreementNumber || 'unknown');
}
