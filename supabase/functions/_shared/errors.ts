/**
 * Error handling utilities for Supabase Edge Functions
 * Split Lease
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public apiResponse?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** @deprecated Use ApiError instead */
export const BubbleApiError = ApiError;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public openaiResponse?: unknown
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Format error for client response
 * NO FALLBACK: Returns actual error message without hiding details
 */
export function formatErrorResponse(error: Error): { success: false; error: string } {
  console.error('[Error Handler]', error);

  return {
    success: false,
    error: error.message || 'An error occurred',
  };
}

/**
 * Get HTTP status code from error type
 */
export function getStatusCodeFromError(error: Error): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof OpenAIError) {
    return error.statusCode;
  }
  return 500;
}
