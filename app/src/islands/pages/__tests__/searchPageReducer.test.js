import { describe, it, expect } from 'vitest';
import { searchPageReducer, initialState } from '../searchPageReducer.js';

describe('searchPageReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.isLoading).toBe(true);
      expect(initialState.error).toBeNull();
      expect(initialState.allActiveListings).toEqual([]);
      expect(initialState.allListings).toEqual([]);
      expect(initialState.displayedListings).toEqual([]);
      expect(initialState.loadedCount).toBe(0);
      expect(initialState.fallbackListings).toEqual([]);
      expect(initialState.fallbackDisplayedListings).toEqual([]);
      expect(initialState.fallbackLoadedCount).toBe(0);
      expect(initialState.isFallbackLoading).toBe(false);
      expect(initialState.fallbackFetchFailed).toBe(false);
      expect(initialState.informationalTexts).toEqual({});
      expect(initialState.boroughs).toEqual([]);
      expect(initialState.neighborhoods).toEqual([]);
      expect(initialState.selectedBoroughs).toEqual([]);
      expect(initialState.selectedNeighborhoods).toEqual([]);
      expect(initialState.weekPattern).toBe('every-week');
      expect(initialState.priceTier).toBe('all');
      expect(initialState.sortBy).toBe('recommended');
      expect(initialState.neighborhoodSearch).toBe('');
      expect(initialState.filterPanelActive).toBe(false);
      expect(initialState.menuOpen).toBe(false);
      expect(initialState.mobileMapVisible).toBe(false);
      expect(initialState.isDetailDrawerOpen).toBe(false);
      expect(initialState.detailDrawerListing).toBeNull();
    });
  });

  // ========================================
  // LOADING & ERROR
  // ========================================
  describe('Loading & Error actions', () => {
    it('SET_IS_LOADING sets isLoading', () => {
      const next = searchPageReducer(initialState, { type: 'SET_IS_LOADING', payload: false });
      expect(next.isLoading).toBe(false);
    });

    it('SET_ERROR sets error', () => {
      const next = searchPageReducer(initialState, { type: 'SET_ERROR', payload: 'Network error' });
      expect(next.error).toBe('Network error');
    });

    it('SET_ERROR can clear error with null', () => {
      const state = { ...initialState, error: 'old error' };
      const next = searchPageReducer(state, { type: 'SET_ERROR', payload: null });
      expect(next.error).toBeNull();
    });
  });

  // ========================================
  // LISTINGS
  // ========================================
  describe('Listings actions', () => {
    it('SET_ALL_ACTIVE_LISTINGS sets allActiveListings', () => {
      const listings = [{ id: 'l1' }, { id: 'l2' }];
      const next = searchPageReducer(initialState, { type: 'SET_ALL_ACTIVE_LISTINGS', payload: listings });
      expect(next.allActiveListings).toBe(listings);
      expect(next.allActiveListings.length).toBe(2);
    });

    it('SET_ALL_LISTINGS sets allListings', () => {
      const listings = [{ id: 'l1' }];
      const next = searchPageReducer(initialState, { type: 'SET_ALL_LISTINGS', payload: listings });
      expect(next.allListings).toBe(listings);
    });

    it('SET_DISPLAYED_LISTINGS sets displayedListings', () => {
      const listings = [{ id: 'l1' }];
      const next = searchPageReducer(initialState, { type: 'SET_DISPLAYED_LISTINGS', payload: listings });
      expect(next.displayedListings).toBe(listings);
    });

    it('SET_LOADED_COUNT sets loadedCount', () => {
      const next = searchPageReducer(initialState, { type: 'SET_LOADED_COUNT', payload: 10 });
      expect(next.loadedCount).toBe(10);
    });

    it('SET_LISTINGS_AND_RESET_COUNT sets allListings and resets loadedCount to 0', () => {
      const state = { ...initialState, loadedCount: 20 };
      const listings = [{ id: 'l1' }, { id: 'l2' }];
      const next = searchPageReducer(state, { type: 'SET_LISTINGS_AND_RESET_COUNT', payload: listings });
      expect(next.allListings).toBe(listings);
      expect(next.loadedCount).toBe(0);
    });
  });

  // ========================================
  // FALLBACK LISTINGS
  // ========================================
  describe('Fallback listings actions', () => {
    it('SET_FALLBACK_LISTINGS sets fallbackListings', () => {
      const listings = [{ id: 'f1' }];
      const next = searchPageReducer(initialState, { type: 'SET_FALLBACK_LISTINGS', payload: listings });
      expect(next.fallbackListings).toBe(listings);
    });

    it('SET_FALLBACK_DISPLAYED_LISTINGS sets fallbackDisplayedListings', () => {
      const listings = [{ id: 'f1' }];
      const next = searchPageReducer(initialState, { type: 'SET_FALLBACK_DISPLAYED_LISTINGS', payload: listings });
      expect(next.fallbackDisplayedListings).toBe(listings);
    });

    it('SET_FALLBACK_LOADED_COUNT sets fallbackLoadedCount', () => {
      const next = searchPageReducer(initialState, { type: 'SET_FALLBACK_LOADED_COUNT', payload: 5 });
      expect(next.fallbackLoadedCount).toBe(5);
    });

    it('SET_IS_FALLBACK_LOADING sets isFallbackLoading', () => {
      const next = searchPageReducer(initialState, { type: 'SET_IS_FALLBACK_LOADING', payload: true });
      expect(next.isFallbackLoading).toBe(true);
    });

    it('SET_FALLBACK_FETCH_FAILED sets fallbackFetchFailed', () => {
      const next = searchPageReducer(initialState, { type: 'SET_FALLBACK_FETCH_FAILED', payload: true });
      expect(next.fallbackFetchFailed).toBe(true);
    });

    it('CLEAR_FALLBACK resets all fallback state', () => {
      const state = {
        ...initialState,
        fallbackListings: [{ id: 'f1' }],
        fallbackDisplayedListings: [{ id: 'f1' }],
        fallbackLoadedCount: 5,
      };
      const next = searchPageReducer(state, { type: 'CLEAR_FALLBACK' });
      expect(next.fallbackListings).toEqual([]);
      expect(next.fallbackDisplayedListings).toEqual([]);
      expect(next.fallbackLoadedCount).toBe(0);
    });

    it('SET_FALLBACK_LISTINGS_AND_RESET_COUNT sets listings and resets count', () => {
      const state = { ...initialState, fallbackLoadedCount: 10 };
      const listings = [{ id: 'f1' }, { id: 'f2' }];
      const next = searchPageReducer(state, { type: 'SET_FALLBACK_LISTINGS_AND_RESET_COUNT', payload: listings });
      expect(next.fallbackListings).toBe(listings);
      expect(next.fallbackLoadedCount).toBe(0);
    });

    it('FALLBACK_FETCH_ERROR clears fallback listings and sets failed flag', () => {
      const state = { ...initialState, fallbackListings: [{ id: 'f1' }] };
      const next = searchPageReducer(state, { type: 'FALLBACK_FETCH_ERROR' });
      expect(next.fallbackListings).toEqual([]);
      expect(next.fallbackFetchFailed).toBe(true);
    });
  });

  // ========================================
  // INFORMATIONAL TEXTS
  // ========================================
  describe('Informational texts actions', () => {
    it('SET_INFORMATIONAL_TEXTS sets informationalTexts', () => {
      const texts = { 'Price Starts': { desktop: 'info' } };
      const next = searchPageReducer(initialState, { type: 'SET_INFORMATIONAL_TEXTS', payload: texts });
      expect(next.informationalTexts).toBe(texts);
    });
  });

  // ========================================
  // GEOGRAPHY
  // ========================================
  describe('Geography actions', () => {
    it('SET_BOROUGHS sets boroughs', () => {
      const boroughs = [{ id: 'b1', name: 'Manhattan' }];
      const next = searchPageReducer(initialState, { type: 'SET_BOROUGHS', payload: boroughs });
      expect(next.boroughs).toBe(boroughs);
    });

    it('SET_NEIGHBORHOODS sets neighborhoods', () => {
      const neighborhoods = [{ id: 'n1', name: 'SoHo' }];
      const next = searchPageReducer(initialState, { type: 'SET_NEIGHBORHOODS', payload: neighborhoods });
      expect(next.neighborhoods).toBe(neighborhoods);
    });
  });

  // ========================================
  // FILTERS
  // ========================================
  describe('Filter actions', () => {
    it('SET_SELECTED_BOROUGHS sets selectedBoroughs', () => {
      const next = searchPageReducer(initialState, { type: 'SET_SELECTED_BOROUGHS', payload: ['manhattan', 'brooklyn'] });
      expect(next.selectedBoroughs).toEqual(['manhattan', 'brooklyn']);
    });

    it('SET_SELECTED_NEIGHBORHOODS sets selectedNeighborhoods', () => {
      const next = searchPageReducer(initialState, { type: 'SET_SELECTED_NEIGHBORHOODS', payload: ['n1', 'n2'] });
      expect(next.selectedNeighborhoods).toEqual(['n1', 'n2']);
    });

    it('SET_WEEK_PATTERN sets weekPattern', () => {
      const next = searchPageReducer(initialState, { type: 'SET_WEEK_PATTERN', payload: 'weekdays' });
      expect(next.weekPattern).toBe('weekdays');
    });

    it('SET_PRICE_TIER sets priceTier', () => {
      const next = searchPageReducer(initialState, { type: 'SET_PRICE_TIER', payload: 'budget' });
      expect(next.priceTier).toBe('budget');
    });

    it('SET_SORT_BY sets sortBy', () => {
      const next = searchPageReducer(initialState, { type: 'SET_SORT_BY', payload: 'price-low' });
      expect(next.sortBy).toBe('price-low');
    });

    it('SET_NEIGHBORHOOD_SEARCH sets neighborhoodSearch', () => {
      const next = searchPageReducer(initialState, { type: 'SET_NEIGHBORHOOD_SEARCH', payload: 'soho' });
      expect(next.neighborhoodSearch).toBe('soho');
    });

    it('RESET_FILTERS resets all filter values to defaults', () => {
      const state = {
        ...initialState,
        selectedBoroughs: ['manhattan'],
        selectedNeighborhoods: ['n1'],
        weekPattern: 'weekdays',
        priceTier: 'budget',
        sortBy: 'price-low',
        neighborhoodSearch: 'soho',
      };
      const next = searchPageReducer(state, { type: 'RESET_FILTERS' });
      expect(next.selectedBoroughs).toEqual([]);
      expect(next.selectedNeighborhoods).toEqual([]);
      expect(next.weekPattern).toBe('every-week');
      expect(next.priceTier).toBe('all');
      expect(next.sortBy).toBe('recommended');
      expect(next.neighborhoodSearch).toBe('');
    });

    it('RESET_FILTERS preserves non-filter state', () => {
      const state = {
        ...initialState,
        isLoading: false,
        boroughs: [{ id: 'b1' }],
        allListings: [{ id: 'l1' }],
        selectedBoroughs: ['manhattan'],
      };
      const next = searchPageReducer(state, { type: 'RESET_FILTERS' });
      expect(next.isLoading).toBe(false);
      expect(next.boroughs).toEqual([{ id: 'b1' }]);
      expect(next.allListings).toEqual([{ id: 'l1' }]);
    });

    it('SET_ALL_FILTERS sets all filter values at once', () => {
      const next = searchPageReducer(initialState, {
        type: 'SET_ALL_FILTERS',
        payload: {
          selectedBoroughs: ['brooklyn'],
          weekPattern: 'weekends',
          priceTier: 'luxury',
          sortBy: 'recent',
          selectedNeighborhoods: ['n3'],
        },
      });
      expect(next.selectedBoroughs).toEqual(['brooklyn']);
      expect(next.weekPattern).toBe('weekends');
      expect(next.priceTier).toBe('luxury');
      expect(next.sortBy).toBe('recent');
      expect(next.selectedNeighborhoods).toEqual(['n3']);
    });
  });

  // ========================================
  // UI
  // ========================================
  describe('UI actions', () => {
    it('SET_FILTER_PANEL_ACTIVE sets filterPanelActive', () => {
      const next = searchPageReducer(initialState, { type: 'SET_FILTER_PANEL_ACTIVE', payload: true });
      expect(next.filterPanelActive).toBe(true);
    });

    it('SET_MENU_OPEN sets menuOpen', () => {
      const next = searchPageReducer(initialState, { type: 'SET_MENU_OPEN', payload: true });
      expect(next.menuOpen).toBe(true);
    });

    it('SET_MOBILE_MAP_VISIBLE sets mobileMapVisible', () => {
      const next = searchPageReducer(initialState, { type: 'SET_MOBILE_MAP_VISIBLE', payload: true });
      expect(next.mobileMapVisible).toBe(true);
    });
  });

  // ========================================
  // DETAIL DRAWER
  // ========================================
  describe('Detail drawer actions', () => {
    it('OPEN_DETAIL_DRAWER sets listing and opens drawer', () => {
      const listing = { id: 'l1', title: 'Test Listing' };
      const next = searchPageReducer(initialState, { type: 'OPEN_DETAIL_DRAWER', payload: listing });
      expect(next.detailDrawerListing).toBe(listing);
      expect(next.isDetailDrawerOpen).toBe(true);
    });

    it('CLOSE_DETAIL_DRAWER closes drawer without clearing listing', () => {
      const state = {
        ...initialState,
        isDetailDrawerOpen: true,
        detailDrawerListing: { id: 'l1' },
      };
      const next = searchPageReducer(state, { type: 'CLOSE_DETAIL_DRAWER' });
      expect(next.isDetailDrawerOpen).toBe(false);
      expect(next.detailDrawerListing).toEqual({ id: 'l1' });
    });

    it('CLEAR_DETAIL_DRAWER_LISTING clears the listing', () => {
      const state = { ...initialState, detailDrawerListing: { id: 'l1' } };
      const next = searchPageReducer(state, { type: 'CLEAR_DETAIL_DRAWER_LISTING' });
      expect(next.detailDrawerListing).toBeNull();
    });
  });

  // ========================================
  // LOAD MORE
  // ========================================
  describe('Load more actions', () => {
    it('LOAD_MORE_LISTINGS sets displayedListings and loadedCount', () => {
      const listings = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];
      const next = searchPageReducer(initialState, {
        type: 'LOAD_MORE_LISTINGS',
        payload: { nextCount: 3, listings },
      });
      expect(next.displayedListings).toBe(listings);
      expect(next.loadedCount).toBe(3);
    });

    it('LOAD_MORE_FALLBACK sets fallbackDisplayedListings and fallbackLoadedCount', () => {
      const listings = [{ id: 'f1' }, { id: 'f2' }];
      const next = searchPageReducer(initialState, {
        type: 'LOAD_MORE_FALLBACK',
        payload: { nextCount: 2, listings },
      });
      expect(next.fallbackDisplayedListings).toBe(listings);
      expect(next.fallbackLoadedCount).toBe(2);
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = searchPageReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
