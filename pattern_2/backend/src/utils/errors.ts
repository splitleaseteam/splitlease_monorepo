/**
 * Custom Error Classes for Urgency Pricing
 *
 * Production-ready error handling with error codes and context
 */

export class UrgencyError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'UrgencyError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

export class ValidationError extends UrgencyError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class CacheError extends UrgencyError {
  constructor(message: string, details?: any) {
    super('CACHE_ERROR', message, details);
    this.name = 'CacheError';
  }
}

export class DatabaseError extends UrgencyError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends UrgencyError {
  constructor(message: string, details?: any) {
    super('CONFIGURATION_ERROR', message, details);
    this.name = 'ConfigurationError';
  }
}

export class CalculationError extends UrgencyError {
  constructor(message: string, details?: any) {
    super('CALCULATION_ERROR', message, details);
    this.name = 'CalculationError';
  }
}

/**
 * Error code constants
 */
export const ERROR_CODES = {
  // Validation errors
  INVALID_CONTEXT: 'INVALID_CONTEXT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_STEEPNESS: 'INVALID_STEEPNESS',
  INVALID_LOOKBACK_WINDOW: 'INVALID_LOOKBACK_WINDOW',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_PRICE: 'INVALID_PRICE',
  DATE_IN_PAST: 'DATE_IN_PAST',

  // Cache errors
  CACHE_CONNECTION_FAILED: 'CACHE_CONNECTION_FAILED',
  CACHE_READ_FAILED: 'CACHE_READ_FAILED',
  CACHE_WRITE_FAILED: 'CACHE_WRITE_FAILED',
  CACHE_DELETE_FAILED: 'CACHE_DELETE_FAILED',

  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_INSERT_FAILED: 'DB_INSERT_FAILED',
  DB_UPDATE_FAILED: 'DB_UPDATE_FAILED',

  // Calculation errors
  CALCULATION_FAILED: 'CALCULATION_FAILED',
  MULTIPLIER_OUT_OF_RANGE: 'MULTIPLIER_OUT_OF_RANGE',
  PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',

  // Configuration errors
  CONFIG_MISSING: 'CONFIG_MISSING',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CONTEXT]: 'Invalid urgency context provided',
  [ERROR_CODES.INVALID_REQUEST]: 'Invalid pricing calculation request',
  [ERROR_CODES.INVALID_STEEPNESS]: 'Urgency steepness must be positive',
  [ERROR_CODES.INVALID_LOOKBACK_WINDOW]:
    'Lookback window must be a positive number',
  [ERROR_CODES.INVALID_DATE]: 'Invalid date provided',
  [ERROR_CODES.INVALID_PRICE]: 'Invalid price value',
  [ERROR_CODES.DATE_IN_PAST]: 'Target date must be in the future',
  [ERROR_CODES.CACHE_CONNECTION_FAILED]: 'Failed to connect to cache',
  [ERROR_CODES.CACHE_READ_FAILED]: 'Failed to read from cache',
  [ERROR_CODES.CACHE_WRITE_FAILED]: 'Failed to write to cache',
  [ERROR_CODES.CACHE_DELETE_FAILED]: 'Failed to delete from cache',
  [ERROR_CODES.DB_CONNECTION_FAILED]: 'Failed to connect to database',
  [ERROR_CODES.DB_QUERY_FAILED]: 'Database query failed',
  [ERROR_CODES.DB_INSERT_FAILED]: 'Failed to insert into database',
  [ERROR_CODES.DB_UPDATE_FAILED]: 'Failed to update database',
  [ERROR_CODES.CALCULATION_FAILED]: 'Pricing calculation failed',
  [ERROR_CODES.MULTIPLIER_OUT_OF_RANGE]: 'Urgency multiplier out of range',
  [ERROR_CODES.PRICE_OUT_OF_RANGE]: 'Calculated price out of range',
  [ERROR_CODES.CONFIG_MISSING]: 'Required configuration missing',
  [ERROR_CODES.CONFIG_INVALID]: 'Configuration is invalid',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.UNAUTHORIZED]: 'Unauthorized access',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
} as const;
