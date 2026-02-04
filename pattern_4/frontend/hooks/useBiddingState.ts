/**
 * BIDDING STATE HOOK
 *
 * Manages local UI state for bidding interface.
 * Handles view transitions, intro display, and user preferences.
 *
 * Features:
 * - View state management
 * - localStorage persistence
 * - Intro dismissal
 * - User preferences
 *
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

type BiddingView = 'intro' | 'bidding' | 'winner_announcement';

interface BiddingStateReturn {
  currentView: BiddingView;
  setCurrentView: (view: BiddingView) => void;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;
  userPreferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

interface UserPreferences {
  autoEnableAutoBid: boolean;
  defaultAutoBidPercentage: number; // % above minimum
  showQuickBids: boolean;
  enableNotifications: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  autoEnableAutoBid: false,
  defaultAutoBidPercentage: 20, // 20% above minimum
  showQuickBids: true,
  enableNotifications: true,
  soundEnabled: true
};

/**
 * Local bidding state management hook
 */
export function useBiddingState(sessionId: string): BiddingStateReturn {

  const [currentView, setCurrentView] = useState<BiddingView>('bidding');
  const [hasSeenIntro, setHasSeenIntroState] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load from localStorage on mount
  useEffect(() => {
    if (!sessionId) return;

    // Load intro status
    const introKey = `bidding_intro_seen_${sessionId}`;
    const introSeen = localStorage.getItem(introKey) === 'true';
    setHasSeenIntroState(introSeen);

    // Load user preferences
    const prefsKey = 'bidding_user_preferences';
    const storedPrefs = localStorage.getItem(prefsKey);
    if (storedPrefs) {
      try {
        const parsedPrefs = JSON.parse(storedPrefs);
        setUserPreferences({ ...DEFAULT_PREFERENCES, ...parsedPrefs });
      } catch (err) {
        console.error('[BiddingState] Failed to parse preferences:', err);
      }
    }

    // Set initial view based on intro status
    if (!introSeen) {
      setCurrentView('intro');
    } else {
      setCurrentView('bidding');
    }

  }, [sessionId]);

  /**
   * Mark intro as seen and persist
   */
  const setHasSeenIntro = useCallback((seen: boolean) => {
    setHasSeenIntroState(seen);

    const introKey = `bidding_intro_seen_${sessionId}`;
    localStorage.setItem(introKey, seen.toString());

    if (seen && currentView === 'intro') {
      setCurrentView('bidding');
    }
  }, [sessionId, currentView]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setUserPreferences(prev => {
      const newPrefs = { ...prev, ...updates };

      // Persist to localStorage
      const prefsKey = 'bidding_user_preferences';
      localStorage.setItem(prefsKey, JSON.stringify(newPrefs));

      return newPrefs;
    });
  }, []);

  return {
    currentView,
    setCurrentView,
    hasSeenIntro,
    setHasSeenIntro,
    userPreferences,
    updatePreferences
  };
}

export default useBiddingState;
