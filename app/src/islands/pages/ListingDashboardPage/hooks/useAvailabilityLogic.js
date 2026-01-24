import { useCallback } from 'react';
import { logger } from '../../../../lib/logger';

// Field mapping - at module level for performance
const FIELD_MAPPING = {
  'checkInTime': 'NEW Date Check-in Time',
  'checkOutTime': 'NEW Date Check-out Time',
  'earliestAvailableDate': ' First Available',
  'leaseTermMin': 'Minimum Weeks',
  'leaseTermMax': 'Maximum Weeks'
};

// Validation constraints
const CONSTRAINTS = {
  leaseTermMin: { min: 6, max: 52 },
  leaseTermMax: { min: 6, max: 52 },
};

/**
 * @typedef {Object} AvailabilityLogicReturn
 * @property {(fieldName: string, value: any) => Promise<void>} handleAvailabilityChange
 * @property {(newBlockedDates: string[]) => Promise<void>} handleBlockedDatesChange
 */

/**
 * Hook for managing availability and blocked dates logic
 * @param {string|null} listingId - The listing ID
 * @param {Function} updateListing - Function to update listing in database
 * @param {Function} setListing - Function to update local listing state
 * @param {boolean} isOwner - Whether current user owns this listing
 * @returns {AvailabilityLogicReturn}
 */
export function useAvailabilityLogic(listingId, updateListing, setListing, isOwner) {
  const handleAvailabilityChange = useCallback(async (fieldName, value) => {
    // Security: Verify ownership
    if (!isOwner) {
      logger.warn('Unauthorized attempt to update availability');
      window.showToast?.({
        title: 'Permission Denied',
        content: 'You do not have permission to edit this listing',
        type: 'error'
      });
      return;
    }

    if (!listingId) {
      window.showToast?.({
        title: 'Error',
        content: 'No listing ID available',
        type: 'error'
      });
      return;
    }

    try {
      const dbFieldName = FIELD_MAPPING[fieldName];
      if (!dbFieldName) {
        logger.error('Unknown availability field:', fieldName);
        return;
      }

      // Validate constraints
      if (CONSTRAINTS[fieldName]) {
        const { min, max } = CONSTRAINTS[fieldName];
        if (value < min || value > max) {
          window.showToast?.({
            title: 'Invalid Value',
            content: `Value must be between ${min} and ${max}`,
            type: 'error'
          });
          return;
        }
      }

      // Validate date format
      if (fieldName === 'earliestAvailableDate') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (value && !dateRegex.test(value)) {
          window.showToast?.({
            title: 'Invalid Date',
            content: 'Please enter a valid date',
            type: 'error'
          });
          return;
        }
      }

      await updateListing({ [dbFieldName]: value });

      setListing((prev) => ({
        ...prev,
        [fieldName]: value
      }));

      window.showToast?.({
        title: 'Changes Saved',
        content: 'Availability settings updated successfully',
        type: 'success'
      });
    } catch (error) {
      logger.error('Failed to save availability field:', error);
      window.showToast?.({
        title: 'Save Failed',
        content: 'Could not save changes. Please try again.',
        type: 'error'
      });
    }
  }, [listingId, updateListing, setListing, isOwner]);

  const handleBlockedDatesChange = useCallback(async (newBlockedDates) => {
    // Security: Verify ownership
    if (!isOwner) {
      logger.warn('Unauthorized attempt to update blocked dates');
      window.showToast?.({
        title: 'Permission Denied',
        content: 'You do not have permission to edit this listing',
        type: 'error'
      });
      return;
    }

    if (!listingId) {
      logger.error('❌ No listing ID found for blocked dates update');
      return;
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const invalidDates = newBlockedDates.filter(date => !dateRegex.test(date));
    if (invalidDates.length > 0) {
      logger.error('Invalid date formats:', invalidDates);
      window.showToast?.({
        title: 'Invalid Dates',
        content: 'Some dates have invalid format',
        type: 'error'
      });
      return;
    }

    logger.debug('📅 Saving blocked dates:', newBlockedDates);

    // Store previous state for rollback
    let previousBlockedDates;

    try {
      // Optimistic update - update UI immediately
      setListing((prev) => {
        previousBlockedDates = prev.blockedDates;
        return {
          ...prev,
          blockedDates: newBlockedDates,
        };
      });

      await updateListing({ 'Dates - Blocked': JSON.stringify(newBlockedDates) });

      logger.debug('✅ Blocked dates saved successfully');
    } catch (error) {
      logger.error('❌ Failed to save blocked dates:', error);

      // Rollback on error
      if (previousBlockedDates !== undefined) {
        setListing((prev) => ({
          ...prev,
          blockedDates: previousBlockedDates,
        }));
      }

      window.showToast?.({
        title: 'Save Failed',
        content: 'Failed to update blocked dates. Please try again.',
        type: 'error'
      });
    }
  }, [listingId, updateListing, setListing, isOwner]);

  return {
    handleAvailabilityChange,
    handleBlockedDatesChange,
  };
}
