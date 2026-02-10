/**
 * User display name formatting utilities.
 *
 * Consolidated from:
 *   - logic/processors/display/formatHostName.js (formatHostName)
 *   - logic/processors/user/processUserDisplayName.js (processUserDisplayName)
 *
 * @module lib/formatting/formatUserDisplayName
 */

/**
 * Format full host name to "FirstName L." format for privacy.
 *
 * @intent Format host name for display with privacy (show first name + last initial).
 * @rule NO FALLBACK: Throws error if name is invalid.
 * @rule Single name: Return as-is (e.g., "John" -> "John").
 * @rule Multiple names: Return "FirstName L." (e.g., "John Smith" -> "John S.").
 *
 * @param {object} params - Named parameters.
 * @param {string} params.fullName - Full name of the host.
 * @returns {string} Formatted name with last initial.
 *
 * @throws {Error} If fullName is not a string or is empty.
 *
 * @example
 * const formatted = formatHostName({ fullName: 'John Smith' })
 * // => "John S."
 *
 * const single = formatHostName({ fullName: 'John' })
 * // => "John"
 */
export function formatHostName({ fullName }) {
  // No Fallback: Strict validation
  if (typeof fullName !== 'string') {
    throw new Error(
      `formatHostName: fullName must be a string, got ${typeof fullName}`
    )
  }

  const trimmedName = fullName.trim()

  if (!trimmedName || trimmedName.length === 0) {
    throw new Error('formatHostName: fullName cannot be empty or whitespace')
  }

  // Split name into parts
  const nameParts = trimmedName.split(/\s+/)

  // Single name: return as-is
  if (nameParts.length === 1) {
    return nameParts[0]
  }

  // Multiple names: "FirstName L."
  const firstName = nameParts[0]
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase()

  return `${firstName} ${lastInitial}.`
}

/**
 * Formats user's display name for UI presentation.
 *
 * @function processUserDisplayName
 * @intent Transform user name data into formatted display string
 * @rule If showFull is true and lastName exists, return "FirstName LastName"
 * @rule If showFull is false or no lastName, return "FirstName"
 * @rule NO FALLBACK: firstName is required, throw if missing
 * @rule Trims whitespace and ensures proper capitalization
 *
 * @param {object} params - Named parameters
 * @param {string} params.firstName - User's first name (required)
 * @param {string|null|undefined} params.lastName - User's last name (optional)
 * @param {boolean} params.showFull - Whether to show full name (first + last)
 * @returns {string} Formatted display name
 * @throws {Error} If firstName is missing or invalid
 *
 * @example
 * processUserDisplayName({ firstName: 'John', lastName: 'Doe', showFull: true }) // "John Doe"
 * processUserDisplayName({ firstName: 'John', lastName: 'Doe', showFull: false }) // "John"
 * processUserDisplayName({ firstName: 'Jane', lastName: null, showFull: true }) // "Jane"
 * processUserDisplayName({ firstName: '', lastName: 'Doe', showFull: true }) // throws Error
 */
export function processUserDisplayName({ firstName, lastName, showFull }) {
  // NO FALLBACK: firstName is mandatory for user identity
  if (typeof firstName !== 'string' || firstName.trim().length === 0) {
    throw new Error('processUserDisplayName requires a valid firstName. Cannot display user without name.');
  }

  // Validate showFull is a boolean
  if (typeof showFull !== 'boolean') {
    throw new Error('processUserDisplayName requires showFull to be a boolean');
  }

  // Normalize firstName (trim whitespace)
  const normalizedFirstName = firstName.trim();

  // If not showing full name or no lastName, return first name only
  if (!showFull || !lastName) {
    return normalizedFirstName;
  }

  // Validate lastName if we're trying to use it
  if (typeof lastName !== 'string' || lastName.trim().length === 0) {
    return normalizedFirstName;
  }

  // Return full name with space separator
  const normalizedLastName = lastName.trim();
  return `${normalizedFirstName} ${normalizedLastName}`;
}
