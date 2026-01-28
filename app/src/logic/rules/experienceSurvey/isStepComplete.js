import { STEP_CONFIG } from '../../../islands/pages/HostExperienceReviewPage/constants.js';

/**
 * Validates if a specific step is complete
 *
 * @param {number} stepNumber - The step number (1-11)
 * @param {object} formData - Current form data
 * @returns {boolean} - Whether the step is complete
 */
export function isStepComplete(stepNumber, formData) {
  const stepConfig = STEP_CONFIG[stepNumber];

  if (!stepConfig) {
    return false;
  }

  // If step is not required, it's always complete
  if (!stepConfig.required) {
    return true;
  }

  // Check all required fields
  for (const field of stepConfig.fields) {
    const value = formData[field];

    // Handle different types
    if (typeof value === 'string') {
      if (!value.trim()) return false;
    } else if (typeof value === 'boolean') {
      // Booleans are always valid (true or false)
      continue;
    } else if (typeof value === 'number') {
      if (isNaN(value)) return false;
    } else if (value === undefined || value === null) {
      return false;
    }
  }

  return true;
}
