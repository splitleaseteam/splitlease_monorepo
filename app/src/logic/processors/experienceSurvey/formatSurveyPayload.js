/**
 * Formats and sanitizes survey form data for API submission
 *
 * @param {object} formData - Raw form data
 * @returns {object} - Cleaned payload for Edge Function
 */
export function formatSurveyPayload(formData) {
  return {
    hostName: sanitizeText(formData.hostName),
    experienceDescription: sanitizeText(formData.experienceDescription),
    priorChallenge: sanitizeText(formData.priorChallenge),
    challengeImpact: sanitizeText(formData.challengeImpact),
    whatChanged: sanitizeText(formData.whatChanged),
    whatStoodOut: sanitizeText(formData.whatStoodOut),
    additionalServiceNeeded: sanitizeText(formData.additionalServiceNeeded),
    canSharePublicly: Boolean(formData.canSharePublicly),
    recommendationScore: parseScore(formData.recommendationScore),
    staffToThank: sanitizeText(formData.staffToThank),
    additionalQuestions: sanitizeText(formData.additionalQuestions)
  };
}

/**
 * Sanitizes text input - trims whitespace and normalizes empty strings to null
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parses and validates recommendation score
 */
function parseScore(value) {
  const score = parseInt(value, 10);
  if (isNaN(score) || score < 1 || score > 10) {
    return null;
  }
  return score;
}
