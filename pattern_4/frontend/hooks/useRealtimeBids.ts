/**
 * REALTIME BIDS HOOK (WebSocket Integration)
 *
 * Manages WebSocket connection for real-time bidding updates.
 * Handles bid placement, auto-bid management, and live session updates.
 *
 * Features:
 * - WebSocket connection management
 * - Real-time bid updates
 * - Auto-reconnection
 * - Connection status tracking
 * - Error handling
 *
 * @version 1.0.0
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BiddingSession, Bid, BiddingParticipant } from '../types/biddingTypes';

interface UseRealtimeBidsReturn {
  session: BiddingSession | null;
  placeBid: (amount: number) => Promise<void>;
  setMaxAutoBid: (maxAmount: number) => Promise<void>;
  withdrawBid: () => Promise<void>;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: Error | null;
}

interface BidPlacedEvent {
  bid: Bid;
  session: BiddingSession;
}

interface AutoBidEvent {
  bid: Bid;
  triggeredBy: string;
  session: BiddingSession;
}

interface SessionEndedEvent {
  winner: string;
  loser: string;
  winningBid: number;
  compensation: number;
  session: BiddingSession;
}

/**
 * Real-time bidding hook
 *
 * Connects to WebSocket server and manages bidding state.
 * Auto-reconnects on disconnection.
 */
export function useRealtimeBids(sessionId: string): UseRealtimeBidsReturn {

  const [session, setSession] = useState<BiddingSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!sessionId) return;

    console.log('[WebSocket] Connecting to bidding session:', sessionId);
    setConnectionStatus('connecting');

    // Create WebSocket connection
    const socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001', {
      path: '/bidding',
      query: { sessionId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      setConnectionStatus('error');
      setError(err as Error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      setConnectionStatus('error');
      setError(new Error('Failed to reconnect to bidding server'));
    });

    // Session initialization
    socket.on('session:init', (initialSession: BiddingSession) => {
      console.log('[WebSocket] Session initialized:', initialSession);
      setSession(initialSession);
    });

    // Bid placed event
    socket.on('bid:placed', (event: BidPlacedEvent) => {
      console.log('[WebSocket] Bid placed:', event.bid);
      setSession(event.session);

      // Show notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('New Bid Placed', {
            body: `${event.bid.userName} bid $${event.bid.amount}`,
            icon: '/bid-icon.png'
          });
        }
      }
    });

    // Auto-bid triggered event
    socket.on('bid:autobid', (event: AutoBidEvent) => {
      console.log('[WebSocket] Auto-bid triggered:', event.bid);
      setSession(event.session);

      // Show notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Auto-Bid Activated', {
            body: `${event.bid.userName} auto-bid to $${event.bid.amount}`,
            icon: '/autobid-icon.png'
          });
        }
      }
    });

    // Session ended event
    socket.on('session:ended', (event: SessionEndedEvent) => {
      console.log('[WebSocket] Session ended:', event);
      setSession(event.session);

      // Show notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Bidding Complete', {
            body: `Winner: ${event.winner} at $${event.winningBid}`,
            icon: '/winner-icon.png'
          });
        }
      }
    });

    // Participant updated event
    socket.on('participant:update', (participant: BiddingParticipant) => {
      console.log('[WebSocket] Participant updated:', participant);
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === participant.userId ? participant : p
          )
        };
      });
    });

    // Error event
    socket.on('error', (err: { message: string; code: string }) => {
      console.error('[WebSocket] Error:', err);
      setError(new Error(err.message));
    });

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };

  }, [sessionId]);

  /**
   * Place a bid
   */
  const placeBid = useCallback(async (amount: number) => {
    if (!socketRef.current || !isConnected) {
      throw new Error('Not connected to bidding server');
    }

    if (!session) {
      throw new Error('Session not initialized');
    }

    console.log('[WebSocket] Placing bid:', amount);

    return new Promise<void>((resolve, reject) => {
      socketRef.current!.emit('bid:place', {
        sessionId,
        amount,
        timestamp: new Date()
      }, (response: { success: boolean; error?: string; bid?: Bid }) => {
        if (response.success) {
          console.log('[WebSocket] Bid placed successfully:', response.bid);
          resolve();
        } else {
          console.error('[WebSocket] Bid placement failed:', response.error);
          reject(new Error(response.error || 'Failed to place bid'));
        }
      });
    });
  }, [sessionId, session, isConnected]);

  /**
   * Set maximum auto-bid amount
   */
  const setMaxAutoBid = useCallback(async (maxAmount: number) => {
    if (!socketRef.current || !isConnected) {
      throw new Error('Not connected to bidding server');
    }

    console.log('[WebSocket] Setting max auto-bid:', maxAmount);

    return new Promise<void>((resolve, reject) => {
      socketRef.current!.emit('bid:setAutoMax', {
        sessionId,
        maxAmount
      }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[WebSocket] Auto-bid max set successfully');
          resolve();
        } else {
          console.error('[WebSocket] Setting auto-bid max failed:', response.error);
          reject(new Error(response.error || 'Failed to set auto-bid max'));
        }
      });
    });
  }, [sessionId, isConnected]);

  /**
   * Withdraw from bidding
   */
  const withdrawBid = useCallback(async () => {
    if (!socketRef.current || !isConnected) {
      throw new Error('Not connected to bidding server');
    }

    console.log('[WebSocket] Withdrawing from bidding');

    return new Promise<void>((resolve, reject) => {
      socketRef.current!.emit('bid:withdraw', {
        sessionId
      }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[WebSocket] Withdrawal successful');
          resolve();
        } else {
          console.error('[WebSocket] Withdrawal failed:', response.error);
          reject(new Error(response.error || 'Failed to withdraw'));
        }
      });
    });
  }, [sessionId, isConnected]);

  return {
    session,
    placeBid,
    setMaxAutoBid,
    withdrawBid,
    isConnected,
    connectionStatus,
    error
  };
}

export default useRealtimeBids;
