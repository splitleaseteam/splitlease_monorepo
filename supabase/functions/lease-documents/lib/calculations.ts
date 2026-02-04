/**
 * Payment Calculations for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Provides payment calculation utilities for credit card authorization forms.
 * Mirrors the Python implementation's calculation logic.
 */

import { parseCurrency } from './formatters.ts';

// ================================================
// ROUNDING
// ================================================

/**
 * Round down to 2 decimal places.
 * Example: 1028.589 -> 1028.58
 */
export function roundDown(value: number): number {
  return Math.floor(value * 100) / 100;
}

// ================================================
// PAYMENT CALCULATIONS
// ================================================

export interface PaymentCalculationInput {
  fourWeekRent: string;
  maintenanceFee: string;
  damageDeposit: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
}

export interface PaymentCalculationResult {
  fourWeekRent: number;
  maintenanceFee: number;
  damageDeposit: number;
  splitleaseCredit: number;
  lastPaymentRent: number;
  totalFirstPayment: number;
  totalSecondPayment: number;
  totalLastPayment: number;
}

/**
 * Calculate payment totals for credit card authorization forms.
 *
 * Formulas:
 * - First Payment = Four Week Rent + Maintenance Fee + Damage Deposit
 * - Second Payment = Four Week Rent + Maintenance Fee
 * - Last Payment = Last Payment Rent + Maintenance Fee - Split Lease Credit
 */
export function calculatePayments(input: PaymentCalculationInput): PaymentCalculationResult {
  // Parse all currency values
  const fourWeekRent = parseCurrency(input.fourWeekRent);
  const maintenanceFee = parseCurrency(input.maintenanceFee);
  const damageDeposit = parseCurrency(input.damageDeposit);
  const splitleaseCredit = parseCurrency(input.splitleaseCredit);
  const lastPaymentRent = parseCurrency(input.lastPaymentRent);

  // Validate all values were parsed successfully
  if (fourWeekRent === null) {
    throw new Error(`Invalid fourWeekRent value: ${input.fourWeekRent}`);
  }
  if (maintenanceFee === null) {
    throw new Error(`Invalid maintenanceFee value: ${input.maintenanceFee}`);
  }
  if (damageDeposit === null) {
    throw new Error(`Invalid damageDeposit value: ${input.damageDeposit}`);
  }
  if (splitleaseCredit === null) {
    throw new Error(`Invalid splitleaseCredit value: ${input.splitleaseCredit}`);
  }
  if (lastPaymentRent === null) {
    throw new Error(`Invalid lastPaymentRent value: ${input.lastPaymentRent}`);
  }

  // Round down all values
  const roundedFourWeekRent = roundDown(fourWeekRent);
  const roundedMaintenanceFee = roundDown(maintenanceFee);
  const roundedDamageDeposit = roundDown(damageDeposit);
  const roundedSplitleaseCredit = roundDown(splitleaseCredit);
  const roundedLastPaymentRent = roundDown(lastPaymentRent);

  // Calculate totals
  const totalFirstPayment = roundDown(
    roundedFourWeekRent + roundedMaintenanceFee + roundedDamageDeposit
  );
  const totalSecondPayment = roundDown(
    roundedFourWeekRent + roundedMaintenanceFee
  );
  const totalLastPayment = roundDown(
    roundedLastPaymentRent + roundedMaintenanceFee - roundedSplitleaseCredit
  );

  return {
    fourWeekRent: roundedFourWeekRent,
    maintenanceFee: roundedMaintenanceFee,
    damageDeposit: roundedDamageDeposit,
    splitleaseCredit: roundedSplitleaseCredit,
    lastPaymentRent: roundedLastPaymentRent,
    totalFirstPayment,
    totalSecondPayment,
    totalLastPayment,
  };
}
