/**
 * useMessagingPageLogic - WITH SUPABASE REALTIME
 *
 * All business logic for the Messaging Page following Hollow Component Pattern.
 *
 * Responsibilities:
 * - Authentication check (redirect if not logged in)
 * - Fetch threads on mount via Edge Function (bypasses RLS for legacy auth)
 * - URL parameter sync (?thread=THREAD_ID)
 * - Fetch messages when thread selected
 * - Message sending handler
 * - REAL-TIME: Subscribe to thread channel for instant message delivery
 * - REAL-TIME: Typing indicators via Presence
 *
 * NO FALLBACK: Real data only, no mock data in production
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { getUserId, getSessionId } from '../../../lib/secureStorage.js';
import { supabase } from '../../../lib/supabase.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { useModalManager } from '../../../hooks/useModalManager.js';
import { useCTAHandler } from './useCTAHandler.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';
import { calculateNextAvailableCheckIn } from '../../../logic/calculators/scheduling/calculateNextAvailableCheckIn.js';
import { clearProposalDraft } from '../../shared/CreateProposalFlow.jsx';
import { messagingReducer, initialState } from './messagingReducer.js';

export function useMessagingPageLogic() {
  const { user: authUser, userId: authUserId, isLoading: authLoading, isAuthenticated } = useAuthenticatedUser({ redirectOnFail: '/?login=true' });

  // ============================================================================
  // STATE: useReducer for all non-modal state, useModalManager for modals
  // ============================================================================
  const [state, dispatch] = useReducer(messagingReducer, initialState);
  const modals = useModalManager();

  // Refs (unchanged)
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ============================================================================
  // CTA HANDLER HOOKS
  // ============================================================================
  const handleOpenModal = useCallback(async (modalName, context) => {
    console.log('[MessagingPage] handleOpenModal called:', modalName, context);

    // Special handling for CreateProposalFlow modal
    if (modalName === 'CreateProposalFlow') {
      console.log('[MessagingPage] Opening CreateProposalFlow modal');

      // Get listing data from threadInfo or context
      const listingId = context?.listingId || state.threadInfo?.listing_id;

      if (!listingId) {
        console.error('[MessagingPage] No listing ID available for proposal modal');
        return;
      }

      try {
        // Fetch listing details for the proposal modal
        const { data: listingData, error: listingError } = await supabase
          .from('listing')
          .select('*')
          .eq('id', listingId)
          .maybeSingle();

        if (listingError) {
          console.error('[MessagingPage] Error fetching listing for proposal:', listingError);
          return;
        }

        console.log('[MessagingPage] Listing data fetched:', listingData?.listing_title);

        // Set up default days (Mon-Fri, weekdays)
        const initialDays = [1, 2, 3, 4, 5].map(dayIndex => createDay(dayIndex, true));

        // Calculate minimum move-in date (2 weeks from today)
        const today = new Date();
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);
        const minMoveInDate = twoWeeksFromNow.toISOString().split('T')[0];

        // Calculate smart move-in date based on selected days
        let smartMoveInDate = minMoveInDate;
        try {
          const selectedDayIndices = initialDays.map(d => d.dayOfWeek);
          smartMoveInDate = calculateNextAvailableCheckIn({
            selectedDayIndices,
            minDate: minMoveInDate
          });
        } catch (err) {
          console.error('[MessagingPage] Error calculating smart move-in date:', err);
        }

        // Transform listing data for the modal
        const transformedListing = {
          id: listingData.id,
          listing_title: listingData.listing_title || 'Unnamed Listing',
          title: listingData.listing_title || 'Unnamed Listing',
          photos: listingData.photos_with_urls_captions_and_sort_order_json,
          host: null, // Host info not needed for proposal submission
          // Pricing fields
          nightly_rate_for_2_night_stay: listingData.nightly_rate_for_2_night_stay,
          nightly_rate_for_3_night_stay: listingData.nightly_rate_for_3_night_stay,
          nightly_rate_for_4_night_stay: listingData.nightly_rate_for_4_night_stay,
          nightly_rate_for_5_night_stay: listingData.nightly_rate_for_5_night_stay,
          nightly_rate_for_7_night_stay: listingData.nightly_rate_for_7_night_stay,
          weekly_rate_paid_to_host: listingData.weekly_rate_paid_to_host,
          monthly_rate_paid_to_host: listingData.monthly_rate_paid_to_host,
          price_override: listingData.price_override,
          cleaning_fee_amount: listingData.cleaning_fee_amount,
          damage_deposit_amount: listingData.damage_deposit_amount,
          unit_markup_percentage: listingData.unit_markup_percentage,
          rental_type: listingData.rental_type,
          weeks_offered_schedule_text: listingData.weeks_offered_schedule_text,
          // Availability fields
          first_available_date: listingData.first_available_date,
          last_available_date: listingData.last_available_date,
          maximum_nights_per_stay: listingData.maximum_nights_per_stay,
          blocked_specific_dates_json: listingData.blocked_specific_dates_json,
          available_days_as_day_numbers_json: listingData.available_days_as_day_numbers_json,
          minimum_nights_per_stay: listingData.minimum_nights_per_stay,
        };

        // Set proposal modal data
        dispatch({
          type: 'SET_PROPOSAL_MODAL_DATA',
          payload: {
            listing: transformedListing,
            moveInDate: smartMoveInDate,
            daysSelected: initialDays,
            nightsSelected: initialDays.length > 0 ? initialDays.length - 1 : 0,
            reservationSpan: 13, // Default to 13 weeks
            priceBreakdown: null // Will be calculated by the modal
          }
        });

        // Set the active modal via useModalManager
        modals.open(modalName, context);

      } catch (err) {
        console.error('[MessagingPage] Error preparing proposal modal:', err);
      }

      return;
    }

    // Default handling for other modals
    modals.open(modalName, context);
  }, [state.threadInfo, modals]);

  const handleCloseModal = useCallback(() => {
    modals.closeAll();
    dispatch({ type: 'SET_PROPOSAL_MODAL_DATA', payload: null }); // Also clear proposal modal data
  }, [modals]);

  // ============================================================================
  // VM MODAL HANDLERS
  // ============================================================================
  const handleOpenVMModal = useCallback((view = 'request') => {
    modals.open('vm', { initialView: view });
  }, [modals]);

  const handleCloseVMModal = useCallback(() => {
    modals.close('vm');
  }, [modals]);

  const handleVMSuccess = useCallback(() => {
    // Reload page to get fresh data after VM action
    window.location.reload();
  }, []);

  const { handleCTAClick, getCTAButtonConfig } = useCTAHandler({
    user: state.user,
    selectedThread: state.selectedThread,
    threadInfo: state.threadInfo,
    onOpenModal: handleOpenModal,
  });

  // ============================================================================
  // AUTH CHECK ON MOUNT
  // ============================================================================
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) return;

    // Map hook user to local user state (preserving shape expected by rest of file)
    dispatch({
      type: 'SET_USER',
      payload: {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.fullName?.split(' ').slice(1).join(' ') || '',
        profilePhoto: authUser.profilePhoto,
        userType: authUser.userType || null
      }
    });
    dispatch({ type: 'SET_AUTH_STATE', payload: { isChecking: false, shouldRedirect: false } });

    // Fetch threads after auth confirmed
    fetchThreads().catch(err => {
      console.error('[Messaging] Failed to fetch threads:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations. Please refresh the page.' });
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    });
  }, [authLoading, isAuthenticated, authUser]);

  // Ref to track if initial thread selection has been done
  const hasAutoSelectedThread = useRef(false);

  // ============================================================================
  // FETCH ZAT PRICE CONFIGURATION ON MOUNT
  // ============================================================================
  useEffect(() => {
    const loadZatConfig = async () => {
      try {
        const config = await fetchZatPriceConfiguration();
        dispatch({ type: 'SET_ZAT_CONFIG', payload: config });
        console.log('[MessagingPage] ZAT config loaded');
      } catch (error) {
        console.warn('[MessagingPage] Failed to load ZAT config:', error);
      }
    };
    loadZatConfig();
  }, []);

  // ============================================================================
  // FETCH PANEL DATA WHEN THREAD INFO CHANGES
  // ============================================================================
  useEffect(() => {
    if (state.threadInfo?.proposal_id || state.threadInfo?.listing_id) {
      fetchPanelData(state.threadInfo.proposal_id, state.threadInfo.listing_id);
    } else {
      dispatch({ type: 'SET_PROPOSAL_DATA', payload: null });
      dispatch({ type: 'SET_LISTING_DATA', payload: null });
    }
  }, [state.threadInfo?.proposal_id, state.threadInfo?.listing_id]);

  // ============================================================================
  // URL PARAM SYNC FOR THREAD SELECTION (runs once when threads load)
  // ============================================================================
  useEffect(() => {
    if (state.threads.length === 0 || hasAutoSelectedThread.current) return;

    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('thread');

    if (threadId) {
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        hasAutoSelectedThread.current = true;
        selectThread(thread);
      }
    } else if (state.threads.length > 0) {
      hasAutoSelectedThread.current = true;
      selectThread(state.threads[0]);
    }
  }, [state.threads]);

  // ============================================================================
  // REALTIME SUBSCRIPTION - Using Postgres Changes (more reliable than broadcast)
  // ============================================================================
  useEffect(() => {
    if (!state.selectedThread || state.authState.isChecking || !state.user?.id) return;

    const channelName = `messages-${state.selectedThread.id}`;
    console.log('[Realtime] Subscribing to postgres_changes for thread:', state.selectedThread.id);

    const channel = supabase.channel(channelName);

    // Listen for new messages via Postgres Changes (INSERT events on thread_message table)
    // NOTE: Filter removed due to column name with special characters not working with Realtime
    // Client-side filtering is done instead
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'thread_message'
      },
      (payload) => {
        console.log('[Realtime] postgres_changes event received:', payload);

        const newRow = payload.new;
        if (!newRow) return;

        // Client-side filter: only process messages for this thread
        if (newRow.thread_id !== state.selectedThread.id) {
          console.log('[Realtime] Message is for different thread, ignoring');
          return;
        }

        console.log('[Realtime] Message is for this thread, processing...');

        // Skip if this is our own message (already added optimistically)
        const isOwnMessage = newRow.sender_user_id === state.user?.id;

        // Transform database row to UI format and add to state (dedup handled by reducer)
        const transformedMessage = {
          id: newRow.id,
          message_body: newRow['message_body_text'],
          sender_name: newRow['is_from_split_bot'] ? 'Split Bot' : (isOwnMessage ? 'You' : state.selectedThread.contact_name || 'User'),
          sender_avatar: isOwnMessage ? state.user?.profilePhoto : undefined,
          sender_type: newRow['is_from_split_bot'] ? 'splitbot' :
            (newRow.sender_user_id === newRow.host_user_id ? 'host' : 'guest'),
          is_outgoing: isOwnMessage,
          timestamp: new Date(newRow['original_created_at']).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          }),
          call_to_action: newRow['call_to_action_button_label'] ? {
            type: newRow['call_to_action_button_label'],
            message: 'View Details'
          } : undefined,
          split_bot_warning: newRow['split_bot_warning_text'],
        };

        dispatch({ type: 'ADD_MESSAGE', payload: transformedMessage });

        // Clear typing indicator when message received
        if (!isOwnMessage) {
          dispatch({ type: 'SET_TYPING', payload: { isOtherUserTyping: false, typingUserName: null } });
        }
      }
    );

    // Listen for typing indicators via presence
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const typingUsers = Object.values(presenceState)
        .flat()
        .filter(u => u.typing && u.user_id !== state.user?.id);

      if (typingUsers.length > 0) {
        dispatch({ type: 'SET_TYPING', payload: { isOtherUserTyping: true, typingUserName: typingUsers[0].user_name } });
      } else {
        dispatch({ type: 'SET_TYPING', payload: { isOtherUserTyping: false, typingUserName: null } });
      }
    });

    channel.subscribe(async (status) => {
      console.log('[Realtime] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed to channel:', channelName);
        // Track presence for typing indicators
        await channel.track({
          user_id: state.user?.id,
          user_name: state.user?.firstName || 'User',
          typing: false,
          online_at: new Date().toISOString(),
        });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error - check RLS policies on thread_message table');
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[Realtime] Unsubscribing from channel:', channelName);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [state.selectedThread?.id, state.authState.isChecking, state.user?.id]);

  // ============================================================================
  // TYPING INDICATOR
  // ============================================================================

  /**
   * Track typing state via Presence
   */
  const trackTyping = useCallback(async (isTyping) => {
    if (!channelRef.current || !state.user) return;

    try {
      await channelRef.current.track({
        user_id: state.user.id,
        user_name: state.user.firstName || 'User',
        typing: isTyping,
        typing_at: isTyping ? new Date().toISOString() : null,
        online_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Realtime] Failed to track typing:', err);
    }
  }, [state.user]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Fetch all threads for the authenticated user
   * Supports both modern Supabase auth (JWT) and legacy auth (user_id in payload)
   */
  async function fetchThreads() {
    console.log('[fetchThreads] Starting thread fetch via Edge Function...');
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Check for Supabase session (modern auth)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      console.log('[fetchThreads] Auth state:', {
        hasSupabaseSession: !!accessToken,
        hasLegacyUserId: !!getUserId(),
      });

      // Build request headers - include Authorization only if we have a token
      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build payload - include user_id for legacy auth fallback
      const payload = {};
      if (!accessToken) {
        // No Supabase session - use legacy auth via user_id
        const legacyUserId = getUserId();
        if (legacyUserId) {
          payload.user_id = legacyUserId;
          console.log('[fetchThreads] Using legacy auth with user_id:', legacyUserId);
        } else {
          throw new Error('Not authenticated. Please log in again.');
        }
      }

      // Make the API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'get_threads',
          payload
        }),
      });

      console.log('[fetchThreads] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchThreads] Error response:', errorText);
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }

      const data = await response.json();

      console.log('[fetchThreads] Edge Function response:', {
        success: data?.success,
        threadCount: data?.data?.threads?.length || 0,
        error: data?.error
      });

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch threads');
      }

      const fetchedThreads = data.data?.threads || [];
      console.log('[fetchThreads] Found', fetchedThreads.length, 'threads');

      dispatch({ type: 'SET_THREADS', payload: fetchedThreads });
    } catch (err) {
      console.error('[fetchThreads] Error:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load conversations' });
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }

  /**
   * Fetch messages for a specific thread
   * Supports both modern Supabase auth (JWT) and legacy auth (user_id in payload)
   */
  async function fetchMessages(threadId) {
    try {
      dispatch({ type: 'SET_IS_LOADING_MESSAGES', payload: true });

      // Check for Supabase session (modern auth)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      console.log('[fetchMessages] Auth state:', {
        hasSupabaseSession: !!accessToken,
        hasLegacyUserId: !!getUserId(),
      });

      // Build request headers - include Authorization only if we have a token
      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build payload - include user_id for legacy auth fallback
      const payload = { thread_id: threadId };
      if (!accessToken) {
        // No Supabase session - use legacy auth via user_id
        const legacyUserId = getUserId();
        if (legacyUserId) {
          payload.user_id = legacyUserId;
          console.log('[fetchMessages] Using legacy auth with user_id:', legacyUserId);
        } else {
          throw new Error('Not authenticated. Please log in again.');
        }
      }

      // Make the API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'get_messages',
          payload
        }),
      });

      console.log('[fetchMessages] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchMessages] Error response:', errorText);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        dispatch({ type: 'SET_MESSAGES', payload: data.data.messages || [] });
        dispatch({ type: 'SET_THREAD_INFO', payload: data.data.thread_info || null });
      } else {
        throw new Error(data?.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't set global error, just log it - user can still see threads
    } finally {
      dispatch({ type: 'SET_IS_LOADING_MESSAGES', payload: false });
    }
  }

  /**
   * Send a new message
   * After sending, Realtime will deliver the message to all subscribers
   * Supports both modern Supabase auth (JWT) and legacy auth (user_id in payload)
   */
  async function sendMessage() {
    if (!state.messageInput.trim() || !state.selectedThread || state.isSending) return;

    try {
      dispatch({ type: 'SET_IS_SENDING', payload: true });

      // Clear typing indicator immediately
      trackTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Check for Supabase session (modern auth)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Build request headers - include Authorization only if we have a token
      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build payload - include user_id for legacy auth fallback
      const payload = {
        thread_id: state.selectedThread.id,
        message_body: state.messageInput.trim(),
      };
      if (!accessToken) {
        // No Supabase session - use legacy auth via user_id
        const legacyUserId = getUserId();
        if (legacyUserId) {
          payload.user_id = legacyUserId;
          console.log('[sendMessage] Using legacy auth with user_id:', legacyUserId);
        } else {
          throw new Error('No access token available. Please log in again.');
        }
      }

      // Make the API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'send_message',
          payload,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[sendMessage] Error response:', errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        // Clear input immediately
        dispatch({ type: 'SET_MESSAGE_INPUT', payload: '' });

        // Note: We no longer need to fetch messages or threads here!
        // The Realtime subscription will automatically add the new message
        // when the database trigger broadcasts it.

        // However, for the sender's immediate feedback, add optimistically
        // (the Realtime broadcast might also arrive, but we'll dedupe)
        const optimisticMessage = {
          id: data.data.message_id,
          message_body: state.messageInput.trim(),
          sender_name: 'You',
          sender_type: 'guest', // Will be corrected by Realtime if wrong
          is_outgoing: true,
          timestamp: new Date().toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          }),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage });

      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to send message' });
    } finally {
      dispatch({ type: 'SET_IS_SENDING', payload: false });
    }
  }

  // ============================================================================
  // RIGHT PANEL DATA FETCHING
  // ============================================================================

  /**
   * Fetch extended proposal and listing data for the right panel
   * Called when a thread is selected
   */
  async function fetchPanelData(proposalId, listingId) {
    if (!proposalId && !listingId) {
      dispatch({ type: 'SET_PROPOSAL_DATA', payload: null });
      dispatch({ type: 'SET_LISTING_DATA', payload: null });
      return;
    }

    try {
      dispatch({ type: 'SET_IS_LOADING_PANEL_DATA', payload: true });

      // Fetch proposal and listing data in parallel
      const [proposalResult, listingResult] = await Promise.all([
        proposalId ? fetchProposalDetails(proposalId) : Promise.resolve(null),
        listingId ? fetchListingDetails(listingId) : Promise.resolve(null),
      ]);

      dispatch({ type: 'SET_PROPOSAL_DATA', payload: proposalResult });
      dispatch({ type: 'SET_LISTING_DATA', payload: listingResult });
    } catch (err) {
      console.error('[RightPanel] Error fetching panel data:', err);
      // Don't set error state - panel will show empty/gracefully degrade
    } finally {
      dispatch({ type: 'SET_IS_LOADING_PANEL_DATA', payload: false });
    }
  }

  /**
   * Fetch proposal details by ID
   */
  async function fetchProposalDetails(proposalId) {
    try {
      // proposal_id from thread may be either a Supabase UUID or legacy platform ID
      const { data, error } = await supabase
        .from('booking_proposal')
        .select(`
          id,
          proposal_workflow_status,
          original_created_at,
          move_in_range_start_date,
          move_in_range_end_date,
          nights_per_week_count,
          four_week_rent_amount,
          original_updated_at
        `)
        .or(`id.eq.${proposalId},legacy_platform_id.eq.${proposalId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[RightPanel] Error fetching proposal:', error);
        return null;
      }

      // Transform to UI format
      return {
        id: data.id,
        status: data.proposal_workflow_status || 'pending',
        createdAt: data.original_created_at,
        startDate: data.move_in_range_start_date,
        endDate: data.move_in_range_end_date,
        daysPerWeek: data.nights_per_week_count,
        totalMonthlyPrice: data.four_week_rent_amount,
        modifiedDate: data.original_updated_at,
      };
    } catch (err) {
      console.error('[RightPanel] Error fetching proposal:', err);
      return null;
    }
  }

  /**
   * Fetch listing details by ID
   */
  async function fetchListingDetails(listingId) {
    try {
      // listing_id from thread may be either a Supabase UUID or legacy platform ID
      const { data, error } = await supabase
        .from('listing')
        .select(`
          id,
          listing_title,
          photos_with_urls_captions_and_sort_order_json,
          neighborhood_name_entered_by_host,
          city,
          state,
          monthly_rate_paid_to_host,
          rental_type
        `)
        .or(`id.eq.${listingId},legacy_platform_id.eq.${listingId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[RightPanel] Error fetching listing:', error);
        return null;
      }

      // Extract primary photo from photos JSON
      const photos = data.photos_with_urls_captions_and_sort_order_json;
      const primaryImage = Array.isArray(photos) && photos.length > 0 ? photos[0]?.url : null;

      // Build address string
      const addressParts = [
        data.neighborhood_name_entered_by_host,
        data.city,
        data.state
      ].filter(Boolean);

      // Transform to UI format
      return {
        id: data.id,
        name: data.listing_title || 'Unnamed Listing',
        primaryImage,
        address: addressParts.join(', ') || 'Location not specified',
        monthlyRate: data.monthly_rate_paid_to_host,
        listingType: data.rental_type || 'Flexible',
      };
    } catch (err) {
      console.error('[RightPanel] Error fetching listing:', err);
      return null;
    }
  }

  /**
   * Handle action button clicks from sidebar, header, and right panel
   * @param {string} actionType - The action type
   * @param {object} context - Optional context object (for VM state, etc.)
   */
  const handlePanelAction = useCallback((actionType, context = {}) => {
    console.log('[MessagingPage] Action clicked:', actionType, context);

    switch (actionType) {
      // === Proposal Actions (Right Panel) ===
      case 'accept':
        // Open proposal acceptance modal/flow
        handleOpenModal('accept_proposal', {
          proposalId: state.threadInfo?.proposal_id,
          proposalData: state.proposalData,
        });
        break;

      case 'counter':
        // Open counter proposal modal
        handleOpenModal('counter_proposal', {
          proposalId: state.threadInfo?.proposal_id,
          proposalData: state.proposalData,
        });
        break;

      case 'decline':
        // Open decline confirmation modal
        handleOpenModal('decline_proposal', {
          proposalId: state.threadInfo?.proposal_id,
          proposalData: state.proposalData,
        });
        break;

      // === Communication Actions (Thread Header) ===
      case 'video':
        // Open video call scheduling modal
        handleOpenModal('schedule_video', {
          threadId: state.selectedThread?.id,
          contactName: state.threadInfo?.contact_name,
        });
        break;

      case 'phone':
        // Placeholder: Phone call functionality
        console.log('[ThreadHeader] Phone call clicked - functionality coming soon');
        break;

      case 'schedule':
        // Open meeting scheduling modal
        handleOpenModal('schedule_meeting', {
          threadId: state.selectedThread?.id,
          contactName: state.threadInfo?.contact_name,
        });
        break;

      case 'virtual_meeting':
        // Open Virtual Meeting Manager modal
        // Determine initial view based on VM state
        const { vmState } = context;
        let initialView = 'request';

        if (vmState === 'requested_by_other') {
          initialView = 'respond';
        } else if (vmState === 'requested_by_me') {
          initialView = 'cancel';
        } else if (vmState === 'booked_awaiting_confirmation' || vmState === 'confirmed') {
          initialView = 'details';
        } else if (vmState === 'expired') {
          initialView = 'request';
        }

        handleOpenVMModal(initialView);
        break;

      // === Navigation Actions ===
      case 'view_profile':
        // Navigate to contact's profile (if we have the ID)
        console.log('[RightPanel] View profile clicked');
        break;

      case 'view_listing':
        // Navigate to listing page
        if (state.listingData?.id) {
          window.location.href = `/listing?id=${state.listingData.id}`;
        }
        break;

      // === Sidebar Actions ===
      case 'new':
        // Placeholder: New message/conversation functionality
        console.log('[Sidebar] New message clicked - functionality coming soon');
        break;

      // === Common Actions ===
      case 'more':
        // Placeholder: More options menu
        console.log('[MessagingPage] More options clicked - functionality coming soon');
        break;

      default:
        console.warn('[MessagingPage] Unknown action:', actionType);
    }
  }, [state.threadInfo, state.proposalData, state.listingData, state.selectedThread, handleOpenModal, handleOpenVMModal]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Select a thread — unified handler for both auto-select and user click.
   * @param {object} thread - The thread to select
   * @param {object} [options] - Options
   * @param {boolean} [options.updateUrl=false] - Whether to update the URL
   */
  function selectThread(thread, { updateUrl = false } = {}) {
    dispatch({ type: 'SELECT_THREAD', payload: thread });

    // Mark thread as read in local state (backend will mark messages as read)
    dispatch({ type: 'MARK_THREAD_READ', payload: thread.id });

    if (updateUrl) {
      const params = new URLSearchParams(window.location.search);
      params.set('thread', thread.id);
      window.history.replaceState({}, '', `?${params.toString()}`);
    }

    fetchMessages(thread.id);
  }

  /**
   * Handle thread selection from user interaction (updates URL)
   */
  const handleThreadSelect = useCallback((thread) => {
    selectThread(thread, { updateUrl: true });
  }, []);

  /**
   * Insert suggestion text into message input
   * Called when a user clicks a suggestion chip in the empty state
   */
  const insertSuggestion = useCallback((suggestionText) => {
    dispatch({ type: 'SET_MESSAGE_INPUT', payload: suggestionText });
    // Trigger typing indicator so recipient sees activity
    trackTyping(true);
  }, [trackTyping]);

  /**
   * Handle message input change with typing indicator
   */
  const handleMessageInputChange = useCallback((value) => {
    if (value.length <= 1000) {
      dispatch({ type: 'SET_MESSAGE_INPUT', payload: value });

      // Track typing
      trackTyping(true);

      // Clear typing after 2 seconds of no input
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        trackTyping(false);
      }, 2000);
    }
  }, [trackTyping]);

  /**
   * Handle send message
   */
  const handleSendMessage = useCallback(() => {
    sendMessage();
  }, [state.messageInput, state.selectedThread, state.isSending]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    dispatch({ type: 'START_RETRY' });
    fetchThreads();
  }, []);

  // ============================================================================
  // PROPOSAL MODAL HANDLERS
  // ============================================================================

  /**
   * Submit proposal to backend
   * Based on FavoriteListingsPage implementation
   */
  const handleProposalSubmit = async (proposalData) => {
    console.log('[MessagingPage] Proposal submission initiated:', proposalData);
    dispatch({ type: 'SET_IS_SUBMITTING_PROPOSAL', payload: true });

    try {
      const guestId = getSessionId();
      if (!guestId) {
        throw new Error('User session not found');
      }

      // Days are already in JS format (0-6) - database now uses 0-indexed natively
      const daysInJsFormat = proposalData.daysSelectedObjects?.map(d => d.dayOfWeek) || [];

      // Sort days in JS format first to detect wrap-around (Saturday/Sunday spanning)
      const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);

      // Check for wrap-around case (both Saturday=6 and Sunday=0 present, but not all 7 days)
      const hasSaturday = sortedJsDays.includes(6);
      const hasSunday = sortedJsDays.includes(0);
      const isWrapAround = hasSaturday && hasSunday && daysInJsFormat.length < 7;

      let checkInDay, checkOutDay, nightsSelected;

      if (isWrapAround) {
        // Find the gap in the sorted selection to determine wrap-around point
        let gapIndex = -1;
        for (let i = 0; i < sortedJsDays.length - 1; i++) {
          if (sortedJsDays[i + 1] - sortedJsDays[i] > 1) {
            gapIndex = i + 1;
            break;
          }
        }

        if (gapIndex !== -1) {
          // Wrap-around: check-in is the first day after the gap, check-out is the last day before gap
          checkInDay = sortedJsDays[gapIndex];
          checkOutDay = sortedJsDays[gapIndex - 1];

          // Reorder days to be in actual sequence (check-in to check-out)
          const reorderedDays = [...sortedJsDays.slice(gapIndex), ...sortedJsDays.slice(0, gapIndex)];

          // Nights = all days except the last one (checkout day)
          nightsSelected = reorderedDays.slice(0, -1);
        } else {
          // No gap found, use standard logic
          checkInDay = sortedJsDays[0];
          checkOutDay = sortedJsDays[sortedJsDays.length - 1];
          nightsSelected = sortedJsDays.slice(0, -1);
        }
      } else {
        // Standard case: check-in = first day, check-out = last day
        checkInDay = sortedJsDays[0];
        checkOutDay = sortedJsDays[sortedJsDays.length - 1];
        // Nights = all days except the last one (checkout day)
        nightsSelected = sortedJsDays.slice(0, -1);
      }

      // Format reservation span text
      const reservationSpanWeeks = proposalData.reservationSpan || 13;
      const reservationSpanText = reservationSpanWeeks === 13
        ? '13 weeks (3 months)'
        : reservationSpanWeeks === 20
          ? '20 weeks (approx. 5 months)'
          : `${reservationSpanWeeks} weeks`;

      // Build payload (using 0-indexed days)
      const listingId = state.proposalModalData?.listing?.id;
      const payload = {
        guestId: guestId,
        listingId: listingId,
        moveInStartRange: proposalData.moveInDate,
        moveInEndRange: proposalData.moveInDate, // Same as start if no flexibility
        daysSelected: daysInJsFormat,
        nightsSelected: nightsSelected,
        reservationSpan: reservationSpanText,
        reservationSpanWeeks: reservationSpanWeeks,
        checkIn: checkInDay,
        checkOut: checkOutDay,
        proposalPrice: proposalData.pricePerNight,
        fourWeekRent: proposalData.pricePerFourWeeks,
        hostCompensation: proposalData.pricePerFourWeeks, // Same as 4-week rent for now
        needForSpace: proposalData.needForSpace || '',
        aboutMe: proposalData.aboutYourself || '',
        estimatedBookingTotal: proposalData.totalPrice,
        // Optional fields
        specialNeeds: proposalData.hasUniqueRequirements ? proposalData.uniqueRequirements : '',
        moveInRangeText: proposalData.moveInRange || '',
        flexibleMoveIn: !!proposalData.moveInRange,
        fourWeekCompensation: proposalData.pricePerFourWeeks
      };

      console.log('[MessagingPage] Submitting proposal:', payload);

      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload
        }
      });

      if (error) {
        console.error('[MessagingPage] Edge Function error:', error);
        throw new Error(error.message || 'Failed to submit proposal');
      }

      if (!data?.success) {
        console.error('[MessagingPage] Proposal submission failed:', data?.error);
        throw new Error(data?.error || 'Failed to submit proposal');
      }

      console.log('[MessagingPage] Proposal submitted successfully:', data);
      console.log('[MessagingPage] Proposal ID:', data.data?.proposalId);

      // Clear the localStorage draft on successful submission
      if (listingId) {
        clearProposalDraft(listingId);
      }

      // Close modal and clear state
      handleCloseModal();

      // Optionally navigate to proposals page or show success message
      // For now, just close the modal - the user can continue messaging
      console.log('[MessagingPage] Proposal submitted - modal closed');

    } catch (error) {
      console.error('[MessagingPage] Error submitting proposal:', error);
      // TODO: Show error toast/notification to user
    } finally {
      dispatch({ type: 'SET_IS_SUBMITTING_PROPOSAL', payload: false });
    }
  };

  // ============================================================================
  // RETURN HOOK API (backward-compatible aliases)
  // ============================================================================
  return {
    // Auth state
    authState: state.authState,
    user: state.user,

    // Thread data
    threads: state.threads,
    selectedThread: state.selectedThread,
    messages: state.messages,
    threadInfo: state.threadInfo,

    // Right panel data
    proposalData: state.proposalData,
    listingData: state.listingData,
    isLoadingPanelData: state.isLoadingPanelData,

    // UI state
    isLoading: state.isLoading,
    isLoadingMessages: state.isLoadingMessages,
    error: state.error,
    messageInput: state.messageInput,
    isSending: state.isSending,

    // Realtime state
    isOtherUserTyping: state.isOtherUserTyping,
    typingUserName: state.typingUserName,

    // CTA state (backward-compat: derive activeModal from useModalManager)
    activeModal: modals.openModal,
    modalContext: modals.getData(modals.openModal),

    // VM modal state (backward-compat: derive from useModalManager)
    showVMModal: modals.isOpen('vm'),
    vmInitialView: modals.getData('vm')?.initialView ?? '',

    // Handlers
    handleThreadSelect,
    handleMessageInputChange,
    handleSendMessage,
    handleRetry,
    insertSuggestion,
    handlePanelAction,

    // CTA handlers
    handleCTAClick,
    getCTAButtonConfig,
    handleCloseModal,

    // Proposal modal state
    proposalModalData: state.proposalModalData,
    zatConfig: state.zatConfig,
    isSubmittingProposal: state.isSubmittingProposal,
    handleProposalSubmit,

    // VM modal handlers
    handleCloseVMModal,
    handleVMSuccess,
  };
}
