import { createContext, useContext, useMemo } from 'react';
import useListingDashboardPageLogic from '../useListingDashboardPageLogic.js';

const ListingDataContext = createContext(null);
const ListingActionsContext = createContext(null);

export function ListingDashboardProvider({ children }) {
  const logic = useListingDashboardPageLogic();

  const dataValue = useMemo(() => ({
    authState: logic.authState,
    currentUser: logic.currentUser,
    listing: logic.listing,
    counts: logic.counts,
    isLoading: logic.isLoading,
    error: logic.error,
    existingCohostRequest: logic.existingCohostRequest,
    calendarData: logic.calendarData,
    isSavingBlockedDates: logic.isSavingBlockedDates,
    showAIImportAssistant: logic.showAIImportAssistant,
    aiGenerationStatus: logic.aiGenerationStatus,
    isAIGenerating: logic.isAIGenerating,
    isAIComplete: logic.isAIComplete,
    aiGeneratedData: logic.aiGeneratedData,
    highlightedFields: logic.highlightedFields,
    activeTab: logic.activeTab,
    editSection: logic.editSection,
    editFocusField: logic.editFocusField,
    showScheduleCohost: logic.showScheduleCohost,
    showImportReviews: logic.showImportReviews,
    isImportingReviews: logic.isImportingReviews,
    insights: logic.insights,
    isInsightsLoading: logic.isInsightsLoading,
    fetchInsights: logic.fetchInsights,
    isUnderperforming: logic.isUnderperforming,
  }), [
    logic.authState,
    logic.currentUser,
    logic.listing,
    logic.counts,
    logic.isLoading,
    logic.error,
    logic.existingCohostRequest,
    logic.calendarData,
    logic.isSavingBlockedDates,
    logic.showAIImportAssistant,
    logic.aiGenerationStatus,
    logic.isAIGenerating,
    logic.isAIComplete,
    logic.aiGeneratedData,
    logic.highlightedFields,
    logic.activeTab,
    logic.editSection,
    logic.editFocusField,
    logic.showScheduleCohost,
    logic.showImportReviews,
    logic.isImportingReviews,
    logic.insights,
    logic.isInsightsLoading,
    logic.fetchInsights,
    logic.isUnderperforming,
  ]);

  const actionsValue = useMemo(() => ({
    handleSetCoverPhoto: logic.handleSetCoverPhoto,
    handleDeletePhoto: logic.handleDeletePhoto,
    handleReorderPhotos: logic.handleReorderPhotos,
    handleAIAssistant: logic.handleAIAssistant,
    handleCloseAIImportAssistant: logic.handleCloseAIImportAssistant,
    handleAIImportComplete: logic.handleAIImportComplete,
    handleStartAIGeneration: logic.handleStartAIGeneration,
    handleTabChange: logic.handleTabChange,
    handleCardClick: logic.handleCardClick,
    handleBackClick: logic.handleBackClick,
    handleDescriptionChange: logic.handleDescriptionChange,
    handleCancellationPolicyChange: logic.handleCancellationPolicyChange,
    handleCancellationRestrictionsChange: logic.handleCancellationRestrictionsChange,
    handleCopyLink: logic.handleCopyLink,
    handleScheduleCohost: logic.handleScheduleCohost,
    handleCloseScheduleCohost: logic.handleCloseScheduleCohost,
    handleCohostRequestSubmitted: logic.handleCohostRequestSubmitted,
    handleImportReviews: logic.handleImportReviews,
    handleCloseImportReviews: logic.handleCloseImportReviews,
    handleSubmitImportReviews: logic.handleSubmitImportReviews,
    handleEditSection: logic.handleEditSection,
    handleCloseEdit: logic.handleCloseEdit,
    handleSaveEdit: logic.handleSaveEdit,
    handleAvailabilityChange: logic.handleAvailabilityChange,
    handleBlockedDatesChange: logic.handleBlockedDatesChange,
    updateListing: logic.updateListing,
  }), [
    logic.handleSetCoverPhoto,
    logic.handleDeletePhoto,
    logic.handleReorderPhotos,
    logic.handleAIAssistant,
    logic.handleCloseAIImportAssistant,
    logic.handleAIImportComplete,
    logic.handleStartAIGeneration,
    logic.handleTabChange,
    logic.handleCardClick,
    logic.handleBackClick,
    logic.handleDescriptionChange,
    logic.handleCancellationPolicyChange,
    logic.handleCancellationRestrictionsChange,
    logic.handleCopyLink,
    logic.handleScheduleCohost,
    logic.handleCloseScheduleCohost,
    logic.handleCohostRequestSubmitted,
    logic.handleImportReviews,
    logic.handleCloseImportReviews,
    logic.handleSubmitImportReviews,
    logic.handleEditSection,
    logic.handleCloseEdit,
    logic.handleSaveEdit,
    logic.handleAvailabilityChange,
    logic.handleBlockedDatesChange,
    logic.updateListing,
  ]);

  return (
    <ListingDataContext.Provider value={dataValue}>
      <ListingActionsContext.Provider value={actionsValue}>
        {children}
      </ListingActionsContext.Provider>
    </ListingDataContext.Provider>
  );
}

export function useListingDashboardData() {
  const context = useContext(ListingDataContext);
  if (!context) {
    throw new Error('useListingDashboardData must be used within ListingDashboardProvider');
  }
  return context;
}

export function useListingDashboardActions() {
  const context = useContext(ListingActionsContext);
  if (!context) {
    throw new Error('useListingDashboardActions must be used within ListingDashboardProvider');
  }
  return context;
}

export function useListingDashboard() {
  const dataContext = useContext(ListingDataContext);
  const actionsContext = useContext(ListingActionsContext);
  if (!dataContext || !actionsContext) {
    throw new Error('useListingDashboard must be used within ListingDashboardProvider');
  }

  return {
    ...dataContext,
    ...actionsContext,
  };
}
