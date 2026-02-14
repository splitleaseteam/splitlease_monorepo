import { describe, it, expect } from 'vitest';
import {
  viewSplitLeaseReducer,
  createInitialState,
  type ViewSplitLeaseState,
  type ViewSplitLeaseAction,
} from '../viewSplitLeaseReducer';

// =============================================================================
// HELPERS
// =============================================================================

function makeState(overrides: Partial<ViewSplitLeaseState> = {}): ViewSplitLeaseState {
  return {
    ...createInitialState({ daysSelected: [], moveInDate: null, reservationSpan: 13 }),
    ...overrides,
  };
}

// =============================================================================
// createInitialState
// =============================================================================

describe('createInitialState', () => {
  it('returns correct shape with URL params', () => {
    const days = [{ dayOfWeek: 1, isSelected: true }];
    const state = createInitialState({
      daysSelected: days,
      moveInDate: '2026-03-15',
      reservationSpan: 26,
    });

    // Core Data defaults
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.listing).toBeNull();
    expect(state.zatConfig).toBeNull();
    expect(state.informationalTexts).toEqual({});

    // Booking Widget from URL
    expect(state.selectedDayObjects).toBe(days);
    expect(state.moveInDate).toBe('2026-03-15');
    expect(state.reservationSpan).toBe(26);
    expect(state.isStrictModeEnabled).toBe(false);

    // Proposal Flow defaults
    expect(state.pendingProposalData).toBeNull();
    expect(state.isSubmittingProposal).toBe(false);

    // User Data defaults
    expect(state.loggedInUserData).toBeNull();
    expect(state.existingProposalForListing).toBeNull();
    expect(state.isFavorited).toBe(false);

    // UI defaults
    expect(state.isMobile).toBe(false);
    expect(state.shouldLoadMap).toBe(false);
  });

  it('accepts empty days and null moveInDate', () => {
    const state = createInitialState({
      daysSelected: [],
      moveInDate: null,
      reservationSpan: 13,
    });

    expect(state.selectedDayObjects).toEqual([]);
    expect(state.moveInDate).toBeNull();
    expect(state.reservationSpan).toBe(13);
  });
});

// =============================================================================
// INIT actions
// =============================================================================

describe('INIT_START', () => {
  it('sets isLoading true and clears error', () => {
    const prev = makeState({ isLoading: false, error: 'old error' });
    const next = viewSplitLeaseReducer(prev, { type: 'INIT_START' });

    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });
});

describe('INIT_SUCCESS', () => {
  it('sets listing, zatConfig, informationalTexts and clears isLoading', () => {
    const prev = makeState({ isLoading: true, error: 'stale' });
    const listing = { id: 'lst-1', listing_title: 'Test' };
    const zatConfig = { base_fee: 10 };
    const informationalTexts = { disclaimer: 'test' };

    const next = viewSplitLeaseReducer(prev, {
      type: 'INIT_SUCCESS',
      payload: { listing, zatConfig, informationalTexts },
    });

    expect(next.listing).toBe(listing);
    expect(next.zatConfig).toBe(zatConfig);
    expect(next.informationalTexts).toBe(informationalTexts);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBeNull();
  });
});

describe('INIT_ERROR', () => {
  it('sets error and clears isLoading', () => {
    const prev = makeState({ isLoading: true });
    const next = viewSplitLeaseReducer(prev, {
      type: 'INIT_ERROR',
      payload: 'Network failure',
    });

    expect(next.error).toBe('Network failure');
    expect(next.isLoading).toBe(false);
  });
});

// =============================================================================
// Booking Widget actions
// =============================================================================

describe('UPDATE_SCHEDULE', () => {
  it('updates selectedDayObjects', () => {
    const prev = makeState({ selectedDayObjects: [] });
    const newDays = [{ dayOfWeek: 1 }, { dayOfWeek: 3 }];
    const next = viewSplitLeaseReducer(prev, {
      type: 'UPDATE_SCHEDULE',
      payload: newDays,
    });

    expect(next.selectedDayObjects).toBe(newDays);
  });
});

describe('SET_MOVE_IN_DATE', () => {
  it('sets moveInDate to a date string', () => {
    const prev = makeState({ moveInDate: null });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_MOVE_IN_DATE',
      payload: '2026-04-01',
    });

    expect(next.moveInDate).toBe('2026-04-01');
  });

  it('sets moveInDate to null', () => {
    const prev = makeState({ moveInDate: '2026-04-01' });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_MOVE_IN_DATE',
      payload: null,
    });

    expect(next.moveInDate).toBeNull();
  });
});

describe('SET_RESERVATION_SPAN', () => {
  it('updates reservationSpan', () => {
    const prev = makeState({ reservationSpan: 13 });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_RESERVATION_SPAN',
      payload: 26,
    });

    expect(next.reservationSpan).toBe(26);
  });
});

describe('SET_STRICT_MODE', () => {
  it('enables strict mode', () => {
    const prev = makeState({ isStrictModeEnabled: false });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_STRICT_MODE',
      payload: true,
    });

    expect(next.isStrictModeEnabled).toBe(true);
  });

  it('disables strict mode', () => {
    const prev = makeState({ isStrictModeEnabled: true });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_STRICT_MODE',
      payload: false,
    });

    expect(next.isStrictModeEnabled).toBe(false);
  });
});

// =============================================================================
// Proposal Flow actions
// =============================================================================

describe('START_PROPOSAL_SUBMIT', () => {
  it('sets isSubmittingProposal to true', () => {
    const prev = makeState({ isSubmittingProposal: false });
    const next = viewSplitLeaseReducer(prev, { type: 'START_PROPOSAL_SUBMIT' });

    expect(next.isSubmittingProposal).toBe(true);
  });
});

describe('PROPOSAL_SUBMIT_SUCCESS', () => {
  it('updates existingProposalForListing and clears isSubmittingProposal', () => {
    const prev = makeState({
      isSubmittingProposal: true,
      pendingProposalData: { some: 'data' },
      existingProposalForListing: null,
    });

    const next = viewSplitLeaseReducer(prev, {
      type: 'PROPOSAL_SUBMIT_SUCCESS',
      payload: { proposalId: 'prop-123' },
    });

    expect(next.isSubmittingProposal).toBe(false);
    expect(next.pendingProposalData).toBeNull();
    expect(next.existingProposalForListing).toEqual({ id: 'prop-123' });
  });
});

describe('PROPOSAL_SUBMIT_ERROR', () => {
  it('clears isSubmittingProposal', () => {
    const prev = makeState({ isSubmittingProposal: true });
    const next = viewSplitLeaseReducer(prev, { type: 'PROPOSAL_SUBMIT_ERROR' });

    expect(next.isSubmittingProposal).toBe(false);
  });
});

describe('SET_PENDING_PROPOSAL', () => {
  it('sets pendingProposalData', () => {
    const prev = makeState({ pendingProposalData: null });
    const data = { days: [1, 3], moveIn: '2026-04-01' };
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_PENDING_PROPOSAL',
      payload: data,
    });

    expect(next.pendingProposalData).toBe(data);
  });

  it('clears pendingProposalData with null', () => {
    const prev = makeState({ pendingProposalData: { days: [1] } });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_PENDING_PROPOSAL',
      payload: null,
    });

    expect(next.pendingProposalData).toBeNull();
  });
});

// =============================================================================
// User Data actions
// =============================================================================

describe('SET_USER_DATA', () => {
  it('updates all three user fields', () => {
    const prev = makeState({
      loggedInUserData: null,
      existingProposalForListing: null,
      isFavorited: false,
    });

    const userData = { userId: 'u-1', aboutMe: 'Hello' };
    const proposal = { id: 'prop-1' };

    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_USER_DATA',
      payload: {
        loggedInUserData: userData,
        existingProposal: proposal,
        isFavorited: true,
      },
    });

    expect(next.loggedInUserData).toBe(userData);
    expect(next.existingProposalForListing).toBe(proposal);
    expect(next.isFavorited).toBe(true);
  });
});

describe('CLEAR_USER_DATA', () => {
  it('resets all user fields', () => {
    const prev = makeState({
      loggedInUserData: { userId: 'u-1' },
      existingProposalForListing: { id: 'prop-1' },
      isFavorited: true,
    });

    const next = viewSplitLeaseReducer(prev, { type: 'CLEAR_USER_DATA' });

    expect(next.loggedInUserData).toBeNull();
    expect(next.existingProposalForListing).toBeNull();
    expect(next.isFavorited).toBe(false);
  });
});

describe('TOGGLE_FAVORITE', () => {
  it('sets isFavorited to true', () => {
    const prev = makeState({ isFavorited: false });
    const next = viewSplitLeaseReducer(prev, {
      type: 'TOGGLE_FAVORITE',
      payload: true,
    });

    expect(next.isFavorited).toBe(true);
  });

  it('sets isFavorited to false', () => {
    const prev = makeState({ isFavorited: true });
    const next = viewSplitLeaseReducer(prev, {
      type: 'TOGGLE_FAVORITE',
      payload: false,
    });

    expect(next.isFavorited).toBe(false);
  });
});

describe('SET_EXISTING_PROPOSAL', () => {
  it('sets existingProposalForListing', () => {
    const prev = makeState({ existingProposalForListing: null });
    const proposal = { id: 'prop-99' };
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_EXISTING_PROPOSAL',
      payload: proposal,
    });

    expect(next.existingProposalForListing).toBe(proposal);
  });
});

// =============================================================================
// UI actions
// =============================================================================

describe('SET_MOBILE', () => {
  it('sets isMobile', () => {
    const prev = makeState({ isMobile: false });
    const next = viewSplitLeaseReducer(prev, {
      type: 'SET_MOBILE',
      payload: true,
    });

    expect(next.isMobile).toBe(true);
  });
});

describe('SET_SHOULD_LOAD_MAP', () => {
  it('sets shouldLoadMap to true', () => {
    const prev = makeState({ shouldLoadMap: false });
    const next = viewSplitLeaseReducer(prev, { type: 'SET_SHOULD_LOAD_MAP' });

    expect(next.shouldLoadMap).toBe(true);
  });
});

// =============================================================================
// Unknown action
// =============================================================================

describe('unknown action', () => {
  it('returns same state reference (no unnecessary re-renders)', () => {
    const prev = makeState();
    // Cast to bypass TypeScript's exhaustiveness check
    const next = viewSplitLeaseReducer(prev, { type: 'NONEXISTENT' } as unknown as ViewSplitLeaseAction);

    expect(next).toBe(prev);
  });
});
