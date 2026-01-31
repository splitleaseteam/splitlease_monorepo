/**
 * Input Validators for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Provides validation for all document payload types.
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
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required and must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  return value;
}

function requireBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} is required and must be a boolean`);
  }
  return value;
}

function requireArray<T>(value: unknown, fieldName: string): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} is required and must be an array`);
  }
  return value as T[];
}

// ================================================
// HOST PAYOUT VALIDATOR
// ================================================

export function validateHostPayoutPayload(payload: unknown): HostPayoutPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  return {
    agreementNumber: requireString(p.agreementNumber, 'agreementNumber'),
    hostName: requireString(p.hostName, 'hostName'),
    hostEmail: requireString(p.hostEmail, 'hostEmail'),
    hostPhone: requireString(p.hostPhone, 'hostPhone'),
    address: requireString(p.address, 'address'),
    payoutNumber: requireString(p.payoutNumber, 'payoutNumber'),
    maintenanceFee: requireString(p.maintenanceFee, 'maintenanceFee'),
    payments: validatePaymentEntries(p.payments),
  };
}

function validatePaymentEntries(
  payments: unknown
): Array<{ date: string; rent: string; total: string }> {
  if (!Array.isArray(payments)) {
    throw new ValidationError('payments must be an array');
  }

  if (payments.length > 13) {
    throw new ValidationError('payments array cannot exceed 13 entries');
  }

  return payments.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new ValidationError(`payments[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    return {
      date: optionalString(e.date) || '',
      rent: optionalString(e.rent) || '',
      total: optionalString(e.total) || '',
    };
  });
}

// ================================================
// SUPPLEMENTAL AGREEMENT VALIDATOR
// ================================================

export function validateSupplementalPayload(payload: unknown): SupplementalPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  return {
    agreementNumber: requireString(p.agreementNumber, 'agreementNumber'),
    checkInDate: requireString(p.checkInDate, 'checkInDate'),
    checkOutDate: requireString(p.checkOutDate, 'checkOutDate'),
    numberOfWeeks: requireString(p.numberOfWeeks, 'numberOfWeeks'),
    guestsAllowed: requireString(p.guestsAllowed, 'guestsAllowed'),
    hostName: requireString(p.hostName, 'hostName'),
    listingTitle: requireString(p.listingTitle, 'listingTitle'),
    listingDescription: requireString(p.listingDescription, 'listingDescription'),
    location: requireString(p.location, 'location'),
    typeOfSpace: requireString(p.typeOfSpace, 'typeOfSpace'),
    spaceDetails: requireString(p.spaceDetails, 'spaceDetails'),
    supplementalNumber: requireString(p.supplementalNumber, 'supplementalNumber'),
    image1Url: optionalString(p.image1Url),
    image2Url: optionalString(p.image2Url),
    image3Url: optionalString(p.image3Url),
  };
}

// ================================================
// PERIODIC TENANCY AGREEMENT VALIDATOR
// ================================================

export function validatePeriodicTenancyPayload(payload: unknown): PeriodicTenancyPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  return {
    agreementNumber: requireString(p.agreementNumber, 'agreementNumber'),
    checkInDate: requireString(p.checkInDate, 'checkInDate'),
    checkOutDate: requireString(p.checkOutDate, 'checkOutDate'),
    checkInDay: requireString(p.checkInDay, 'checkInDay'),
    checkOutDay: requireString(p.checkOutDay, 'checkOutDay'),
    numberOfWeeks: requireString(p.numberOfWeeks, 'numberOfWeeks'),
    guestsAllowed: requireString(p.guestsAllowed, 'guestsAllowed'),
    hostName: requireString(p.hostName, 'hostName'),
    guestName: requireString(p.guestName, 'guestName'),
    supplementalNumber: requireString(p.supplementalNumber, 'supplementalNumber'),
    authorizationCardNumber: requireString(p.authorizationCardNumber, 'authorizationCardNumber'),
    hostPayoutScheduleNumber: requireString(p.hostPayoutScheduleNumber, 'hostPayoutScheduleNumber'),
    extraRequestsOnCancellationPolicy: optionalString(p.extraRequestsOnCancellationPolicy),
    damageDeposit: requireString(p.damageDeposit, 'damageDeposit'),
    listingTitle: requireString(p.listingTitle, 'listingTitle'),
    listingDescription: requireString(p.listingDescription, 'listingDescription'),
    location: requireString(p.location, 'location'),
    typeOfSpace: requireString(p.typeOfSpace, 'typeOfSpace'),
    spaceDetails: requireString(p.spaceDetails, 'spaceDetails'),
    houseRules: validateHouseRules(p.houseRules),
    image1Url: optionalString(p.image1Url),
    image2Url: optionalString(p.image2Url),
    image3Url: optionalString(p.image3Url),
  };
}

function validateHouseRules(value: unknown): string | string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

// ================================================
// CREDIT CARD AUTH VALIDATOR
// ================================================

export function validateCreditCardAuthPayload(payload: unknown): CreditCardAuthPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  return {
    agreementNumber: requireString(p.agreementNumber, 'agreementNumber'),
    hostName: requireString(p.hostName, 'hostName'),
    guestName: requireString(p.guestName, 'guestName'),
    weeksNumber: requireString(p.weeksNumber, 'weeksNumber'),
    listingDescription: requireString(p.listingDescription, 'listingDescription'),
    numberOfPayments: requireString(p.numberOfPayments, 'numberOfPayments'),
    fourWeekRent: requireString(p.fourWeekRent, 'fourWeekRent'),
    damageDeposit: requireString(p.damageDeposit, 'damageDeposit'),
    maintenanceFee: requireString(p.maintenanceFee, 'maintenanceFee'),
    splitleaseCredit: requireString(p.splitleaseCredit, 'splitleaseCredit'),
    lastPaymentRent: requireString(p.lastPaymentRent, 'lastPaymentRent'),
    penultimateWeekNumber: requireString(p.penultimateWeekNumber, 'penultimateWeekNumber'),
    lastPaymentWeeks: requireString(p.lastPaymentWeeks, 'lastPaymentWeeks'),
    isProrated: requireBoolean(p.isProrated, 'isProrated'),
  };
}

// ================================================
// GENERATE ALL VALIDATOR
// ================================================

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
