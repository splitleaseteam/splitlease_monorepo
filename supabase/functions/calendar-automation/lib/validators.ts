/**
 * Calendar Automation - Input Validation
 * Split Lease - Supabase Edge Functions
 *
 * NO FALLBACK PRINCIPLE: All validation failures throw immediately
 */

import { ValidationError } from '../../_shared/errors.ts';
import type { ProcessVirtualMeetingPayload } from './types.ts';

// ─────────────────────────────────────────────────────────────
// Virtual Meeting Validation
// ─────────────────────────────────────────────────────────────

/**
 * Validate process virtual meeting input
 * Throws ValidationError if invalid
 */
export function validateProcessVirtualMeetingInput(
  input: unknown
): input is ProcessVirtualMeetingPayload {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('Invalid input: expected object');
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.virtualMeetingId !== 'string') {
    throw new ValidationError('virtualMeetingId is required and must be a string');
  }

  if (payload.virtualMeetingId.trim().length === 0) {
    throw new ValidationError('virtualMeetingId cannot be empty');
  }

  return true;
}

/**
 * Validate virtual meeting record
 * Throws ValidationError if record is invalid or not ready for calendar automation
 */
export function validateVirtualMeetingRecord(
  record: Record<string, unknown>
): void {
  // Check if meeting is confirmed
  if (!record.confirmedBySplitLease) {
    throw new ValidationError('Virtual meeting is not confirmed by Split Lease');
  }

  // Check if meeting has booked date
  if (!record['booked date'] || typeof record['booked date'] !== 'string') {
    throw new ValidationError('Virtual meeting does not have a booked date');
  }

  // Check if meeting has end time
  if (!record['end of meeting'] || typeof record['end of meeting'] !== 'string') {
    throw new ValidationError('Virtual meeting does not have an end time');
  }

  // Validate email addresses
  if (typeof record['guest email'] !== 'string' || !record['guest email'].includes('@')) {
    throw new ValidationError('Guest email is invalid or missing');
  }

  if (typeof record['host email'] !== 'string' || !record['host email'].includes('@')) {
    throw new ValidationError('Host email is invalid or missing');
  }

  // Validate names
  if (typeof record['guest name'] !== 'string' || record['guest name'].trim().length === 0) {
    throw new ValidationError('Guest name is invalid or missing');
  }

  if (typeof record['host name'] !== 'string' || record['host name'].trim().length === 0) {
    throw new ValidationError('Host name is invalid or missing');
  }
}

/**
 * Validate ISO 8601 datetime string
 */
export function validateDateTime(datetime: unknown): string {
  if (typeof datetime !== 'string') {
    throw new ValidationError(`Invalid datetime: expected string, got ${typeof datetime}`);
  }

  const date = new Date(datetime);

  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid datetime format: ${datetime}`);
  }

  // Return ISO 8601 formatted string
  return date.toISOString();
}
