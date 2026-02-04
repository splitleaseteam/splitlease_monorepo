// Contract Validation Rules

/**
 * Check if a string is a valid currency format
 * Pure function - no side effects
 */
export function isValidCurrency(value: string): boolean {
  if (!value || value.trim() === '') {
    return false;
  }

  try {
    const cleaned = value.replace(/[$,]/g, '').trim();
    const number = parseFloat(cleaned);
    return !isNaN(number) && number >= 0;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid date format (MM/dd/yy or yyyy-MM-dd)
 * Pure function - no side effects
 */
export function isValidDateFormat(value: string): boolean {
  if (!value || value.trim() === '') {
    return false;
  }

  const patterns = [
    /^\d{2}\/\d{2}\/\d{2}$/, // MM/dd/yy
    /^\d{4}-\d{2}-\d{2}$/   // yyyy-MM-dd
  ];

  return patterns.some(pattern => pattern.test(value.trim()));
}

/**
 * Check if all required fields are present
 * Pure function - no side effects
 */
export function hasRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return requiredFields.every(field => {
    const value = data[field];
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Check if payment totals are valid
 * Pure function - no side effects
 */
export function isValidPaymentTotal(total: number): boolean {
  return total >= 0 && Number.isFinite(total);
}

/**
 * Check if credit amount doesn't exceed payment
 * Pure function - no side effects
 */
export function isCreditValid(payment: number, credit: number): boolean {
  return credit >= 0 && credit <= payment;
}
