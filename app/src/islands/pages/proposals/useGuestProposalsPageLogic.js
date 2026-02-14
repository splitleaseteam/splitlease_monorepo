/**
 * Guest Proposals Page Logic Hook (V7)
 *
 * Follows the Hollow Component Pattern:
 * - This hook contains ALL business logic
 * - The component contains ONLY JSX rendering
 *
 * Four-Layer Architecture:
 * - Uses constants from logic/constants/
 * - Uses queries from lib/proposals/
 * - Uses processors from lib/proposals/dataTransformers.js
 *
 * V7 Changes:
 * - Added expandedProposalId for accordion pattern
 * - Added proposal categorization (suggested vs user-created)
 * - Removed single selectedProposal in favor of all-visible cards
 *
 * Authentication:
 * - Page requires authenticated Guest user
 * - User ID comes from session, NOT URL
 * - Redirects to home if not authenticated or not a Guest
 * - Uses consolidated useAuthenticatedUser hook
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchUserProposalsFromUrl } from '../../../lib/proposals/userProposalQueries.js';
import { updateUrlWithProposal, cleanLegacyUserIdFromUrl, getProposalIdFromQuery } from '../../../lib/proposals/urlParser.js';
import { transformProposalData, getProposalDisplayText } from '../../../lib/proposals/dataTransformers.js';
import { getStatusConfig, getStageFromStatus } from '../../../logic/constants/proposalStatuses.js';
import { getAllStagesFormatted } from '../../../logic/constants/proposalStages.js';
import { fetchStatusConfigurations, getButtonConfigForProposal, isStatusConfigCacheReady } from '../../../lib/proposals/statusButtonConfig.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { isSLSuggested, isPendingConfirmation, isTerminalStatus } from './displayUtils.js';

/**
 * Main logic hook for Guest Proposals Page
 * @returns {Object} All state and handlers for the page
 */
export function useGuestProposalsPageLogic() {
  // ============================================================================
  // STATE
  // ============================================================================

  // Auth - consolidated hook handles authentication, role check, and redirect
  const { user: authUser, userId: authUserId, isLoading: authLoading, isAuthenticated } = useAuthenticatedUser({
    requireGuest: true,
    redirectOnFail: '/'
  });

  // Derived authState for backward-compatible component API
  const authState = {
    isChecking: authLoading,
    isAuthenticated,
    isGuest: isAuthenticated,
    shouldRedirect: !authLoading && !isAuthenticated,
    redirectReason: null
  };

  // Data state
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null); // Legacy: kept for backward compatibility
  const [statusConfigReady, setStatusConfigReady] = useState(false);

  // V7 UI state: Accordion pattern - only one card expanded at a time
  const [expandedProposalId, setExpandedProposalId] = useState(null);

  // Ref to track if URL-based auto-expand has been processed
  const hasProcessedUrlExpand = useRef(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // URL CLEANUP (runs once on mount)
  // ============================================================================
  useEffect(() => {
    cleanLegacyUserIdFromUrl();
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load user proposals from session and status configurations
   */
  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch proposals and status configurations in parallel
      const [proposalData] = await Promise.all([
        fetchUserProposalsFromUrl(),
        fetchStatusConfigurations() // Caches for later use
      ]);

      setUser(proposalData.user);
      setProposals(proposalData.proposals);
      setSelectedProposal(proposalData.selectedProposal);
      setStatusConfigReady(isStatusConfigCacheReady());
    } catch (err) {
      console.error('useGuestProposalsPageLogic: Error loading proposals:', err);

      // Handle specific error types
      if (err.message === 'NOT_AUTHENTICATED') {
        // This shouldn't happen since we check auth first, but handle it
        window.location.href = '/';
        return;
      }

      setError(err.message || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data after auth check passes
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) return;

    loadProposals();
  }, [authLoading, isAuthenticated, authUser, loadProposals]);

  // ============================================================================
  // URL-BASED AUTO-EXPAND
  // ============================================================================

  /**
   * Auto-expand proposal card if proposal ID is in URL query parameter
   * This enables deep linking: /guest-proposals?proposal=<id> opens the card
   *
   * Uses a ref guard to ensure this only runs ONCE when proposals first load.
   * This prevents constant state updates that cause page instability.
   */
  useEffect(() => {
    // Skip if already processed (prevents repeated state updates causing page instability)
    if (hasProcessedUrlExpand.current) return;

    // Wait until proposals are loaded
    if (proposals.length === 0 || isLoading) return;

    const proposalIdFromUrl = getProposalIdFromQuery();
    if (!proposalIdFromUrl) {
      hasProcessedUrlExpand.current = true;
      return;
    }

    // Verify the proposal exists in the user's proposals
    const proposalExists = proposals.some(p => p.id === proposalIdFromUrl);
    if (proposalExists) {
      console.log('Auto-expanding proposal from URL:', proposalIdFromUrl);
      setExpandedProposalId(proposalIdFromUrl);
    } else {
      console.warn('Proposal ID from URL not found in user proposals:', proposalIdFromUrl);
    }
    hasProcessedUrlExpand.current = true;
  }, [proposals, isLoading]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle proposal selection change (from dropdown) - Legacy support
   * @param {string} proposalId - The ID of the selected proposal
   */
  const handleProposalSelect = useCallback((proposalId) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      setSelectedProposal(proposal);

      // Update URL with selected proposal (no user ID in URL)
      updateUrlWithProposal(proposalId);
    }
  }, [proposals]);

  /**
   * V7: Toggle accordion card expansion
   * Only one card can be expanded at a time (accordion pattern)
   * @param {string} proposalId - The ID of the proposal to toggle
   */
  const handleToggleExpand = useCallback((proposalId) => {
    setExpandedProposalId(prevId => {
      const newId = prevId === proposalId ? null : proposalId;
      // Also update URL when expanding a card
      if (newId) {
        updateUrlWithProposal(newId);
      }
      return newId;
    });
  }, []);

  /**
   * Retry loading after error
   */
  const handleRetry = useCallback(() => {
    loadProposals();
  }, [loadProposals]);

  /**
   * Handle proposal deletion (soft-delete)
   * Removes proposal from UI state without requiring page reload
   * @param {string} proposalId - The ID of the deleted proposal
   */
  const handleProposalDeleted = useCallback((proposalId) => {
    // Remove deleted proposal from local state and update selected proposal atomically
    setProposals(prevProposals => {
      const remaining = prevProposals.filter(p => p.id !== proposalId);

      // If the deleted proposal was selected, select the first remaining one
      setSelectedProposal(prev => {
        if (prev?.id === proposalId) {
          return remaining.length > 0 ? remaining[0] : null;
        }
        return prev;
      });

      // V7: If the deleted proposal was expanded, collapse
      setExpandedProposalId(prevExpanded => {
        if (prevExpanded === proposalId) {
          return null;
        }
        return prevExpanded;
      });

      return remaining;
    });
  }, []);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  /**
   * Get transformed proposal data for display
   */
  const transformedProposal = selectedProposal
    ? transformProposalData(selectedProposal)
    : null;

  /**
   * Get status configuration for selected proposal
   */
  const statusConfig = selectedProposal
    ? getStatusConfig(selectedProposal.proposal_workflow_status)
    : null;

  /**
   * Get current stage from status
   */
  const currentStage = selectedProposal
    ? getStageFromStatus(selectedProposal.proposal_workflow_status)
    : null;

  /**
   * Get formatted stages for progress tracker
   */
  const formattedStages = currentStage
    ? getAllStagesFormatted(currentStage)
    : [];

  /**
   * Get dropdown options for proposal selector
   */
  const proposalOptions = proposals.map(p => ({
    id: p.id,
    label: getProposalDisplayText(transformProposalData(p))
  }));

  /**
   * Get button configuration for selected proposal
   * Uses cached os_proposal_status data for dynamic labels
   */
  const buttonConfig = selectedProposal && statusConfigReady
    ? getButtonConfigForProposal(selectedProposal)
    : null;

  // ============================================================================
  // V7: CATEGORIZED PROPOSALS
  // ============================================================================

  /**
   * Categorize proposals into "Suggested for You" and "Your Proposals"
   * - Suggested: SL-created proposals pending guest confirmation
   * - User: All other proposals (guest-submitted, confirmed, etc.)
   *
   * Sort order within each category:
   * - Non-terminal proposals first (active/pending)
   * - Then by creation date (newest first)
   */
  const categorizedProposals = useMemo(() => {
    const suggested = [];
    const userCreated = [];

    proposals.forEach(proposal => {
      const status = proposal.proposal_workflow_status || '';

      // SL-suggested = has "Split Lease" in status AND pending confirmation
      // Once confirmed, it moves to "Your Proposals"
      const isSuggested = isSLSuggested(status) && isPendingConfirmation(status);

      if (isSuggested) {
        suggested.push(proposal);
      } else {
        userCreated.push(proposal);
      }
    });

    // Sort function: non-terminal first, then by date descending
    const sortProposals = (a, b) => {
      const aTerminal = isTerminalStatus(a.proposal_workflow_status);
      const bTerminal = isTerminalStatus(b.proposal_workflow_status);

      // Non-terminal comes first
      if (aTerminal !== bTerminal) {
        return aTerminal ? 1 : -1;
      }

      // Then by creation date (newest first)
      const aDate = new Date(a.original_created_at || a.createdAt || 0);
      const bDate = new Date(b.original_created_at || b.createdAt || 0);
      return bDate - aDate;
    };

    return {
      suggested: suggested.sort(sortProposals),
      userCreated: userCreated.sort(sortProposals)
    };
  }, [proposals]);

  // ============================================================================
  // COMPUTED LOADING STATE
  // ============================================================================

  // Show loading if checking auth OR loading proposals
  const isPageLoading = authLoading || isLoading;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,

    // Raw data
    user,
    proposals,
    selectedProposal,

    // V7: Categorized proposals for section rendering
    categorizedProposals,

    // V7: Accordion state
    expandedProposalId,

    // Transformed/derived data (legacy support)
    transformedProposal,
    statusConfig,
    currentStage,
    formattedStages,
    proposalOptions,
    buttonConfig,

    // UI state
    isLoading: isPageLoading,
    error,

    // Handlers
    handleProposalSelect,
    handleToggleExpand, // V7: Accordion toggle
    handleRetry,
    handleProposalDeleted
  };
}

export default useGuestProposalsPageLogic;
