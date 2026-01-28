import { useCallback } from 'react';
import { logger } from '../../../../lib/logger';

// Valid cancellation policy IDs
const VALID_POLICIES = ['flexible', 'moderate', 'strict', 'super_strict'];

/**
 * @typedef {Object} CancellationLogicReturn
 * @property {(policyId: string) => Promise<void>} handleCancellationPolicyChange
 * @property {(restrictionsText: string) => Promise<void>} handleCancellationRestrictionsChange
 */

/**
 * Hook for managing cancellation policy logic
 * @param {string|null} listingId - The listing ID
 * @param {Function} updateListing - Function to update listing in database
 * @param {Function} setListing - Function to update local listing state
 * @param {boolean} isOwner - Whether current user owns this listing
 * @returns {CancellationLogicReturn}
 */
export function useCancellationLogic(listingId, updateListing, setListing, isOwner) {
  const handleCancellationPolicyChange = useCallback(async (policyId) => {
    // Security: Verify ownership
    if (!isOwner) {
      logger.warn('Unauthorized attempt to update cancellation policy');
      window.showToast?.({
        title: 'Permission Denied',
        content: 'You do not have permission to edit this listing',
        type: 'error'
      });
      return;
    }

    if (!listingId) {
      logger.error('❌ No listing ID found for cancellation policy update');
      window.showToast?.({
        title: 'Error',
        content: 'No listing ID found',
        type: 'error'
      });
      return;
    }

    // Validate policy ID
    if (!VALID_POLICIES.includes(policyId)) {
      logger.error('Invalid policy ID:', policyId);
      window.showToast?.({
        title: 'Invalid Policy',
        content: 'Please select a valid cancellation policy',
        type: 'error'
      });
      return;
    }

    logger.debug('📋 Updating cancellation policy to:', policyId);

    try {
      await updateListing({ 'Cancellation Policy': policyId });

      setListing((prev) => ({
        ...prev,
        cancellationPolicy: policyId,
        'Cancellation Policy': policyId,
      }));

      logger.debug('✅ Cancellation policy saved successfully');
      window.showToast?.({
        title: 'Policy Updated',
        content: 'Cancellation policy saved successfully',
        type: 'success'
      });
    } catch (error) {
      logger.error('❌ Failed to save cancellation policy:', error);
      window.showToast?.({
        title: 'Save Failed',
        content: 'Failed to update cancellation policy. Please try again.',
        type: 'error'
      });
    }
  }, [listingId, updateListing, setListing, isOwner]);

  const handleCancellationRestrictionsChange = useCallback(async (restrictionsText) => {
    // Security: Verify ownership
    if (!isOwner) {
      logger.warn('Unauthorized attempt to update cancellation restrictions');
      window.showToast?.({
        title: 'Permission Denied',
        content: 'You do not have permission to edit this listing',
        type: 'error'
      });
      return;
    }

    if (!listingId) {
      logger.error('❌ No listing ID found for cancellation restrictions update');
      window.showToast?.({
        title: 'Error',
        content: 'No listing ID found',
        type: 'error'
      });
      return;
    }

    // Validate text length
    const MAX_LENGTH = 500;
    if (restrictionsText && restrictionsText.length > MAX_LENGTH) {
      window.showToast?.({
        title: 'Text Too Long',
        content: `Restrictions must be ${MAX_LENGTH} characters or less`,
        type: 'error'
      });
      return;
    }

    logger.debug('📋 Updating cancellation restrictions:', restrictionsText);

    try {
      await updateListing({ 'Cancellation Policy - Additional Restrictions': restrictionsText });

      setListing((prev) => ({
        ...prev,
        cancellationPolicyAdditionalRestrictions: restrictionsText,
        'Cancellation Policy - Additional Restrictions': restrictionsText,
      }));

      logger.debug('✅ Cancellation restrictions saved successfully');
      window.showToast?.({
        title: 'Restrictions Updated',
        content: 'Cancellation restrictions saved successfully',
        type: 'success'
      });
    } catch (error) {
      logger.error('❌ Failed to save cancellation restrictions:', error);
      window.showToast?.({
        title: 'Save Failed',
        content: 'Failed to update restrictions. Please try again.',
        type: 'error'
      });
    }
  }, [listingId, updateListing, setListing, isOwner]);

  return {
    handleCancellationPolicyChange,
    handleCancellationRestrictionsChange,
  };
}
