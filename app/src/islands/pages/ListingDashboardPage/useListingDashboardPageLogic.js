import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../../../lib/logger';
import { supabase } from '../../../lib/supabase';
import { useListingAuth } from './hooks/useListingAuth';
import { useListingData } from './hooks/useListingData';
import { useInsightsData } from './hooks/useInsightsData';
import { usePhotoManagement } from './hooks/usePhotoManagement';
import { useAIImportAssistant } from './hooks/useAIImportAssistant';

/**
 * Custom hook for ListingDashboardPage logic - Orchestrator Pattern
 * Composes focused hooks for auth, data, photos, and AI functionality
 * Follows the Hollow Component Pattern - all business logic is here
 */
export default function useListingDashboardPageLogic() {
  // Get listing ID from URL
  const getListingIdFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('listing_id');
  }, []);

  const listingId = getListingIdFromUrl();

  // Compose focused hooks
  const auth = useListingAuth();
  const data = useListingData(listingId);
  const insightsHook = useInsightsData(listingId, data.listing, data.counts, data.calendarData, supabase);
  const photos = usePhotoManagement(
    data.listing,
    data.setListing,
    (silent) => data.fetchListing(silent),
    listingId
  );
  const ai = useAIImportAssistant(
    data.listing,
    data.updateListing,
    data.setListing,
    (silent) => data.fetchListing(silent),
    listingId
  );

  const { setListing, updateListing, fetchListing, setExistingCohostRequest, ensureCalendarData } = data;

  // Local UI state
  const [activeTab, setActiveTab] = useState('manage');
  const [editSection, setEditSection] = useState(null);
  const [editFocusField, setEditFocusField] = useState(null);
  const [showScheduleCohost, setShowScheduleCohost] = useState(false);
  const [showImportReviews, setShowImportReviews] = useState(false);
  const [isImportingReviews, setIsImportingReviews] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [isSavingBlockedDates, setIsSavingBlockedDates] = useState(false);
  const blockedDatesTimerRef = useRef(null);
  const blockedDatesBeforeSaveRef = useRef(null);
  const listingRef = useRef(null);
  const currentUserRef = useRef(null);

  useEffect(() => {
    listingRef.current = data.listing;
  }, [data.listing]);

  useEffect(() => {
    currentUserRef.current = auth.currentUser;
  }, [auth.currentUser]);

  // Tab change handler
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    const currentListing = listingRef.current;

    switch (tab) {
      case 'preview':
        if (currentListing) {
          window.open(`/preview-split-lease.html?id=${currentListing.id}`, '_blank');
        }
        break;
      case 'proposals':
      case 'virtual-meetings':
      case 'leases':
      default:
        break;
    }
  }, []);

  // Copy link handler
  const handleCopyLink = useCallback(async () => {
    const currentListing = listingRef.current;

    if (!currentListing?.id) {
      window.showToast?.({
        title: 'Error',
        content: 'No listing ID available',
        type: 'error'
      });
      return;
    }

    const listingUrl = `${window.location.origin}/view-split-lease/${currentListing.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(listingUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = listingUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      window.showToast?.({
        title: 'Link Copied!',
        content: 'Listing link has been copied to your clipboard',
        type: 'success'
      });
    } catch (err) {
      logger.error('Failed to copy link:', err);
      window.showToast?.({
        title: 'Copy Failed',
        content: 'Unable to copy link to clipboard',
        type: 'error'
      });
    }
  }, []);

  // Action card click handler
  const handleCardClick = useCallback((cardId) => {
    const currentListing = listingRef.current;

    switch (cardId) {
      case 'preview':
        if (currentListing) {
          window.open(`/preview-split-lease.html?id=${currentListing.id}`, '_blank');
        }
        break;
      case 'copy-link':
        handleCopyLink();
        break;
      case 'proposals':
        if (currentListing) {
          window.location.href = `/host-proposals?listingId=${currentListing.id}`;
        }
        break;
      case 'meetings':
        setActiveTab('virtual-meetings');
        break;
      case 'manage':
        setActiveTab('manage');
        break;
      case 'leases':
        setActiveTab('leases');
        break;
      default:
        logger.debug('Unknown card clicked:', cardId);
    }
  }, [handleCopyLink]);

  // Back to all listings handler
  const handleBackClick = useCallback(() => {
    window.location.href = '/host-dashboard';
  }, []);

  // Description change handler
  const handleDescriptionChange = useCallback((newDescription) => {
    setListing((prev) => ({
      ...prev,
      description: newDescription,
    }));
  }, [setListing]);

  // Cancellation policy handlers
  const handleCancellationPolicyChange = useCallback(async (policyId) => {
    if (!listingId) {
      logger.error('âŒ No listing ID found for cancellation policy update');
      return;
    }

    logger.debug('ðŸ“‹ Updating cancellation policy to:', policyId);

    try {
      await updateListing({ 'Cancellation Policy': policyId });

      setListing((prev) => ({
        ...prev,
        cancellationPolicy: policyId,
        'Cancellation Policy': policyId,
      }));

      logger.debug('âœ… Cancellation policy saved successfully');
    } catch (error) {
      logger.error('âŒ Failed to save cancellation policy:', error);
    }
  }, [listingId, updateListing, setListing]);

  const handleCancellationRestrictionsChange = useCallback(async (restrictionsText) => {
    if (!listingId) {
      logger.error('âŒ No listing ID found for cancellation restrictions update');
      return;
    }

    logger.debug('ðŸ“‹ Updating cancellation restrictions:', restrictionsText);

    try {
      await updateListing({ 'Cancellation Policy - Additional Restrictions': restrictionsText });

      setListing((prev) => ({
        ...prev,
        cancellationPolicyAdditionalRestrictions: restrictionsText,
        'Cancellation Policy - Additional Restrictions': restrictionsText,
      }));

      logger.debug('âœ… Cancellation restrictions saved successfully');
    } catch (error) {
      logger.error('âŒ Failed to save cancellation restrictions:', error);
    }
  }, [listingId, updateListing, setListing]);

  // Schedule Cohost handlers
  const handleScheduleCohost = useCallback(() => {
    setShowScheduleCohost(true);
  }, []);

  const handleCloseScheduleCohost = useCallback(() => {
    setShowScheduleCohost(false);
  }, []);

  const handleCohostRequestSubmitted = useCallback((requestData) => {
    logger.debug('âœ… Co-host request submitted:', requestData);
    if (requestData) {
      setExistingCohostRequest({
        _id: requestData.requestId || requestData._id,
        status: 'pending',
        createdAt: requestData.createdAt || new Date().toISOString(),
        ...requestData,
      });
    }
  }, [setExistingCohostRequest]);

  // Import Reviews handlers
  const handleImportReviews = useCallback(() => {
    setShowImportReviews(true);
  }, []);

  const handleCloseImportReviews = useCallback(() => {
    setShowImportReviews(false);
  }, []);

  const handleSubmitImportReviews = useCallback(async (formData) => {
    const currentUser = currentUserRef.current;

    setIsImportingReviews(true);
    try {
      logger.debug('ðŸ“¥ Submitting import reviews request:', formData);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
              action: 'faq_inquiry',
              payload: {
                name: currentUser?.firstName || currentUser?.name || 'Host',
                email: formData.emailAddress,
                inquiry: `ðŸ“¥ **Import Reviews Request**\n\n**Listing ID:** ${formData.listingId || 'N/A'}\n**Reviews URL:** ${formData.reviewsUrl}\n**Requested by:** ${formData.emailAddress}\n\nPlease import reviews from the above URL for this listing.`
              }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      logger.debug('âœ… Import reviews request submitted successfully');
      alert('Your request has been submitted! Our team will import your reviews within 24-48 hours.');
      setShowImportReviews(false);
    } catch (err) {
      logger.error('âŒ Error submitting import reviews request:', err);
      alert('Failed to submit request. Please try again later.');
    } finally {
      setIsImportingReviews(false);
    }
  }, []);

  const handleAskAI = useCallback((field) => {
    if (!field) {
      return;
    }

    setAiLoading((prev) => ({
      ...prev,
      [field]: true,
    }));

    setTimeout(() => {
      setAiLoading((prev) => ({
        ...prev,
        [field]: false,
      }));

      if (window.showToast) {
        window.showToast({
          title: 'AI Assistant',
          content: `I'd love to help write your ${field}! This feature is coming in the next update.`,
          type: 'info',
        });
        return;
      }

      alert(`AI Assistant: I'd love to help write your ${field}! This feature is coming in the next update.`);
    }, 1000);
  }, []);

  // Edit modal handlers
  const handleEditSection = useCallback((section, focusField = null) => {
    setEditSection(section);
    setEditFocusField(focusField);
  }, []);

  // Tab-aware edit — switches to the correct tab before opening the edit modal.
  // PERF: Tabs are a render optimization only — switching tabs triggers no new queries.
  // All listing data is fetched once on mount regardless of which tab is active.
  const handleEditSectionWithTab = useCallback((section, focusField = null) => {
    const sectionTabMap = {
      name: 'manage',
      description: 'manage',
      amenities: 'manage',
      details: 'manage',
      pricing: 'manage',
      rules: 'manage',
      availability: 'manage',
      photos: 'manage',
      'cancellation-policy': 'manage',
    };
    const targetTab = sectionTabMap[section] || 'manage';
    setActiveTab(targetTab);
    setEditSection(section);
    setEditFocusField(focusField);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditSection(null);
    setEditFocusField(null);
    if (listingId) {
      fetchListing(true);
    }
  }, [listingId, fetchListing]);

  const handleSaveEdit = useCallback((updatedData) => {
    if (updatedData && typeof updatedData === 'object') {
      setListing((prev) => {
        if (!prev) return prev;

        const updates = { ...prev };

        if (updatedData.Name !== undefined) {
          updates.title = updatedData.Name;
          updates.Name = updatedData.Name;
        }

        if (updatedData.Description !== undefined) {
          updates.description = updatedData.Description;
          updates.Description = updatedData.Description;
        }

        if (updatedData.neighborhood_description_by_host !== undefined) {
          updates.descriptionNeighborhood = updatedData.neighborhood_description_by_host;
          updates.neighborhood_description_by_host = updatedData.neighborhood_description_by_host;
        }

        return updates;
      });
    }
  }, [setListing]);

  // Availability handlers
  const handleAvailabilityChange = useCallback(async (fieldName, value) => {
    if (!listingId) {
      window.showToast?.({
        title: 'Error',
        content: 'No listing ID available',
        type: 'error'
      });
      return;
    }

    try {
      const fieldMapping = {
        'checkInTime': 'checkin_time_of_day',
        'checkOutTime': 'checkout_time_of_day',
        'earliestAvailableDate': 'first_available_date',
        'leaseTermMin': 'minimum_weeks_per_stay',
        'leaseTermMax': 'maximum_weeks_per_stay'
      };

      const dbFieldName = fieldMapping[fieldName];
      if (!dbFieldName) {
        logger.error('Unknown availability field:', fieldName);
        return;
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
  }, [listingId, updateListing, setListing]);

  const handleBlockedDatesChange = useCallback((newBlockedDates) => {
    if (!listingId) {
      logger.error('No listing ID found for blocked dates update');
      return;
    }

    const currentListing = listingRef.current;

    // Optimistic update: apply to local state immediately
    if (!blockedDatesBeforeSaveRef.current) {
      blockedDatesBeforeSaveRef.current = currentListing?.blockedDates || [];
    }
    setListing((prev) => prev ? { ...prev, blockedDates: newBlockedDates } : prev);

    // Debounce the DB save (500ms) for drag-to-block performance
    if (blockedDatesTimerRef.current) {
      clearTimeout(blockedDatesTimerRef.current);
    }
    setIsSavingBlockedDates(true);

    blockedDatesTimerRef.current = setTimeout(async () => {
      try {
        await updateListing({ blocked_specific_dates_json: JSON.stringify(newBlockedDates) });
        blockedDatesBeforeSaveRef.current = null;
      } catch (error) {
        logger.error('Failed to save blocked dates:', error);
        const revertDates = blockedDatesBeforeSaveRef.current || [];
        setListing((prev) => prev ? { ...prev, blockedDates: revertDates } : prev);
        blockedDatesBeforeSaveRef.current = null;
        window.showToast?.({
          title: 'Save Failed',
          content: 'Could not save blocked dates. Changes reverted.',
          type: 'error',
        });
      } finally {
        setIsSavingBlockedDates(false);
        blockedDatesTimerRef.current = null;
      }
    }, 500);
  }, [listingId, updateListing, setListing]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (blockedDatesTimerRef.current) {
        clearTimeout(blockedDatesTimerRef.current);
      }
    };
  }, []);

  return {
    // Auth state from useListingAuth
    authState: auth.authState,
    currentUser: auth.currentUser,

    // Data state from useListingData
    listing: data.listing,
    counts: data.counts,
    isLoading: data.isLoading,
    error: data.error,
    existingCohostRequest: data.existingCohostRequest,
    calendarData: data.calendarData,
    isSavingBlockedDates,

    // Insights from useInsightsData
    insights: insightsHook.insights,
    isInsightsLoading: insightsHook.isLoading,
    fetchInsights: insightsHook.fetchInsights,
    isUnderperforming: insightsHook.isUnderperforming,

    // Photo handlers from usePhotoManagement
    handleSetCoverPhoto: photos.handleSetCoverPhoto,
    handleDeletePhoto: photos.handleDeletePhoto,
    handleReorderPhotos: photos.handleReorderPhotos,

    // AI handlers from useAIImportAssistant
    showAIImportAssistant: ai.showAIImportAssistant,
    aiGenerationStatus: ai.aiGenerationStatus,
    isAIGenerating: ai.isAIGenerating,
    isAIComplete: ai.isAIComplete,
    aiGeneratedData: ai.aiGeneratedData,
    highlightedFields: ai.highlightedFields,
    handleAIAssistant: ai.handleAIAssistant,
    handleCloseAIImportAssistant: ai.handleCloseAIImportAssistant,
    handleAIImportComplete: ai.handleAIImportComplete,
    handleStartAIGeneration: ai.handleStartAIGeneration,

    // Local UI state
    activeTab,
    editSection,
    editFocusField,
    showScheduleCohost,
    showImportReviews,
    isImportingReviews,
    aiLoading,

    // UI handlers
    handleTabChange,
    handleCardClick,
    handleBackClick,
    handleDescriptionChange,
    handleCancellationPolicyChange,
    handleCancellationRestrictionsChange,
    handleCopyLink,
    handleScheduleCohost,
    handleCloseScheduleCohost,
    handleCohostRequestSubmitted,
    handleImportReviews,
    handleCloseImportReviews,
    handleSubmitImportReviews,
    handleAskAI,
    handleEditSection,
    handleEditSectionWithTab,
    handleCloseEdit,
    handleSaveEdit,
    handleAvailabilityChange,
    handleBlockedDatesChange,
    ensureCalendarData,

    // Expose updateListing for modal compatibility
    updateListing,
  };
}
