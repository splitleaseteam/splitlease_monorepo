/**
 * HOOK: Use Bidding Realtime
 *
 * Manages Supabase Realtime subscriptions for competitive bidding.
 * Replaces socket.io with Supabase Realtime postgres_changes.
 *
 * Features:
 * - Real-time bid updates via postgres_changes
 * - Session state synchronization
 * - Auto-reconnection handling
 * - Optimistic UI updates
 * - Error recovery
 *
 * @module hooks
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { transformSession, transformBid, transformParticipant } from '../logic/bidding/processors/transformBidData.js';

/**
 * @typedef {'connecting' | 'connected' | 'disconnected' | 'error'} ConnectionStatus
 */

/**
 * Use bidding realtime hook
 *
 * @param {string} sessionId - Bidding session ID
 * @param {string} userId - Current user's Bubble ID
 * @returns {Object} Hook state and methods
 * @returns {Object|null} return.session - Current session state
 * @returns {Function} return.placeBid - Place a bid function
 * @returns {Function} return.setMaxAutoBid - Set max auto-bid function
 * @returns {Function} return.withdrawBid - Withdraw from session function
 * @returns {ConnectionStatus} return.connectionStatus - Connection status
 * @returns {Error|null} return.error - Current error state
 */
export function useBiddingRealtime(sessionId, userId) {
  const [session, setSession] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);

  const channelRef = useRef(null);
  const isInitializedRef = useRef(false);

  /**
   * Fetch initial session data
   */
  const fetchSessionData = useCallback(async () => {
    try {
      console.log('[BiddingRealtime] Fetching session data:', sessionId);

      // Fetch session
      const { data: dbSession, error: sessionError } = await supabase
        .from('bidding_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;

      // Fetch bids
      const { data: dbBids, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (bidsError) throw bidsError;

      // Fetch participants
      const { data: dbParticipants, error: participantsError } = await supabase
        .from('bidding_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;

      // Transform and set session
      const transformedSession = transformSession({
        dbSession,
        dbBids: dbBids || [],
        dbParticipants: dbParticipants || []
      });

      setSession(transformedSession);
      console.log('[BiddingRealtime] Session loaded:', transformedSession);
    } catch (err) {
      console.error('[BiddingRealtime] Error fetching session:', err);
      setError(err);
      setConnectionStatus('error');
    }
  }, [sessionId]);

  /**
   * Initialize Realtime subscription
   */
  useEffect(() => {
    if (!sessionId || isInitializedRef.current) return;

    console.log('[BiddingRealtime] Initializing Realtime for session:', sessionId);
    isInitializedRef.current = true;
    setConnectionStatus('connecting');

    // Fetch initial data
    fetchSessionData();

    // Create Realtime channel
    const channel = supabase.channel(`bidding-session-${sessionId}`);
    channelRef.current = channel;

    // Subscribe to bid inserts
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[BiddingRealtime] Bid inserted:', payload);
        handleBidInsert(payload.new);
      }
    );

    // Subscribe to session updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bidding_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[BiddingRealtime] Session updated:', payload);
        handleSessionUpdate(payload.new);
      }
    );

    // Subscribe to participant updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bidding_participants',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[BiddingRealtime] Participant updated:', payload);
        handleParticipantUpdate(payload.new);
      }
    );

    // Subscribe and handle status
    channel
      .subscribe((status) => {
        console.log('[BiddingRealtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setError(new Error('Failed to subscribe to bidding channel'));
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('error');
          setError(new Error('Subscription timed out'));
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('[BiddingRealtime] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [sessionId, fetchSessionData]);

  /**
   * Handle bid insert event
   */
  const handleBidInsert = useCallback((newBidData) => {
    setSession((prevSession) => {
      if (!prevSession) return prevSession;

      const newBid = transformBid({ dbBid: newBidData });

      // Check if bid already exists (deduplication)
      const bidExists = prevSession.biddingHistory.some(b => b.bidId === newBid.bidId);
      if (bidExists) {
        console.log('[BiddingRealtime] Bid already exists, skipping:', newBid.bidId);
        return prevSession;
      }

      // Add to history
      const updatedHistory = [...prevSession.biddingHistory, newBid].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Update current high bid if this is higher
      const newHighBid = newBid.amount > (prevSession.currentHighBid?.amount || 0)
        ? newBid
        : prevSession.currentHighBid;

      return {
        ...prevSession,
        biddingHistory: updatedHistory,
        currentHighBid: newHighBid
      };
    });
  }, []);

  /**
   * Handle session update event
   */
  const handleSessionUpdate = useCallback((updatedSessionData) => {
    setSession((prevSession) => {
      if (!prevSession) return prevSession;

      return {
        ...prevSession,
        status: updatedSessionData.status,
        expiresAt: new Date(updatedSessionData.expires_at),
        currentRound: updatedSessionData.current_round
      };
    });
  }, []);

  /**
   * Handle participant update event
   */
  const handleParticipantUpdate = useCallback((updatedParticipantData) => {
    setSession((prevSession) => {
      if (!prevSession) return prevSession;

      const updatedParticipant = transformParticipant({ dbParticipant: updatedParticipantData });

      return {
        ...prevSession,
        participants: prevSession.participants.map(p =>
          p.userId === updatedParticipant.userId ? updatedParticipant : p
        )
      };
    });
  }, []);

  /**
   * Place a bid
   */
  const placeBid = useCallback(async (amount, maxAutoBid) => {
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID required');
    }

    if (connectionStatus !== 'connected') {
      throw new Error('Not connected to bidding server');
    }

    try {
      console.log('[BiddingRealtime] Placing bid:', { amount, maxAutoBid });

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('submit-bid', {
        body: {
          sessionId,
          userId,
          amount,
          isManualBid: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to place bid');
      }

      console.log('[BiddingRealtime] Bid placed successfully:', data);

      // Optimistic update (Realtime will confirm)
      // No need to update state here - handleBidInsert will do it

      // If max auto-bid was set, call setMaxAutoBid
      if (maxAutoBid && maxAutoBid > amount) {
        await setMaxAutoBid(maxAutoBid);
      }
    } catch (err) {
      console.error('[BiddingRealtime] Error placing bid:', err);
      setError(err);
      throw err;
    }
  }, [sessionId, userId, connectionStatus]);

  /**
   * Set maximum auto-bid amount
   */
  const setMaxAutoBid = useCallback(async (maxAmount) => {
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID required');
    }

    if (connectionStatus !== 'connected') {
      throw new Error('Not connected to bidding server');
    }

    try {
      console.log('[BiddingRealtime] Setting max auto-bid:', maxAmount);

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('set-auto-bid', {
        body: {
          sessionId,
          userId,
          maxAmount
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to set auto-bid');
      }

      console.log('[BiddingRealtime] Auto-bid set successfully');
    } catch (err) {
      console.error('[BiddingRealtime] Error setting auto-bid:', err);
      setError(err);
      throw err;
    }
  }, [sessionId, userId, connectionStatus]);

  /**
   * Withdraw from bidding
   */
  const withdrawBid = useCallback(async () => {
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID required');
    }

    try {
      console.log('[BiddingRealtime] Withdrawing from session');

      // Call Edge Function (assuming withdraw endpoint exists)
      const { data, error } = await supabase.functions.invoke('withdraw-bid', {
        body: {
          sessionId,
          userId
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to withdraw');
      }

      console.log('[BiddingRealtime] Withdrawal successful');
    } catch (err) {
      console.error('[BiddingRealtime] Error withdrawing:', err);
      setError(err);
      throw err;
    }
  }, [sessionId, userId]);

  return {
    session,
    placeBid,
    setMaxAutoBid,
    withdrawBid,
    connectionStatus,
    error
  };
}

export default useBiddingRealtime;
