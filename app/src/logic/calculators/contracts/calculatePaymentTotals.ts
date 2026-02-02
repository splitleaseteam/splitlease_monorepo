// Payment Totals Calculator for Credit Card Authorization

import { convertCurrencyToFloat, roundDown } from '../../../lib/api/currency';

export interface PaymentTotalsInput {
  fourWeekRent: string;
  maintenanceFee: string;
  damageDeposit: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
}

export interface PaymentTotalsResult {
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
 * Calculate payment totals for credit card authorization
 * Pure function - no side effects
 */
export function calculatePaymentTotals(input: PaymentTotalsInput): PaymentTotalsResult {
  const fourWeekRent = roundDown(convertCurrencyToFloat(input.fourWeekRent));
  const maintenanceFee = roundDown(convertCurrencyToFloat(input.maintenanceFee));
  const damageDeposit = roundDown(convertCurrencyToFloat(input.damageDeposit));
  const splitleaseCredit = roundDown(convertCurrencyToFloat(input.splitleaseCredit));
  const lastPaymentRent = roundDown(convertCurrencyToFloat(input.lastPaymentRent));

  const totalFirstPayment = roundDown(fourWeekRent + maintenanceFee + damageDeposit);
  const totalSecondPayment = roundDown(fourWeekRent + maintenanceFee);
  const totalLastPayment = roundDown(lastPaymentRent + maintenanceFee - splitleaseCredit);

  return {
    fourWeekRent,
    maintenanceFee,
    damageDeposit,
    splitleaseCredit,
    lastPaymentRent,
    totalFirstPayment,
    totalSecondPayment,
    totalLastPayment
  };
}

/**
 * Calculate prorated amount for partial week
 */
export function calculateProratedAmount(weeklyAmount: number, days: number): number {
  return roundDown((weeklyAmount / 7) * days);
}

/**
 * Calculate total payout including maintenance fee
 */
export function calculatePayoutTotal(rent: string, maintenanceFee: string): number {
  const rentAmount = parseFloat(rent.replace(/[$,]/g, '').trim());
  const maintenanceAmount = parseFloat(maintenanceFee.replace(/[$,]/g, '').trim());
  return roundDown(rentAmount + maintenanceAmount);
}
