/**
 * React hook for using the rental application local store
 *
 * Provides reactive access to the store with automatic re-renders on state changes.
 * Follows the useListingStore pattern from SelfListingPage.
 *
 * IMPORTANT: userId is required to prevent data leaks between users.
 * The store uses user-scoped localStorage keys (rentalApplicationDraft_{userId}).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  rentalApplicationLocalStore,
  type RentalApplicationStoreState,
  type RentalApplicationFormData,
  type Occupant,
  type VerificationStatus,
} from './rentalApplicationLocalStore';

interface UseRentalApplicationStoreProps {
  userId: string;
}

interface UseRentalApplicationStoreReturn {
  // State
  formData: RentalApplicationFormData;
  occupants: Occupant[];
  verificationStatus: VerificationStatus;
  lastSaved: Date | null;
  isDirty: boolean;

  // Form data update functions
  updateFormData: (data: Partial<RentalApplicationFormData>) => void;
  updateField: (fieldName: keyof RentalApplicationFormData, value: string | boolean) => void;

  // Occupant management
  setOccupants: (occupants: Occupant[]) => void;
  addOccupant: (occupant: Occupant) => void;
  removeOccupant: (occupantId: string) => void;
  updateOccupant: (occupantId: string, field: keyof Occupant, value: string) => void;

  // Verification status
  updateVerificationStatus: (service: keyof VerificationStatus, status: boolean) => void;

  // Persistence
  saveDraft: () => boolean;
  reset: () => void;
  loadFromDatabase: (
    formData: Partial<RentalApplicationFormData>,
    occupants?: Occupant[],
    verificationStatus?: Partial<VerificationStatus>
  ) => void;

  // Utilities
  getDebugSummary: () => object;
}

/**
 * Hook for accessing and updating the rental application local store
 * @param userId - Required user ID to scope localStorage keys (prevents data leaks between users)
 */
export function useRentalApplicationStore({ userId }: UseRentalApplicationStoreProps): UseRentalApplicationStoreReturn {
  const [state, setState] = useState<RentalApplicationStoreState>(() => rentalApplicationLocalStore.getState());
  const previousUserIdRef = useRef<string | null>(null);

  // Subscribe to store updates and initialize with userId
  useEffect(() => {
    if (!userId) {
      console.warn('[useRentalApplicationStore] No userId provided - store will not load localStorage data');
      return;
    }

    // Initialize the store with userId (loads from user-scoped localStorage)
    const initialState = rentalApplicationLocalStore.initialize(userId);
    setState(initialState);
    previousUserIdRef.current = userId;

    // Subscribe to future updates
    const unsubscribe = rentalApplicationLocalStore.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [userId]);

  // Memoized update functions
  const updateFormData = useCallback((data: Partial<RentalApplicationFormData>) => {
    rentalApplicationLocalStore.updateFormData(data);
  }, []);

  const updateField = useCallback((fieldName: keyof RentalApplicationFormData, value: string | boolean) => {
    rentalApplicationLocalStore.updateField(fieldName, value);
  }, []);

  const setOccupants = useCallback((occupants: Occupant[]) => {
    rentalApplicationLocalStore.setOccupants(occupants);
  }, []);

  const addOccupant = useCallback((occupant: Occupant) => {
    rentalApplicationLocalStore.addOccupant(occupant);
  }, []);

  const removeOccupant = useCallback((occupantId: string) => {
    rentalApplicationLocalStore.removeOccupant(occupantId);
  }, []);

  const updateOccupant = useCallback((occupantId: string, field: keyof Occupant, value: string) => {
    rentalApplicationLocalStore.updateOccupant(occupantId, field, value);
  }, []);

  const updateVerificationStatus = useCallback((service: keyof VerificationStatus, status: boolean) => {
    rentalApplicationLocalStore.updateVerificationStatus(service, status);
  }, []);

  const saveDraft = useCallback(() => {
    return rentalApplicationLocalStore.saveDraft();
  }, []);

  const reset = useCallback(() => {
    rentalApplicationLocalStore.reset();
  }, []);

  const loadFromDatabase = useCallback((
    formData: Partial<RentalApplicationFormData>,
    occupants?: Occupant[],
    verificationStatus?: Partial<VerificationStatus>
  ) => {
    rentalApplicationLocalStore.loadFromDatabase(formData, occupants, verificationStatus);
  }, []);

  const getDebugSummary = useCallback(() => {
    return rentalApplicationLocalStore.getDebugSummary();
  }, []);

  return {
    // State
    formData: state.formData,
    occupants: state.occupants,
    verificationStatus: state.verificationStatus,
    lastSaved: state.lastSaved,
    isDirty: state.isDirty,

    // Form data update functions
    updateFormData,
    updateField,

    // Occupant management
    setOccupants,
    addOccupant,
    removeOccupant,
    updateOccupant,

    // Verification status
    updateVerificationStatus,

    // Persistence
    saveDraft,
    reset,
    loadFromDatabase,

    // Utilities
    getDebugSummary,
  };
}
