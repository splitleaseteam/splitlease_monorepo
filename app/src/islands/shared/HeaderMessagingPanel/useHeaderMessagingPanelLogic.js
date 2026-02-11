/**
 * useHeaderMessagingPanelLogic
 *
 * All business logic for the Header Messaging Panel following Hollow Component Pattern.
 * Adapted from useMessagingPageLogic.js for the compact panel context.
 *
 * Responsibilities:
 * - Fetch threads on panel open
 * - Fetch messages when thread selected
 * - Message sending handler
 * - Real-time subscriptions for instant message delivery
 * - Typing indicators via Presence
 * - View state management (list vs thread)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { getUserId, getSessionId } from '../../../lib/secureStorage.js';
import { useCTAHandler } from '../../pages/MessagingPage/useCTAHandler.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';
import { calculateNextAvailableCheckIn } from '../../../logic/calculators/scheduling/calculateNextAvailableCheckIn.js';
import { clearProposalDraft } from '../CreateProposalFlowV2.jsx';

/**
 * @param {object} options
 * @param {boolean} options.isOpen - Whether the panel is currently open
 * @param {string} options.userId - The user's ID
 * @param {string} options.userName - The user's first name (for typing indicator)
 * @param {string} options.userAvatar - The user's avatar URL
 * @param {function} options.onClose - Callback to close the panel
 * @param {function} [options.onUnreadCountChange] - Callback to refresh header unread count
 */
export function useHeaderMessagingPanelLogic({
  isOpen,
  userId,
  userName,
  userAvatar,
  _onClose,
  onUnreadCountChange,
}) {
  // ============================================================================
  // DATA STATE
  // ============================================================================
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadInfo, setThreadInfo] = useState(null);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [viewState, setViewState] = useState('list'); // 'list' | 'thread'
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ============================================================================
  // REALTIME STATE
  // ============================================================================
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Track if threads have been loaded this session
  const hasLoadedThreads = useRef(false);

  // ============================================================================
  // MODAL STATE
  // ============================================================================
  const [activeModal, setActiveModal] = useState(null);
  const [modalContext, setModalContext] = useState(null);
  const [proposalModalData, setProposalModalData] = useState(null);
  const [zatConfig, setZatConfig] = useState(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================
  const handleOpenModal = useCallback(async (modalName, context) => {
    console.log('[HeaderMessagingPanel] handleOpenModal called:', modalName, context);

    // Special handling for CreateProposalFlowV2 modal
    if (modalName === 'CreateProposalFlowV2') {
      console.log('[HeaderMessagingPanel] Opening CreateProposalFlowV2 modal');

      // Get listing data from threadInfo or context
      const listingId = context?.listingId || threadInfo?.listing_id;

      if (!listingId) {
        console.error('[HeaderMessagingPanel] No listing ID available for proposal modal');
        return;
      }

      try {
        // Fetch listing details for the proposal modal
        const { data: listingData, error: listingError } = await supabase
          .from('listing')
          .select('*')
          .eq('id', listingId)
          .single();

        if (listingError) {
          console.error('[HeaderMessagingPanel] Error fetching listing for proposal:', listingError);
          return;
        }

        console.log('[HeaderMessagingPanel] Listing data fetched:', listingData?.listing_title);

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
          console.error('[HeaderMessagingPanel] Error calculating smart move-in date:', err);
        }

        // Transform listing data for the modal
        const transformedListing = {
          id: listingData.id,
          Name: listingData.listing_title || 'Unnamed Listing',
          title: listingData.listing_title || 'Unnamed Listing',
          'Primary Photo': listingData['Primary Photo'],
          host: null,
          // Pricing fields
          nightly_rate_for_2_night_stay: listingData.nightly_rate_for_2_night_stay,
          nightly_rate_for_3_night_stay: listingData.nightly_rate_for_3_night_stay,
          nightly_rate_for_4_night_stay: listingData.nightly_rate_for_4_night_stay,
          nightly_rate_for_5_night_stay: listingData.nightly_rate_for_5_night_stay,
          nightly_rate_for_7_night_stay: listingData.nightly_rate_for_7_night_stay,
          weekly_rate_paid_to_host: listingData.weekly_rate_paid_to_host,
          monthly_rate_paid_to_host: listingData.monthly_rate_paid_to_host,
          price_override: listingData['price_override'],
          cleaning_fee_amount: listingData.cleaning_fee_amount,
          damage_deposit_amount: listingData.damage_deposit_amount,
          unit_markup_percentage: listingData.unit_markup_percentage,
          rental_type: listingData.rental_type,
          weeks_offered_schedule_text: listingData.weeks_offered_schedule_text,
          // Availability fields
          ' First Available': listingData.first_available_date,
          'Last Available': listingData['Last Available'],
          '# of nights available': listingData['# of nights available'],
          'Dates - Blocked': listingData.blocked_specific_dates_json,
          'Nights Available (numbers)': listingData['Nights Available (numbers)'],
          'Minimum Nights': listingData.minimum_nights_per_stay,
          'Maximum Nights': listingData.maximum_nights_per_stay,
          'Days Available (List of Days)': listingData.available_days_as_day_numbers_json
        };

        // Set proposal modal data
        setProposalModalData({
          listing: transformedListing,
          moveInDate: smartMoveInDate,
          daysSelected: initialDays,
          nightsSelected: initialDays.length > 0 ? initialDays.length - 1 : 0,
          reservationSpan: 13, // Default to 13 weeks
          priceBreakdown: null // Will be calculated by the modal
        });

        // Set the active modal
        setActiveModal(modalName);
        setModalContext(context);

      } catch (err) {
        console.error('[HeaderMessagingPanel] Error preparing proposal modal:', err);
      }

      return;
    }

    // Default handling for other modals
    setActiveModal(modalName);
    setModalContext(context);
  }, [threadInfo]);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setModalContext(null);
    setProposalModalData(null);
  }, []);

  // ============================================================================
  // PROPOSAL SUBMISSION HANDLER
  // ============================================================================
  const handleProposalSubmit = async (proposalData) => {
    console.log('[HeaderMessagingPanel] Proposal submission initiated:', proposalData);
    setIsSubmittingProposal(true);

    try {
      const guestId = getSessionId();
      if (!guestId) {
        throw new Error('User session not found');
      }

      // Days are already in JS format (0-6)
      const daysInJsFormat = proposalData.daysSelectedObjects?.map(d => d.dayOfWeek) || [];
      const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);

      // Check for wrap-around case
      const hasSaturday = sortedJsDays.includes(6);
      const hasSunday = sortedJsDays.includes(0);
      const isWrapAround = hasSaturday && hasSunday && daysInJsFormat.length < 7;

      let checkInDay, checkOutDay, nightsSelected;

      if (isWrapAround) {
        let gapIndex = -1;
        for (let i = 0; i < sortedJsDays.length - 1; i++) {
          if (sortedJsDays[i + 1] - sortedJsDays[i] > 1) {
            gapIndex = i + 1;
            break;
          }
        }

        if (gapIndex !== -1) {
          checkInDay = sortedJsDays[gapIndex];
          checkOutDay = sortedJsDays[gapIndex - 1];
          const reorderedDays = [...sortedJsDays.slice(gapIndex), ...sortedJsDays.slice(0, gapIndex)];
          nightsSelected = reorderedDays.slice(0, -1);
        } else {
          checkInDay = sortedJsDays[0];
          checkOutDay = sortedJsDays[sortedJsDays.length - 1];
          nightsSelected = sortedJsDays.slice(0, -1);
        }
      } else {
        checkInDay = sortedJsDays[0];
        checkOutDay = sortedJsDays[sortedJsDays.length - 1];
        nightsSelected = sortedJsDays.slice(0, -1);
      }

      const reservationSpanWeeks = proposalData.reservationSpan || 13;
      const reservationSpanText = reservationSpanWeeks === 13
        ? '13 weeks (3 months)'
        : reservationSpanWeeks === 20
          ? '20 weeks (approx. 5 months)'
          : `${reservationSpanWeeks} weeks`;

      const listingId = proposalModalData?.listing?.id;
      const payload = {
        guestId: guestId,
        listingId: listingId,
        moveInStartRange: proposalData.moveInDate,
        moveInEndRange: proposalData.moveInDate,
        daysSelected: daysInJsFormat,
        nightsSelected: nightsSelected,
        reservationSpan: reservationSpanText,
        reservationSpanWeeks: reservationSpanWeeks,
        checkIn: checkInDay,
        checkOut: checkOutDay,
        proposalPrice: proposalData.pricePerNight,
        fourWeekRent: proposalData.pricePerFourWeeks,
        hostCompensation: proposalData.pricePerFourWeeks,
        needForSpace: proposalData.needForSpace || '',
        aboutMe: proposalData.aboutYourself || '',
        estimatedBookingTotal: proposalData.totalPrice,
        specialNeeds: proposalData.hasUniqueRequirements ? proposalData.uniqueRequirements : '',
        moveInRangeText: proposalData.moveInRange || '',
        flexibleMoveIn: !!proposalData.moveInRange,
        fourWeekCompensation: proposalData.pricePerFourWeeks
      };

      console.log('[HeaderMessagingPanel] Submitting proposal:', payload);

      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload
        }
      });

      if (error) {
        console.error('[HeaderMessagingPanel] Edge Function error:', error);
        throw new Error(error.message || 'Failed to submit proposal');
      }

      if (!data?.success) {
        console.error('[HeaderMessagingPanel] Proposal submission failed:', data?.error);
        throw new Error(data?.error || 'Failed to submit proposal');
      }

      console.log('[HeaderMessagingPanel] Proposal submitted successfully:', data);

      // Clear localStorage draft
      if (listingId) {
        clearProposalDraft(listingId);
      }

      // Close modal
      handleCloseModal();

    } catch (error) {
      console.error('[HeaderMessagingPanel] Error submitting proposal:', error);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // ============================================================================
  // LOAD ZAT CONFIG ON MOUNT
  // ============================================================================
  useEffect(() => {
    const loadZatConfig = async () => {
      try {
        const config = await fetchZatPriceConfiguration();
        setZatConfig(config);
      } catch (error) {
        console.warn('[HeaderMessagingPanel] Failed to load ZAT config:', error);
      }
    };
    loadZatConfig();
  }, []);

  // ============================================================================
  // CTA HANDLER (reuse from MessagingPage)
  // ============================================================================
  const user = { id: userId };
  const { handleCTAClick, getCTAButtonConfig } = useCTAHandler({
    user,
    selectedThread,
    threadInfo,
    onOpenModal: handleOpenModal,
  });

  // ============================================================================
  // FETCH THREADS WHEN PANEL OPENS
  // ============================================================================
  useEffect(() => {
    // Only fetch if panel is open, we have a user ID, and haven't loaded yet
    if (isOpen && userId && !hasLoadedThreads.current) {
      fetchThreads();
    }
  }, [isOpen, userId]);

  // Reset when panel closes
  useEffect(() => {
    if (!isOpen) {
      // Keep threads cached but reset view
      setViewState('list');
      setSelectedThread(null);
      setMessages([]);
      setMessageInput('');
      setIsOtherUserTyping(false);
      setTypingUserName(null);
    }
  }, [isOpen]);

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================
  useEffect(() => {
    if (!selectedThread || !userId || !isOpen) return;

    const channelName = `panel-messages-${selectedThread._id}`;
    console.log('[Panel Realtime] Subscribing to:', channelName);

    const channel = supabase.channel(channelName);

    // Listen for new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'thread_message',
      },
      (payload) => {
        const newRow = payload.new;
        if (!newRow) return;

        // Client-side filter for this thread
        if (newRow['thread_id'] !== selectedThread._id) {
          return;
        }

        const isOwnMessage = newRow['originator_user_id'] === userId;

        // Add message to state (avoid duplicates)
        setMessages((prev) => {
          if (prev.some((m) => m._id === newRow.id)) return prev;

          const transformedMessage = {
            _id: newRow.id,
            message_body: newRow['message_body_text'],
            sender_name: newRow['is_from_split_bot']
              ? 'Split Bot'
              : isOwnMessage
                ? 'You'
                : selectedThread.contact_name || 'User',
            sender_avatar: isOwnMessage ? userAvatar : undefined,
            sender_type: newRow['is_from_split_bot']
              ? 'splitbot'
              : newRow['originator_user_id'] === newRow['host_user_id']
                ? 'host'
                : 'guest',
            is_outgoing: isOwnMessage,
            timestamp: new Date(newRow['original_created_at']).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
            call_to_action: newRow['Call to Action']
              ? { type: newRow['Call to Action'], message: 'View Details' }
              : undefined,
            split_bot_warning: newRow['Split Bot Warning'],
          };

          return [...prev, transformedMessage];
        });

        // Clear typing indicator when message received
        if (!isOwnMessage) {
          setIsOtherUserTyping(false);
          setTypingUserName(null);
        }
      }
    );

    // Listen for typing indicators via presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUsers = Object.values(state)
        .flat()
        .filter((u) => u.typing && u.user_id !== userId);

      if (typingUsers.length > 0) {
        setIsOtherUserTyping(true);
        setTypingUserName(typingUsers[0].user_name);
      } else {
        setIsOtherUserTyping(false);
        setTypingUserName(null);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName || 'User',
          typing: false,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [selectedThread?._id, userId, isOpen]);

  // ============================================================================
  // TYPING INDICATOR
  // ============================================================================
  const trackTyping = useCallback(
    async (isTyping) => {
      if (!channelRef.current || !userId) return;

      try {
        await channelRef.current.track({
          user_id: userId,
          user_name: userName || 'User',
          typing: isTyping,
          typing_at: isTyping ? new Date().toISOString() : null,
          online_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Panel Realtime] Failed to track typing:', err);
      }
    },
    [userId, userName]
  );

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Fetch all threads for the authenticated user
   */
  async function fetchThreads() {
    try {
      setIsLoading(true);
      setError(null);

      const currentUserId = userId || getUserId();
      if (!currentUserId) {
        throw new Error('User ID not available');
      }

      // Query threads where user is host or guest
      // Uses RPC function because PostgREST .or() doesn't handle column names
      // with leading hyphens ("host_user_id", "guest_user_id") correctly
      const { data: threadsData, error: threadsError } = await supabase
        .rpc('get_user_threads', { user_id: currentUserId });

      if (threadsError) {
        throw new Error(`Failed to fetch threads: ${threadsError.message}`);
      }

      if (!threadsData || threadsData.length === 0) {
        setThreads([]);
        hasLoadedThreads.current = true;
        return;
      }

      // Collect contact IDs and listing IDs for batch lookup
      const contactIds = new Set();
      const listingIds = new Set();

      threadsData.forEach((thread) => {
        const hostId = thread['host_user_id'];
        const guestId = thread['guest_user_id'];
        const contactId = hostId === currentUserId ? guestId : hostId;
        if (contactId) contactIds.add(contactId);
        if (thread['listing_id']) listingIds.add(thread['listing_id']);
      });

      // Batch fetch contact user data
      let contactMap = {};
      if (contactIds.size > 0) {
        const { data: contacts } = await supabase
          .from('user')
          .select('id, first_name, last_name, profile_photo_url')
          .in('id', Array.from(contactIds));

        if (contacts) {
          contactMap = contacts.reduce((acc, contact) => {
            // Format name as "FirstName L." (first name + last initial)
            const firstName = contact.first_name || '';
            const lastName = contact.last_name || '';
            const lastInitial = lastName ? ` ${lastName.charAt(0)}.` : '';
            const displayName = firstName ? `${firstName}${lastInitial}` : 'Unknown User';

            acc[contact.id] = {
              name: displayName,
              avatar: contact.profile_photo_url,
            };
            return acc;
          }, {});
        }
      }

      // Batch fetch listing data
      let listingMap = {};
      if (listingIds.size > 0) {
        const { data: listings } = await supabase
          .from('listing')
          .select('id, listing_title')
          .in('id', Array.from(listingIds));

        if (listings) {
          listingMap = listings.reduce((acc, listing) => {
            acc[listing.id] = listing.listing_title || 'Unnamed Property';
            return acc;
          }, {});
        }
      }

      // Fetch unread message counts per thread for this user
      // Uses JSONB containment operator to check if user is in unread_by_user_ids_json array
      const threadIds = threadsData.map((t) => t._id);
      let unreadCountMap = {};
      if (threadIds.length > 0) {
        const { data: unreadData } = await supabase
          .from('thread_message')
          .select('"thread_id"')
          .in('"thread_id"', threadIds)
          .filter('unread_by_user_ids_json', 'cs', JSON.stringify([currentUserId]));

        if (unreadData) {
          // Count occurrences of each thread ID
          unreadCountMap = unreadData.reduce((acc, msg) => {
            const threadId = msg['thread_id'];
            acc[threadId] = (acc[threadId] || 0) + 1;
            return acc;
          }, {});
        }
      }

      // Compute visibility-aware message previews
      // The static ~Last Message field doesn't consider visibility, so we fetch
      // the most recent message visible to the current user for each thread
      const visiblePreviewMap = {};
      if (threadIds.length > 0) {
        // Build a map of thread -> user role (host or guest)
        const threadRoles = {};
        threadsData.forEach((thread) => {
          threadRoles[thread._id] = thread['host_user_id'] === currentUserId ? 'host' : 'guest';
        });

        // Fetch recent messages for all threads with visibility info
        const { data: messagesData } = await supabase
          .from('thread_message')
          .select('"thread_id", message_body_text, original_created_at, "is Visible to Host", "is Visible to Guest"')
          .in('"thread_id"', threadIds)
          .order('original_created_at', { ascending: false });

        if (messagesData && messagesData.length > 0) {
          // For each thread, find the most recent message visible to the user
          for (const threadId of threadIds) {
            const role = threadRoles[threadId];
            const visibleMessage = messagesData.find((msg) => {
              if (msg['thread_id'] !== threadId) return false;
              return role === 'host'
                ? msg['is Visible to Host'] === true
                : msg['is Visible to Guest'] === true;
            });

            if (visibleMessage && visibleMessage['message_body_text']) {
              visiblePreviewMap[threadId] = visibleMessage['message_body_text'].substring(0, 100);
            }
          }
        }
      }

      // Transform threads to UI format
      const transformedThreads = threadsData.map((thread) => {
        const hostId = thread['host_user_id'];
        const guestId = thread['guest_user_id'];
        const contactId = hostId === currentUserId ? guestId : hostId;
        const contact = contactId ? contactMap[contactId] : null;

        // Format the last modified time
        const modifiedDate = thread.original_updated_at
          ? new Date(thread.original_updated_at)
          : new Date();
        const now = new Date();
        const diffMs = now.getTime() - modifiedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let lastMessageTime;
        if (diffDays === 0) {
          lastMessageTime = modifiedDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
        } else if (diffDays === 1) {
          lastMessageTime = 'Yesterday';
        } else if (diffDays < 7) {
          lastMessageTime = modifiedDate.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          lastMessageTime = modifiedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        }

        return {
          _id: thread._id,
          'host_user_id': hostId,
          'guest_user_id': guestId,
          contact_name: contact?.name || 'Split Lease',
          contact_avatar: contact?.avatar,
          property_name: thread['listing_id'] ? listingMap[thread['listing_id']] : undefined,
          // Use visibility-aware preview if available, fall back to static ~Last Message
          last_message_preview: visiblePreviewMap[thread._id] || thread['~Last Message'] || 'No messages yet',
          last_message_time: lastMessageTime,
          unread_count: unreadCountMap[thread._id] || 0,
          is_with_splitbot: false,
        };
      });

      setThreads(transformedThreads);
      hasLoadedThreads.current = true;
    } catch (err) {
      console.error('[Panel] Error fetching threads:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Fetch messages for a specific thread
   */
  async function fetchMessages(threadId) {
    try {
      setIsLoadingMessages(true);

      // Include user_id in payload for legacy auth support
      // Edge Function accepts user_id when no JWT Authorization header is present
      const currentUserId = userId || getUserId();

      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'get_messages',
          payload: {
            thread_id: threadId,
            user_id: currentUserId,  // Legacy auth: pass user_id inside payload
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch messages');
      }

      if (data?.success) {
        setMessages(data.data.messages || []);
        setThreadInfo(data.data.thread_info || null);

        // Refresh header unread count after backend marks messages as read
        // Small delay ensures database update completes (fire-and-forget on backend)
        if (onUnreadCountChange) {
          setTimeout(() => {
            onUnreadCountChange();
          }, 500);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('[Panel] Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  /**
   * Send a new message
   */
  async function sendMessage() {
    if (!messageInput.trim() || !selectedThread || isSending) return;

    try {
      setIsSending(true);

      // Clear typing indicator
      trackTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Include user_id in payload for legacy auth support
      const currentUserId = userId || getUserId();

      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'send_message',
          payload: {
            thread_id: selectedThread._id,
            message_body: messageInput.trim(),
            user_id: currentUserId,  // Legacy auth: pass user_id inside payload
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send message');
      }

      if (data?.success) {
        // Clear input immediately
        setMessageInput('');

        // Add optimistic message
        const optimisticMessage = {
          _id: data.data.message_id,
          message_body: messageInput.trim(),
          sender_name: 'You',
          sender_type: 'guest',
          is_outgoing: true,
          timestamp: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => {
          if (prev.some((m) => m._id === optimisticMessage._id)) return prev;
          return [...prev, optimisticMessage];
        });

        // Update thread's last message preview
        setThreads((prev) =>
          prev.map((t) =>
            t._id === selectedThread._id
              ? { ...t, last_message_preview: messageInput.trim(), last_message_time: 'Just now' }
              : t
          )
        );
      } else {
        throw new Error(data?.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('[Panel] Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle thread selection
   */
  const handleThreadSelect = useCallback((thread) => {
    console.log('[Panel] Thread selected:', thread._id, thread.contact_name);
    setSelectedThread(thread);
    setMessages([]);
    setThreadInfo(null);
    setViewState('thread');
    setIsOtherUserTyping(false);
    setTypingUserName(null);
    fetchMessages(thread._id);

    // Clear unread badge for this thread in local state
    // The backend will mark messages as read; this keeps UI in sync
    if (thread.unread_count > 0) {
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t._id === thread._id ? { ...t, unread_count: 0 } : t
        )
      );
    }
  }, []);

  /**
   * Handle back to thread list
   */
  const handleBackToList = useCallback(() => {
    setViewState('list');
    setSelectedThread(null);
    setMessages([]);
    setMessageInput('');
    setIsOtherUserTyping(false);
    setTypingUserName(null);
  }, []);

  /**
   * Handle message input change with typing indicator
   */
  const handleMessageInputChange = useCallback(
    (value) => {
      if (value.length <= 1000) {
        setMessageInput(value);

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
    },
    [trackTyping]
  );

  /**
   * Handle send message
   */
  const handleSendMessage = useCallback(() => {
    sendMessage();
  }, [messageInput, selectedThread, isSending]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    setError(null);
    hasLoadedThreads.current = false;
    fetchThreads();
  }, []);

  /**
   * Refresh threads (can be called from parent when badge updates)
   */
  const refreshThreads = useCallback(() => {
    hasLoadedThreads.current = false;
    fetchThreads();
  }, []);

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================
  return {
    // Thread data
    threads,
    selectedThread,
    messages,
    threadInfo,

    // UI state
    viewState,
    isLoading,
    isLoadingMessages,
    error,
    messageInput,
    isSending,

    // Realtime state
    isOtherUserTyping,
    typingUserName,

    // Modal state
    activeModal,
    modalContext,
    proposalModalData,
    zatConfig,
    isSubmittingProposal,

    // Handlers
    handleThreadSelect,
    handleBackToList,
    handleMessageInputChange,
    handleSendMessage,
    handleRetry,
    refreshThreads,

    // CTA handlers
    handleCTAClick,
    getCTAButtonConfig,

    // Modal handlers
    handleCloseModal,
    handleProposalSubmit,
  };
}
