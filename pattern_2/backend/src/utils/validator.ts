/**
 * Validation Utilities for Urgency Pricing
 *
 * Production-ready validation for all urgency pricing inputs
 * Comprehensive error checking with detailed error messages
 */

import {
  UrgencyContext,
  PricingCalculationRequest,
  ValidationResult,
  ValidationError,
  URGENCY_CONSTANTS,
} from '../types/urgency.types';
import { DateUtils } from './dateUtils';

export class UrgencyValidator {
  /**
   * Validate urgency context
   *
   * @param context - Urgency context to validate
   * @returns Validation result
   */
  static validateUrgencyContext(context: UrgencyContext): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate dates
    if (!context.targetDate || !(context.targetDate instanceof Date)) {
      errors.push({
        field: 'targetDate',
        message: 'Target date must be a valid Date object',
        value: context.targetDate,
      });
    } else if (isNaN(context.targetDate.getTime())) {
      errors.push({
        field: 'targetDate',
        message: 'Target date is invalid',
        value: context.targetDate,
      });
    }

    if (!context.currentDate || !(context.currentDate instanceof Date)) {
      errors.push({
        field: 'currentDate',
        message: 'Current date must be a valid Date object',
        value: context.currentDate,
      });
    } else if (isNaN(context.currentDate.getTime())) {
      errors.push({
        field: 'currentDate',
        message: 'Current date is invalid',
        value: context.currentDate,
      });
    }

    // Validate date relationship
    if (
      context.targetDate &&
      context.currentDate &&
      context.targetDate <= context.currentDate
    ) {
      errors.push({
        field: 'targetDate',
        message: 'Target date must be in the future',
        value: {
          targetDate: context.targetDate,
          currentDate: context.currentDate,
        },
      });
    }

    // Validate days until check-in
    if (
      typeof context.daysUntilCheckIn !== 'number' ||
      context.daysUntilCheckIn < 0
    ) {
      errors.push({
        field: 'daysUntilCheckIn',
        message: 'Days until check-in must be a non-negative number',
        value: context.daysUntilCheckIn,
      });
    }

    // Validate hours until check-in
    if (
      typeof context.hoursUntilCheckIn !== 'number' ||
      context.hoursUntilCheckIn < 0
    ) {
      errors.push({
        field: 'hoursUntilCheckIn',
        message: 'Hours until check-in must be a non-negative number',
        value: context.hoursUntilCheckIn,
      });
    }

    // Validate base price
    if (typeof context.basePrice !== 'number' || context.basePrice <= 0) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be a positive number',
        value: context.basePrice,
      });
    }

    if (context.basePrice > 100000) {
      errors.push({
        field: 'basePrice',
        message: 'Base price exceeds reasonable limit (100,000)',
        value: context.basePrice,
      });
    }

    // Validate urgency steepness
    if (
      typeof context.urgencySteepness !== 'number' ||
      context.urgencySteepness <= 0
    ) {
      errors.push({
        field: 'urgencySteepness',
        message: 'Urgency steepness must be a positive number',
        value: context.urgencySteepness,
      });
    }

    if (context.urgencySteepness > 5.0) {
      errors.push({
        field: 'urgencySteepness',
        message: 'Urgency steepness exceeds reasonable limit (5.0)',
        value: context.urgencySteepness,
      });
    }

    // Validate market demand multiplier
    if (
      typeof context.marketDemandMultiplier !== 'number' ||
      context.marketDemandMultiplier <= 0
    ) {
      errors.push({
        field: 'marketDemandMultiplier',
        message: 'Market demand multiplier must be a positive number',
        value: context.marketDemandMultiplier,
      });
    }

    if (
      context.marketDemandMultiplier < 0.1 ||
      context.marketDemandMultiplier > 10.0
    ) {
      errors.push({
        field: 'marketDemandMultiplier',
        message: 'Market demand multiplier out of reasonable range (0.1 - 10.0)',
        value: context.marketDemandMultiplier,
      });
    }

    // Validate lookback window (if provided)
    if (context.lookbackWindow !== undefined) {
      if (
        typeof context.lookbackWindow !== 'number' ||
        context.lookbackWindow <= 0
      ) {
        errors.push({
          field: 'lookbackWindow',
          message: 'Lookback window must be a positive number',
          value: context.lookbackWindow,
        });
      }

      if (context.lookbackWindow > 365) {
        errors.push({
          field: 'lookbackWindow',
          message: 'Lookback window exceeds reasonable limit (365 days)',
          value: context.lookbackWindow,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate pricing calculation request
   *
   * @param request - Pricing calculation request
   * @returns Validation result
   */
  static validatePricingRequest(
    request: PricingCalculationRequest
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate target date
    if (!request.targetDate) {
      errors.push({
        field: 'targetDate',
        message: 'Target date is required',
        value: request.targetDate,
      });
    } else {
      let targetDate: Date;

      if (typeof request.targetDate === 'string') {
        targetDate = new Date(request.targetDate);
        if (isNaN(targetDate.getTime())) {
          errors.push({
            field: 'targetDate',
            message: 'Target date string is invalid',
            value: request.targetDate,
          });
        }
      } else if (request.targetDate instanceof Date) {
        if (isNaN(request.targetDate.getTime())) {
          errors.push({
            field: 'targetDate',
            message: 'Target date is invalid',
            value: request.targetDate,
          });
        } else {
          targetDate = request.targetDate;
        }
      } else {
        errors.push({
          field: 'targetDate',
          message: 'Target date must be a Date object or ISO string',
          value: request.targetDate,
        });
      }

      // Check if target date is in the future
      if (targetDate! && !isNaN(targetDate!.getTime())) {
        const currentDate = request.currentDate || new Date();
        if (targetDate <= currentDate) {
          errors.push({
            field: 'targetDate',
            message: 'Target date must be in the future',
            value: {
              targetDate: targetDate.toISOString(),
              currentDate: currentDate.toISOString(),
            },
          });
        }
      }
    }

    // Validate base price
    if (typeof request.basePrice !== 'number') {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be a number',
        value: request.basePrice,
      });
    } else if (request.basePrice <= 0) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be positive',
        value: request.basePrice,
      });
    } else if (request.basePrice > 100000) {
      errors.push({
        field: 'basePrice',
        message: 'Base price exceeds reasonable limit (100,000)',
        value: request.basePrice,
      });
    }

    // Validate urgency steepness (if provided)
    if (request.urgencySteepness !== undefined) {
      if (
        typeof request.urgencySteepness !== 'number' ||
        request.urgencySteepness <= 0
      ) {
        errors.push({
          field: 'urgencySteepness',
          message: 'Urgency steepness must be a positive number',
          value: request.urgencySteepness,
        });
      } else if (request.urgencySteepness > 5.0) {
        errors.push({
          field: 'urgencySteepness',
          message: 'Urgency steepness exceeds reasonable limit (5.0)',
          value: request.urgencySteepness,
        });
      }
    }

    // Validate market demand multiplier (if provided)
    if (request.marketDemandMultiplier !== undefined) {
      if (
        typeof request.marketDemandMultiplier !== 'number' ||
        request.marketDemandMultiplier <= 0
      ) {
        errors.push({
          field: 'marketDemandMultiplier',
          message: 'Market demand multiplier must be a positive number',
          value: request.marketDemandMultiplier,
        });
      } else if (
        request.marketDemandMultiplier < 0.1 ||
        request.marketDemandMultiplier > 10.0
      ) {
        errors.push({
          field: 'marketDemandMultiplier',
          message:
            'Market demand multiplier out of reasonable range (0.1 - 10.0)',
          value: request.marketDemandMultiplier,
        });
      }
    }

    // Validate lookback window (if provided)
    if (request.lookbackWindow !== undefined) {
      if (
        typeof request.lookbackWindow !== 'number' ||
        request.lookbackWindow <= 0
      ) {
        errors.push({
          field: 'lookbackWindow',
          message: 'Lookback window must be a positive number',
          value: request.lookbackWindow,
        });
      } else if (request.lookbackWindow > 365) {
        errors.push({
          field: 'lookbackWindow',
          message: 'Lookback window exceeds reasonable limit (365 days)',
          value: request.lookbackWindow,
        });
      }
    }

    // Validate projection days ahead (if provided)
    if (request.projectionDaysAhead !== undefined) {
      if (!Array.isArray(request.projectionDaysAhead)) {
        errors.push({
          field: 'projectionDaysAhead',
          message: 'Projection days ahead must be an array',
          value: request.projectionDaysAhead,
        });
      } else {
        for (let i = 0; i < request.projectionDaysAhead.length; i++) {
          const day = request.projectionDaysAhead[i];
          if (typeof day !== 'number' || day < 0) {
            errors.push({
              field: `projectionDaysAhead[${i}]`,
              message: 'Projection day must be a non-negative number',
              value: day,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize pricing calculation request
   *
   * Converts request to safe format with defaults
   *
   * @param request - Pricing calculation request
   * @returns Sanitized request
   */
  static sanitizePricingRequest(
    request: PricingCalculationRequest
  ): PricingCalculationRequest {
    // Convert target date to Date object
    let targetDate: Date;
    if (typeof request.targetDate === 'string') {
      targetDate = new Date(request.targetDate);
    } else {
      targetDate = request.targetDate;
    }

    // Get current date
    const currentDate = request.currentDate || new Date();

    return {
      targetDate,
      basePrice: request.basePrice,
      urgencySteepness:
        request.urgencySteepness ?? URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
      marketDemandMultiplier: request.marketDemandMultiplier ?? 1.0,
      lookbackWindow:
        request.lookbackWindow ?? URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
      transactionType: request.transactionType,
      includeProjections: request.includeProjections ?? true,
      projectionDaysAhead: request.projectionDaysAhead,
      currentDate,
    };
  }

  /**
   * Validate number is within range
   *
   * @param value - Value to validate
   * @param min - Minimum value
   * @param max - Maximum value
   * @param fieldName - Field name for error message
   * @returns Validation error if invalid, null otherwise
   */
  static validateNumberRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): ValidationError | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        value,
      };
    }

    if (value < min || value > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
        value,
      };
    }

    return null;
  }

  /**
   * Validate date is valid and in the future
   *
   * @param date - Date to validate
   * @param fieldName - Field name for error message
   * @returns Validation error if invalid, null otherwise
   */
  static validateFutureDate(
    date: Date | string,
    fieldName: string
  ): ValidationError | null {
    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return {
        field: fieldName,
        message: `${fieldName} must be a Date object or ISO string`,
        value: date,
      };
    }

    if (isNaN(dateObj.getTime())) {
      return {
        field: fieldName,
        message: `${fieldName} is invalid`,
        value: date,
      };
    }

    if (dateObj <= new Date()) {
      return {
        field: fieldName,
        message: `${fieldName} must be in the future`,
        value: date,
      };
    }

    return null;
  }
}
