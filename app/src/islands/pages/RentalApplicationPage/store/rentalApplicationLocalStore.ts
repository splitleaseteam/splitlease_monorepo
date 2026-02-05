/**
 * Rental Application Local Memory Store
 *
 * Stores all user form data locally before submitting via Edge Functions.
 * Follows the SelfListingPage store pattern with:
 * - Persistent draft storage across sessions via localStorage
 * - Debounced auto-save (1 second delay)
 * - Pub/Sub pattern for React integration
 * - Data validation before submission
 */

// Storage key prefix - actual keys are user-scoped: rentalApplicationDraft_{userId}
const STORAGE_KEY_PREFIX = {
  DRAFT: 'rentalApplicationDraft',
  LAST_SAVED: 'rentalApplicationLastSaved',
} as const;

/**
 * Get user-scoped storage keys
 * This prevents data leaks between users on the same browser
 */
function getStorageKeys(userId: string) {
  return {
    DRAFT: `${STORAGE_KEY_PREFIX.DRAFT}_${userId}`,
    LAST_SAVED: `${STORAGE_KEY_PREFIX.LAST_SAVED}_${userId}`,
  };
}

// Occupant type
export interface Occupant {
  id: string;
  name: string;
  relationship: string;
}

// Verification status type
export interface VerificationStatus {
  linkedin: boolean;
  facebook: boolean;
  id: boolean;
  income: boolean;
}

// Form data interface matching existing useRentalApplicationPageLogic structure
export interface RentalApplicationFormData {
  // Personal Information
  fullName: string;
  dob: string;
  email: string;
  phone: string;
  // Current Address
  currentAddress: string;
  apartmentUnit: string;
  lengthResided: string;
  renting: string;
  // Employment Information
  employmentStatus: string;
  // Employed fields
  employerName: string;
  employerPhone: string;
  jobTitle: string;
  monthlyIncome: string;
  // Self-employed fields
  businessName: string;
  businessYear: string;
  businessState: string;
  monthlyIncomeSelf: string;
  companyStake: string;
  slForBusiness: string;
  taxForms: string;
  // Unemployed/Student fields
  alternateIncome: string;
  // Special requirements (dropdowns: yes/no/empty)
  hasPets: string;
  isSmoker: string;
  needsParking: string;
  // References
  references: string;
  showVisualReferences: boolean;
  showCreditScore: boolean;
  // Signature
  signature: string;
  // File URLs (uploaded to Supabase Storage)
  proofOfEmploymentUrl: string;
  alternateGuaranteeUrl: string;
  creditScoreUrl: string;
  stateIdFrontUrl: string;
  stateIdBackUrl: string;
  governmentIdUrl: string;
}

// Store state type
export interface StoreState {
  formData: RentalApplicationFormData;
  occupants: Occupant[];
  verificationStatus: VerificationStatus;
  lastSaved: Date | null;
  isDirty: boolean;
}

// Default form data
const DEFAULT_FORM_DATA: RentalApplicationFormData = {
  // Personal Information
  fullName: '',
  dob: '',
  email: '',
  phone: '',
  // Current Address
  currentAddress: '',
  apartmentUnit: '',
  lengthResided: '',
  renting: '',
  // Employment Information
  employmentStatus: '',
  // Employed fields
  employerName: '',
  employerPhone: '',
  jobTitle: '',
  monthlyIncome: '',
  // Self-employed fields
  businessName: '',
  businessYear: '',
  businessState: '',
  monthlyIncomeSelf: '',
  companyStake: '',
  slForBusiness: '',
  taxForms: '',
  // Unemployed/Student fields
  alternateIncome: '',
  // Special requirements
  hasPets: '',
  isSmoker: '',
  needsParking: '',
  // References
  references: '',
  showVisualReferences: false,
  showCreditScore: false,
  // Signature
  signature: '',
  // File URLs
  proofOfEmploymentUrl: '',
  alternateGuaranteeUrl: '',
  creditScoreUrl: '',
  stateIdFrontUrl: '',
  stateIdBackUrl: '',
  governmentIdUrl: '',
};

const DEFAULT_VERIFICATION_STATUS: VerificationStatus = {
  linkedin: false,
  facebook: false,
  id: false,
  income: false,
};

/**
 * Local memory store for rental application form data
 */
class RentalApplicationLocalStore {
  private state: StoreState;
  private listeners: Set<(state: StoreState) => void>;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null;
  private readonly AUTO_SAVE_DELAY = 1000; // 1 second debounce
  private currentUserId: string | null = null;

  constructor() {
    this.state = {
      formData: { ...DEFAULT_FORM_DATA },
      occupants: [],
      verificationStatus: { ...DEFAULT_VERIFICATION_STATUS },
      lastSaved: null,
      isDirty: false,
    };
    this.listeners = new Set();
    this.autoSaveTimer = null;
  }

  /**
   * Initialize the store - load from localStorage if available
   * @param userId - Required user ID to scope localStorage keys (prevents data leaks between users)
   */
  initialize(userId: string): StoreState {
    // If userId changes, reset the store to prevent cross-user data contamination
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log(`[RentalAppStore] User changed from ${this.currentUserId} to ${userId}, resetting store`);
      this.resetInternal();
    }

    this.currentUserId = userId;

    if (!userId) {
      console.warn('[RentalAppStore] No userId provided, returning empty state');
      this.notifyListeners();
      return this.state;
    }

    try {
      const storageKeys = getStorageKeys(userId);
      const savedDraft = localStorage.getItem(storageKeys.DRAFT);
      const lastSaved = localStorage.getItem(storageKeys.LAST_SAVED);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        // Validate that the draft belongs to this user (defense in depth)
        if (parsed.userId && parsed.userId !== userId) {
          console.warn('[RentalAppStore] Draft userId mismatch, ignoring stale data');
          localStorage.removeItem(storageKeys.DRAFT);
          localStorage.removeItem(storageKeys.LAST_SAVED);
          this.notifyListeners();
          return this.state;
        }

        // Restore form data
        if (parsed.formData) {
          this.state.formData = { ...DEFAULT_FORM_DATA, ...parsed.formData };
        }

        // Restore occupants
        if (parsed.occupants) {
          this.state.occupants = parsed.occupants;
        }

        // Restore verification status
        if (parsed.verificationStatus) {
          this.state.verificationStatus = { ...DEFAULT_VERIFICATION_STATUS, ...parsed.verificationStatus };
        }

        this.state.lastSaved = lastSaved ? new Date(lastSaved) : null;
        console.log(`[RentalAppStore] Loaded draft from localStorage for user ${userId}`);
      }

      this.notifyListeners();
      return this.state;
    } catch (error) {
      console.error('[RentalAppStore] Error initializing store:', error);
      return this.state;
    }
  }

  /**
   * Get current state
   */
  getState(): StoreState {
    return { ...this.state };
  }

  /**
   * Get form data
   */
  getFormData(): RentalApplicationFormData {
    return { ...this.state.formData };
  }

  /**
   * Get occupants
   */
  getOccupants(): Occupant[] {
    return [...this.state.occupants];
  }

  /**
   * Get verification status
   */
  getVerificationStatus(): VerificationStatus {
    return { ...this.state.verificationStatus };
  }

  /**
   * Update form data with partial data
   */
  updateFormData(partialData: Partial<RentalApplicationFormData>): void {
    this.state.formData = {
      ...this.state.formData,
      ...partialData,
    };
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Update a single form field
   */
  updateField(fieldName: keyof RentalApplicationFormData, value: string | boolean): void {
    (this.state.formData as unknown as Record<string, string | boolean>)[fieldName] = value;
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Set occupants list
   */
  setOccupants(occupants: Occupant[]): void {
    this.state.occupants = [...occupants];
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Add an occupant
   */
  addOccupant(occupant: Occupant): void {
    this.state.occupants = [...this.state.occupants, occupant];
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Remove an occupant by ID
   */
  removeOccupant(occupantId: string): void {
    this.state.occupants = this.state.occupants.filter(occ => occ.id !== occupantId);
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Update an occupant
   */
  updateOccupant(occupantId: string, field: keyof Occupant, value: string): void {
    this.state.occupants = this.state.occupants.map(occ =>
      occ.id === occupantId ? { ...occ, [field]: value } : occ
    );
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Update verification status
   */
  updateVerificationStatus(service: keyof VerificationStatus, status: boolean): void {
    this.state.verificationStatus = {
      ...this.state.verificationStatus,
      [service]: status,
    };
    this.state.isDirty = true;
    this.scheduleAutoSave();
    this.notifyListeners();
  }

  /**
   * Schedule auto-save with debounce
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.saveDraft();
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Manually save draft to localStorage
   * Requires initialize() to have been called with a userId first
   */
  saveDraft(): boolean {
    if (!this.currentUserId) {
      console.warn('[RentalAppStore] Cannot save draft: no userId set. Call initialize(userId) first.');
      return false;
    }

    try {
      const storageKeys = getStorageKeys(this.currentUserId);
      const dataToSave = {
        userId: this.currentUserId, // Store userId for validation on load
        formData: this.state.formData,
        occupants: this.state.occupants,
        verificationStatus: this.state.verificationStatus,
      };

      localStorage.setItem(storageKeys.DRAFT, JSON.stringify(dataToSave));
      localStorage.setItem(storageKeys.LAST_SAVED, new Date().toISOString());

      this.state.lastSaved = new Date();
      this.state.isDirty = false;
      console.log(`[RentalAppStore] Draft saved to localStorage for user ${this.currentUserId}`);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[RentalAppStore] Error saving draft:', error);
      // Log but don't fail - localStorage quota exceeded is non-fatal
      return false;
    }
  }

  /**
   * Internal reset - resets state without clearing localStorage
   * Used when user changes to prevent loading stale data
   */
  private resetInternal(): void {
    this.state = {
      formData: { ...DEFAULT_FORM_DATA },
      occupants: [],
      verificationStatus: { ...DEFAULT_VERIFICATION_STATUS },
      lastSaved: null,
      isDirty: false,
    };
  }

  /**
   * Reset store to default state and clear localStorage for current user
   */
  reset(): void {
    this.resetInternal();

    // Clear localStorage for current user if userId is set
    if (this.currentUserId) {
      const storageKeys = getStorageKeys(this.currentUserId);
      localStorage.removeItem(storageKeys.DRAFT);
      localStorage.removeItem(storageKeys.LAST_SAVED);
      console.log(`[RentalAppStore] Store reset and localStorage cleared for user ${this.currentUserId}`);
    } else {
      console.log('[RentalAppStore] Store reset to default state (no userId to clear localStorage)');
    }

    this.notifyListeners();
  }

  /**
   * Load data from database (for returning users with submitted applications)
   * This overwrites current store state and marks as not dirty.
   * Does NOT save to localStorage - database is the source of truth for submitted apps.
   */
  loadFromDatabase(
    formData: Partial<RentalApplicationFormData>,
    occupants?: Occupant[],
    verificationStatus?: Partial<VerificationStatus>
  ): void {
    this.state.formData = { ...DEFAULT_FORM_DATA, ...formData };

    if (occupants) {
      this.state.occupants = occupants;
    }

    if (verificationStatus) {
      this.state.verificationStatus = { ...DEFAULT_VERIFICATION_STATUS, ...verificationStatus };
    }

    // Mark as not dirty - data came from database, not user input
    this.state.isDirty = false;
    this.state.lastSaved = null; // No local save - data from DB

    console.log('[RentalAppStore] Loaded data from database');
    this.notifyListeners();
  }

  /**
   * Subscribe to store updates
   */
  subscribe(listener: (state: StoreState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.getState());
    });
  }

  /**
   * Get summary of stored data for debugging
   */
  getDebugSummary(): object {
    return {
      hasData: !!this.state.formData.fullName,
      fullName: this.state.formData.fullName || '(empty)',
      email: this.state.formData.email || '(empty)',
      employmentStatus: this.state.formData.employmentStatus || '(empty)',
      occupantsCount: this.state.occupants.length,
      hasSignature: !!this.state.formData.signature,
      verificationStatus: this.state.verificationStatus,
      lastSaved: this.state.lastSaved?.toISOString() || 'never',
      isDirty: this.state.isDirty,
    };
  }
}

// Create singleton instance
export const rentalApplicationLocalStore = new RentalApplicationLocalStore();
