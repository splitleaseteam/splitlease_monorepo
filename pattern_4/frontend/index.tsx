/**
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - MAIN ORCHESTRATOR
 *
 * Production-ready competitive bidding interface for when both roommates
 * are Big Spenders competing for the same night.
 *
 * Features:
 * - Real-time WebSocket bidding
 * - Auto-bid proxy system (eBay-style)
 * - Live competitor status
 * - Winner announcement
 * - 25% loser compensation
 *
 * @version 1.0.0
 * @package pattern-4-bs-competition
 */

import React, { useEffect, useState, useCallback } from 'react';
import { BiddingInterface } from './components/BiddingInterface';
import { WinnerAnnouncement } from './components/WinnerAnnouncement';
import { CompetitorIndicator } from './components/CompetitorIndicator';
import { useRealtimeBids } from './hooks/useRealtimeBids';
import { useBiddingState } from './hooks/useBiddingState';
import { BiddingSession, BiddingStatus } from './types/biddingTypes';
import analyticsService from '@/services/analyticsService';
import './styles/CompetitiveBidding.module.css';

interface CompetitiveBiddingManagerProps {
  sessionId: string;
  currentUserId: string;
  targetNight: Date;
  propertyId: string;
  initialSession?: BiddingSession;
  onSessionEnd?: (result: BiddingResult) => void;
  onError?: (error: Error) => void;
}

interface BiddingResult {
  winner: string;
  loser: string;
  winningBid: number;
  compensation: number;
  platformRevenue: number;
}

/**
 * Main Competitive Bidding Manager Component
 *
 * Orchestrates the entire BS+BS competitive bidding flow:
 * 1. Session initialization
 * 2. Real-time bid updates
 * 3. Winner determination
 * 4. Compensation processing
 */
export const CompetitiveBiddingManager: React.FC<CompetitiveBiddingManagerProps> = ({
  sessionId,
  currentUserId,
  targetNight,
  propertyId,
  initialSession,
  onSessionEnd,
  onError
}) => {

  // Real-time bidding state
  const {
    session,
    placeBid,
    setMaxAutoBid,
    withdrawBid,
    isConnected,
    connectionStatus
  } = useRealtimeBids(sessionId);

  // Local UI state
  const {
    currentView,
    setCurrentView,
    hasSeenIntro,
    setHasSeenIntro
  } = useBiddingState(sessionId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize session
  useEffect(() => {
    if (initialSession) {
      // Track session start
      analyticsService.track('competitive_bidding_viewed', {
        sessionId,
        targetNight: targetNight.toISOString(),
        propertyId,
        participants: initialSession.participants.map(p => p.userId)
      });
    }
  }, [sessionId, initialSession]);

  // Handle session completion
  useEffect(() => {
    if (session?.status === 'completed') {
      const result = calculateSessionResult(session);

      // Track completion
      analyticsService.track('competitive_bidding_ended', {
        sessionId,
        winner: result.winner,
        loser: result.loser,
        winningBid: result.winningBid,
        compensation: result.compensation,
        platformRevenue: result.platformRevenue,
        totalRounds: session.biddingHistory.length,
        sessionDuration: calculateDuration(session.startedAt, new Date())
      });

      // Notify parent
      if (onSessionEnd) {
        onSessionEnd(result);
      }

      // Switch to winner view
      setCurrentView('winner_announcement');
    }
  }, [session?.status]);

  // Handle bid submission
  const handlePlaceBid = useCallback(async (amount: number, autoBidMax?: number) => {
    if (!session) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Place the bid
      await placeBid(amount);

      // Set auto-bid if provided
      if (autoBidMax && autoBidMax > amount) {
        await setMaxAutoBid(autoBidMax);
      }

      // Track bid
      analyticsService.track('bid_placed', {
        sessionId,
        userId: currentUserId,
        bidAmount: amount,
        hasAutoBid: !!autoBidMax,
        autoBidMax,
        round: session.biddingHistory.filter(b => b.userId === currentUserId).length + 1
      });

    } catch (err) {
      const error = err as Error;
      console.error('[Competitive Bidding] Bid placement failed:', error);
      setError(error.message);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [session, placeBid, setMaxAutoBid, currentUserId]);

  // Handle withdrawal
  const handleWithdraw = useCallback(async () => {
    if (!confirm('Are you sure you want to withdraw from bidding?')) {
      return;
    }

    try {
      await withdrawBid();

      analyticsService.track('bid_withdrawn', {
        sessionId,
        userId: currentUserId
      });
    } catch (err) {
      console.error('[Competitive Bidding] Withdrawal failed:', err);
      setError((err as Error).message);
    }
  }, [withdrawBid, currentUserId]);

  // Loading state
  if (!session) {
    return (
      <div className="competitive-bidding-loading">
        <div className="loading-spinner" />
        <p>Loading bidding session...</p>
      </div>
    );
  }

  // Connection error state
  if (!isConnected) {
    return (
      <div className="competitive-bidding-error">
        <div className="error-icon">⚠️</div>
        <h3>Connection Lost</h3>
        <p>Unable to connect to bidding server. Please check your connection.</p>
        <button onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  // Winner announcement view
  if (currentView === 'winner_announcement' && session.status === 'completed') {
    return (
      <WinnerAnnouncement
        session={session}
        currentUserId={currentUserId}
        targetNight={targetNight}
      />
    );
  }

  // Main bidding interface
  return (
    <div className="competitive-bidding-manager">

      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        <span className="status-dot" />
        <span className="status-text">
          {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Competitor Indicator */}
      <CompetitorIndicator
        session={session}
        currentUserId={currentUserId}
      />

      {/* Main Bidding Interface */}
      <BiddingInterface
        session={session}
        currentUserId={currentUserId}
        targetNight={targetNight}
        onPlaceBid={handlePlaceBid}
        onWithdraw={handleWithdraw}
        isSubmitting={isSubmitting}
        error={error}
      />

      {/* Session Info Footer */}
      <div className="bidding-session-footer">
        <div className="footer-item">
          <span className="footer-label">Session ID:</span>
          <span className="footer-value">{sessionId.slice(0, 8)}</span>
        </div>
        <div className="footer-item">
          <span className="footer-label">Rounds:</span>
          <span className="footer-value">
            {session.biddingHistory.length} / {session.maxRounds}
          </span>
        </div>
        <div className="footer-item">
          <span className="footer-label">Status:</span>
          <span className={`footer-value status-${session.status}`}>
            {formatStatus(session.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate session result from completed session
 */
function calculateSessionResult(session: BiddingSession): BiddingResult {
  if (!session.currentHighBid) {
    throw new Error('Cannot calculate result without high bid');
  }

  const winner = session.participants.find(
    p => p.userId === session.currentHighBid!.userId
  )!;

  const loser = session.participants.find(
    p => p.userId !== session.currentHighBid!.userId
  )!;

  const winningBid = session.currentHighBid.amount;
  const compensation = Math.round(winningBid * 0.25); // 25% compensation
  const platformRevenue = winningBid - compensation;

  return {
    winner: winner.userId,
    loser: loser.userId,
    winningBid,
    compensation,
    platformRevenue
  };
}

/**
 * Calculate session duration in minutes
 */
function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Format session status for display
 */
function formatStatus(status: BiddingStatus): string {
  const statusMap: Record<BiddingStatus, string> = {
    active: 'Active',
    completed: 'Completed',
    expired: 'Expired',
    cancelled: 'Cancelled'
  };

  return statusMap[status] || status;
}

export default CompetitiveBiddingManager;
