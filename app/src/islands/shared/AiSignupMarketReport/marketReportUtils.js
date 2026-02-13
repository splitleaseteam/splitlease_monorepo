/**
 * Utility functions for AI Signup Market Report
 * Pure functions for text extraction, validation, and auto-correction
 */

/**
 * Extract a name from freeform text
 * Looks for common patterns like "I'm [Name]", "My name is [Name]", "I am [Name]"
 * Also extracts from email local part (before @) as fallback
 *
 * @param {string} text - The freeform text to extract name from
 * @param {string} email - Optional email to use as fallback for name extraction
 * @returns {string|null} - Extracted name or null if not found
 */
export function extractName(text, email = null) {
  if (!text) return null;

  // Patterns to look for name introduction
  const namePatterns = [
    /(?:I'm|I am|my name is|this is|hi,? i'm|hello,? i'm|hey,? i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:name:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:^|\s)([A-Z][a-z]+)\s+(?:here|speaking|writing)/i,
    /(?:send to|contact|reach)\s+(?:me at|at|:)?\s*([A-Z][a-z]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up and return the first name only
      const fullName = match[1].trim();
      const firstName = fullName.split(/\s+/)[0];
      return firstName;
    }
  }

  // Fallback: try to extract name from email local part
  if (email) {
    const localPart = email.split('@')[0];
    if (localPart) {
      // Remove common suffixes like numbers
      const nameFromEmail = localPart
        .replace(/[0-9]+$/, '')     // Remove trailing numbers
        .replace(/[._-]/g, ' ')      // Replace separators with spaces
        .split(/\s+/)[0];            // Take first part

      // Capitalize first letter
      if (nameFromEmail && nameFromEmail.length > 1) {
        return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1).toLowerCase();
      }
    }
  }

  return null;
}

/**
 * Generate a password in the format SL{Name}77
 *
 * @param {string} name - The name to include in the password
 * @returns {string} - Generated password
 */
export function generatePassword(name) {
  // Default to "User" if no name is provided
  const safeName = name ? name.trim() : 'User';
  // Capitalize first letter, lowercase rest for consistency
  const formattedName = safeName.charAt(0).toUpperCase() + safeName.slice(1).toLowerCase();
  return `SL${formattedName}77`;
}

export function extractEmail(text) {
  if (!text) return null;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.,][a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

export function extractPhone(text) {
  if (!text) return null;

  // Only extract phone numbers that match standard US phone formats
  // or are explicitly mentioned as phone numbers
  // This avoids catching budget numbers like "$1500" or "1500"

  // Standard US phone formats (10 digits with various separators)
  const standardPhonePatterns = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,              // (123) 456-7890, 123-456-7890, 123.456.7890
    /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // +1 (123) 456-7890
  ];

  for (const pattern of standardPhonePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  // Look for numbers explicitly mentioned as phone numbers
  // e.g., "my phone is 5551234567", "call me at 555-123-4567", "phone: 5551234567"
  const explicitPhonePatterns = [
    /(?:phone|call|text|reach|contact|cell|mobile)[:\s]+(?:me\s+)?(?:at\s+)?(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,11})/i,
    /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,11})(?:\s+(?:is my|my)\s+(?:phone|cell|mobile|number))/i,
  ];

  for (const pattern of explicitPhonePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Match 10-11 digit sequences only (standard US phone number length)
  // This catches cases like "5551234567" but NOT "1500" (a budget)
  const tenDigitMatch = text.match(/\b(\d{10,11})\b/);
  if (tenDigitMatch) {
    return tenDigitMatch[1];
  }

  return null;
}

export function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  if (!phone) return true;
  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone);
}

export function checkEmailCertainty(email) {
  if (!email) return 'uncertain';

  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'mail.com', 'protonmail.com'
  ];

  const commonTypos = [
    'gmial.com', 'gmai.com', 'yahooo.com', 'yaho.com',
    'hotmial.com', 'outlok.com', 'icoud.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();

  if (commonTypos.includes(domain)) return 'uncertain';
  if (domain && domain.length < 5) return 'uncertain';
  if (!domain?.includes('.')) return 'uncertain';
  if (email.includes('..') || email.includes('@.')) return 'uncertain';
  if (commonDomains.includes(domain)) return 'certain';
  if (validateEmail(email)) return 'certain';

  return 'uncertain';
}

export function autoCorrectEmail(email) {
  if (!email) return email;

  const typoMap = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com',
    'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com',
    'gmail,com': 'gmail.com', 'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
    'yahoo,com': 'yahoo.com', 'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
    'hotmail,com': 'hotmail.com', 'outlok.com': 'outlook.com',
    'outlook.co': 'outlook.com', 'outlook,com': 'outlook.com',
    'icoud.com': 'icloud.com', 'iclod.com': 'icloud.com',
    'icloud.co': 'icloud.com', 'icloud,com': 'icloud.com',
  };

  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const domainLower = domain.toLowerCase();
  const fixedDomain = domainLower.replace(',', '.');
  const correctedDomain = typoMap[fixedDomain] || fixedDomain;

  return `${localPart}@${correctedDomain}`;
}
