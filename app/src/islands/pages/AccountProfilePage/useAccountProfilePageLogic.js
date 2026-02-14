/**
 * useAccountProfilePageLogic - Logic Hook for AccountProfilePage
 *
 * Orchestrates all business logic for the Account Profile page.
 * Supports two views:
 * - Editor View: User viewing/editing their own profile
 * - Public View: User viewing someone else's profile (read-only)
 *
 * ARCHITECTURE: Hollow Component Pattern
 * - Manages all React state (useReducer, useEffect, useCallback, useMemo)
 * - Component using this hook is "hollow" (presentation only)
 *
 * STATE MANAGEMENT:
 * - Non-modal state: useReducer (accountProfileReducer)
 * - Modal state: useModalManager (profileModals) — unchanged from Phase 3
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useModalManager } from '../../../hooks/useModalManager.js';
import { supabase } from '../../../lib/supabase.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { checkUrlForAuthError, clearAuthErrorFromUrl } from '../../../lib/auth/index.js';
import { isHost } from '../../../logic/rules/users/isHost.js';
import { submitIdentityVerification } from '../../../lib/api/identityVerificationService.js';
import { accountProfileReducer, initialState } from './accountProfileReducer.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Profile strength calculation weights
 * Base criteria: 90% (available to all users)
 * Role-specific milestone: 25% (rental app for guests, first listing for hosts)
 * Max theoretical = 115%, capped at 100%
 */
const PROFILE_STRENGTH_WEIGHTS = {
  // Base criteria (90% total)
  profilePhoto: 15,
  bio: 10,
  firstName: 5,
  lastName: 5,
  jobTitle: 5,
  emailVerified: 8,
  phoneVerified: 8,
  govIdVerified: 12,
  linkedinVerified: 7,
  goodGuestReasons: 5,   // At least 1 "Reasons to Host Me" selected
  storageItems: 5,       // At least 1 "Common Stored Items" selected
  transportationTypes: 5, // At least 1 transportation method selected
  // Role-specific milestones (25% each - user gets one based on their role)
  rentalAppSubmitted: 25,  // Guest milestone
  firstListingCreated: 25  // Host milestone
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract user ID from URL path
 * Expected format: /account-profile/:userId
 */
function getUserIdFromUrl() {
  const pathname = window.location.pathname;
  const match = pathname.match(/\/account-profile\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Calculate profile strength percentage
 * Includes base criteria (75%) + role-specific milestone (25%)
 *
 * @param {Object} profileData - Basic profile info (photo, bio, names, etc.)
 * @param {Object} verifications - Verification flags (email, phone, govId, linkedin)
 * @param {Object} milestones - Role-specific milestones { rentalAppSubmitted, firstListingCreated, isHost }
 */
function calculateProfileStrength(profileData, verifications, milestones = {}) {
  let strength = 0;

  // Base criteria (85% total)
  if (profileData?.profilePhoto) {
    strength += PROFILE_STRENGTH_WEIGHTS.profilePhoto;
  }
  if (profileData?.bio && profileData.bio.trim().length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.bio;
  }
  if (profileData?.firstName && profileData.firstName.trim().length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.firstName;
  }
  if (profileData?.lastName && profileData.lastName.trim().length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.lastName;
  }
  if (profileData?.jobTitle && profileData.jobTitle.trim().length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.jobTitle;
  }
  if (verifications?.email) {
    strength += PROFILE_STRENGTH_WEIGHTS.emailVerified;
  }
  if (verifications?.phone) {
    strength += PROFILE_STRENGTH_WEIGHTS.phoneVerified;
  }
  if (verifications?.govId) {
    strength += PROFILE_STRENGTH_WEIGHTS.govIdVerified;
  }
  if (verifications?.linkedin) {
    strength += PROFILE_STRENGTH_WEIGHTS.linkedinVerified;
  }
  // Good Guest Reasons (at least 1 selected = 5%)
  if (profileData?.goodGuestReasons && profileData.goodGuestReasons.length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.goodGuestReasons;
  }
  // Common Stored Items (at least 1 selected = 5%)
  if (profileData?.storageItems && profileData.storageItems.length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.storageItems;
  }
  // Transportation Types (at least 1 selected = 5%)
  if (profileData?.transportationTypes && profileData.transportationTypes.length > 0) {
    strength += PROFILE_STRENGTH_WEIGHTS.transportationTypes;
  }

  // Role-specific milestone (25%)
  // Hosts get credit for first listing, guests get credit for rental application
  if (milestones?.isHost) {
    if (milestones?.firstListingCreated) {
      strength += PROFILE_STRENGTH_WEIGHTS.firstListingCreated;
    }
  } else {
    // Guest user
    if (milestones?.rentalAppSubmitted) {
      strength += PROFILE_STRENGTH_WEIGHTS.rentalAppSubmitted;
    }
  }

  return Math.min(100, Math.round(strength));
}

/**
 * Generate next action suggestions based on profile completeness
 * Prioritizes role-specific milestones (25pts) as they have the highest impact
 *
 * @param {Object} profileData - Basic profile info (photo, bio, names, etc.)
 * @param {Object} verifications - Verification flags (email, phone, govId, linkedin)
 * @param {Object} milestones - Role-specific milestones { rentalAppSubmitted, firstListingCreated, isHost }
 */
function generateNextActions(profileData, verifications, milestones = {}) {
  const actions = [];

  // Role-specific milestone (highest priority - 25 points)
  if (milestones?.isHost) {
    if (!milestones?.firstListingCreated) {
      actions.push({
        id: 'firstListing',
        text: 'Create your first listing',
        points: PROFILE_STRENGTH_WEIGHTS.firstListingCreated,
        icon: 'home'
      });
    }
  } else {
    // Guest user
    if (!milestones?.rentalAppSubmitted) {
      actions.push({
        id: 'rentalApp',
        text: 'Complete rental application',
        points: PROFILE_STRENGTH_WEIGHTS.rentalAppSubmitted,
        icon: 'clipboard'
      });
    }
  }

  // Base criteria suggestions (sorted by points descending)
  if (!profileData?.profilePhoto) {
    actions.push({
      id: 'photo',
      text: 'Add a profile photo',
      points: PROFILE_STRENGTH_WEIGHTS.profilePhoto,
      icon: 'camera'
    });
  }
  if (!verifications?.govId) {
    actions.push({
      id: 'govId',
      text: 'Verify your identity',
      points: PROFILE_STRENGTH_WEIGHTS.govIdVerified,
      icon: 'shield'
    });
  }
  if (!profileData?.bio || profileData.bio.trim().length === 0) {
    actions.push({
      id: 'bio',
      text: 'Write a short bio',
      points: PROFILE_STRENGTH_WEIGHTS.bio,
      icon: 'edit'
    });
  }
  if (!verifications?.phone) {
    actions.push({
      id: 'phone',
      text: 'Verify your phone number',
      points: PROFILE_STRENGTH_WEIGHTS.phoneVerified,
      icon: 'phone'
    });
  }
  if (!verifications?.email) {
    actions.push({
      id: 'email',
      text: 'Verify your email',
      points: PROFILE_STRENGTH_WEIGHTS.emailVerified,
      icon: 'mail'
    });
  }
  if (!verifications?.linkedin) {
    actions.push({
      id: 'linkedin',
      text: 'Connect your LinkedIn',
      points: PROFILE_STRENGTH_WEIGHTS.linkedinVerified,
      icon: 'linkedin'
    });
  }
  if (!profileData?.goodGuestReasons || profileData.goodGuestReasons.length === 0) {
    actions.push({
      id: 'goodGuestReasons',
      text: 'Add reasons to host you',
      points: PROFILE_STRENGTH_WEIGHTS.goodGuestReasons,
      icon: 'star'
    });
  }
  if (!profileData?.storageItems || profileData.storageItems.length === 0) {
    actions.push({
      id: 'storageItems',
      text: 'Add common stored items',
      points: PROFILE_STRENGTH_WEIGHTS.storageItems,
      icon: 'box'
    });
  }
  if (!profileData?.transportationTypes || profileData.transportationTypes.length === 0) {
    actions.push({
      id: 'transportationTypes',
      text: 'Add transportation methods',
      points: PROFILE_STRENGTH_WEIGHTS.transportationTypes,
      icon: 'car'
    });
  }

  // Return top 3 suggestions
  return actions.slice(0, 3);
}

/**
 * Convert day names array to day indices (0-6)
 * Handles both string day names ['Monday', 'Tuesday', ...] and numeric indices [0, 1, 2, ...]
 * @param {(string|number)[]} dayValues - Array of day names or indices
 * @returns {number[]} Array of day indices [0, 1, 2, ...]
 */
function dayNamesToIndices(dayValues) {
  if (!Array.isArray(dayValues)) return [];
  return dayValues
    .map(value => {
      // If it's already a valid numeric index (0-6), use it directly
      if (typeof value === 'number' && value >= 0 && value <= 6) {
        return value;
      }
      // Otherwise, treat as day name string and look up the index
      return DAY_NAMES.indexOf(value);
    })
    .filter(idx => idx !== -1);
}

/**
 * Convert day indices to day names
 * @param {number[]} indices - Array of day indices [1, 2, ...]
 * @returns {string[]} Array of day names ['Monday', 'Tuesday', ...]
 */
function indicesToDayNames(indices) {
  if (!Array.isArray(indices)) return [];
  return indices
    .filter(idx => idx >= 0 && idx <= 6)
    .map(idx => DAY_NAMES[idx]);
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useAccountProfilePageLogic() {
  // ============================================================================
  // AUTH (via useAuthenticatedUser hook)
  // ============================================================================
  const {
    user: authUser,
    userId: authUserId,
    isLoading: authLoading,
    isAuthenticated: hookIsAuthenticated
  } = useAuthenticatedUser();

  // ============================================================================
  // STATE
  // ============================================================================

  // Non-modal state via useReducer
  const [state, dispatch] = useReducer(accountProfileReducer, initialState);

  // UI state — modals centralized via useModalManager
  const profileModals = useModalManager({ allowMultiple: true });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Determine if user is the owner of this profile (even in preview mode)
   */
  const isOwnProfile = useMemo(() => {
    return state.isAuthenticated && state.loggedInUserId && state.profileUserId && state.loggedInUserId === state.profileUserId;
  }, [state.isAuthenticated, state.loggedInUserId, state.profileUserId]);

  /**
   * Determine if current user is viewing their own profile (editor view)
   * or someone else's profile (public view)
   * Note: Preview mode forces public view even for own profile
   */
  const isEditorView = useMemo(() => {
    // If preview mode is active, show public view even for own profile
    if (state.previewMode) return false;
    return isOwnProfile;
  }, [isOwnProfile, state.previewMode]);

  /**
   * Determine if profile belongs to a host user
   */
  const isHostUser = useMemo(() => {
    const userType = state.profileData?.current_user_role;
    return isHost({ userType });
  }, [state.profileData]);

  /**
   * Extract verifications from profile data
   */
  const verifications = useMemo(() => {
    if (!state.profileData) return { email: false, phone: false, govId: false, linkedin: false };

    return {
      email: state.profileData.is_email_confirmed === true,
      phone: state.profileData.is_phone_verified === true,
      govId: state.profileData.is_user_verified === true,
      linkedin: !!state.profileData.linkedin_profile_id
    };
  }, [state.profileData]);

  /**
   * Extract role-specific milestones
   * - For hosts: whether they've created their first listing
   * - For guests: whether they've submitted their rental application
   */
  const milestones = useMemo(() => {
    return {
      isHost: isHostUser,
      firstListingCreated: state.hostListings.length > 0,
      rentalAppSubmitted: !!state.profileData?.rental_application_form_id
    };
  }, [isHostUser, state.hostListings, state.profileData]);

  /**
   * Calculate profile strength (0-100)
   * Includes base criteria (90%) + role-specific milestone (25%)
   */
  const profileStrength = useMemo(() => {
    const profileInfo = {
      profilePhoto: state.profileData?.profile_photo_url,
      bio: state.formData.bio || state.profileData?.bio_text,
      firstName: state.formData.firstName || state.profileData?.first_name,
      lastName: state.formData.lastName || state.profileData?.last_name,
      jobTitle: state.formData.jobTitle || state.profileData?._jobTitle,
      goodGuestReasons: state.formData.goodGuestReasons,
      storageItems: state.formData.storageItems,
      transportationTypes: state.formData.transportationTypes || []
    };
    return calculateProfileStrength(profileInfo, verifications, milestones);
  }, [state.profileData, state.formData, verifications, milestones]);

  /**
   * Generate next action suggestions
   * Prioritizes role-specific milestones as they have the highest impact (25pts)
   */
  const nextActions = useMemo(() => {
    const profileInfo = {
      profilePhoto: state.profileData?.profile_photo_url,
      bio: state.formData.bio || state.profileData?.bio_text,
      firstName: state.formData.firstName || state.profileData?.first_name,
      lastName: state.formData.lastName || state.profileData?.last_name,
      jobTitle: state.formData.jobTitle || state.profileData?._jobTitle,
      goodGuestReasons: state.formData.goodGuestReasons,
      storageItems: state.formData.storageItems,
      transportationTypes: state.formData.transportationTypes || []
    };
    return generateNextActions(profileInfo, verifications, milestones);
  }, [state.profileData, state.formData, verifications, milestones]);

  /**
   * Display job title for sidebar
   */
  const displayJobTitle = useMemo(() => {
    return state.formData.jobTitle || state.profileData?._jobTitle || '';
  }, [state.formData.jobTitle, state.profileData]);

  /**
   * Determine if Date of Birth field should be shown.
   * Only show when the user has NO date of birth in the database
   * (typically OAuth signups via LinkedIn/Google where DOB isn't collected).
   * Once the user saves a DOB, this field will be hidden on subsequent visits.
   */
  const showDateOfBirthField = useMemo(() => {
    return !state.profileData?.date_of_birth;
  }, [state.profileData]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch reference data (good guest reasons, storage items)
   */
  const fetchReferenceData = useCallback(async () => {
    try {
      // Fetch good guest reasons
      const { data: reasons, error: reasonsError } = await supabase
        .from('zat_goodguestreasons')
        .select('id, name')
        .order('name');

      if (reasonsError) {
        console.error('Error fetching good guest reasons:', reasonsError);
      } else {
        dispatch({ type: 'SET_GOOD_GUEST_REASONS_LIST', payload: reasons || [] });
      }

      // Fetch storage items
      const { data: storage, error: storageError } = await supabase
        .from('zat_storage')
        .select('id, name')
        .order('name');

      if (storageError) {
        console.error('Error fetching storage items:', storageError);
      } else {
        // Filter out deprecated storage options
        const excludedItems = ['ID / Wallet / Money', 'Luggage', 'Portable Massager', 'Protein', 'Sound System', 'TV'];
        const filteredStorage = (storage || []).filter(item => !excludedItems.includes(item.name));
        dispatch({ type: 'SET_STORAGE_ITEMS_LIST', payload: filteredStorage });
      }
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  }, []);

  /**
   * Fetch user profile data
   */
  const fetchProfileData = useCallback(async (userId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        throw new Error('User not found');
      }

      // Fetch job title and employment status from linked rental application (if exists)
      let jobTitle = '';
      let employmentStatus = '';
      const rentalAppId = userData.rental_application_form_id;
      if (rentalAppId) {
        const { data: rentalAppData } = await supabase
          .from('rentalapplication')
          .select('job_title, employment_status')
          .eq('id', rentalAppId)
          .maybeSingle();

        if (rentalAppData) {
          // Use job title if available, otherwise use employment status as display value
          jobTitle = rentalAppData.job_title || '';
          employmentStatus = rentalAppData.employment_status || '';

          // If no job title but has employment status, format it nicely for display
          if (!jobTitle && employmentStatus) {
            // Convert kebab-case to Title Case (e.g., "business-owner" -> "Business Owner")
            jobTitle = employmentStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
        }
      }

      dispatch({ type: 'SET_PROFILE_DATA', payload: { ...userData, _jobTitle: jobTitle, _employmentStatus: employmentStatus, _rentalAppId: rentalAppId } });

      // Initialize form data from profile
      // Database columns use Bubble.io naming conventions
      // Date of Birth is stored as timestamp, convert to YYYY-MM-DD for date input
      const dobTimestamp = userData.date_of_birth;
      const dateOfBirth = dobTimestamp ? dobTimestamp.split('T')[0] : '';

      // Parse transportation medium - stored as JSON string in text column
      const rawTransport = userData['transportation medium'];
      let transportationTypes = [];
      const validValues = ['car', 'public_transit', 'bicycle', 'walking', 'rideshare', 'other'];

      if (rawTransport && typeof rawTransport === 'string') {
        try {
          // Try to parse as JSON array
          const parsed = JSON.parse(rawTransport);
          if (Array.isArray(parsed)) {
            transportationTypes = parsed.filter(val => validValues.includes(val));
          }
        } catch {
          // If not valid JSON, check if it's a single valid value
          if (validValues.includes(rawTransport)) {
            transportationTypes = [rawTransport];
          }
        }
      } else if (Array.isArray(rawTransport)) {
        // Handle case where it comes back as array (shouldn't happen with text column)
        transportationTypes = rawTransport.filter(val => validValues.includes(val));
      }

      dispatch({
        type: 'SET_FORM_DATA',
        payload: {
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          jobTitle,
          dateOfBirth,
          bio: userData.bio_text || '',
          needForSpace: userData.stated_need_for_space_text || '',
          specialNeeds: userData.stated_special_needs_text || '',
          selectedDays: dayNamesToIndices(userData.recent_days_selected_json || []),
          transportationTypes,
          goodGuestReasons: [],
          storageItems: []
        }
      });

      return userData;
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Fetch host's listings using RPC function
   * Uses get_host_listings RPC to handle column names with special characters
   * (same approach as HostOverviewPage)
   */
  const fetchHostListings = useCallback(async (userId) => {
    if (!userId) return;
    dispatch({ type: 'SET_LOADING_LISTINGS', payload: true });
    try {
      // Use RPC function to fetch listings (handles host_user_id lookups)
      const { data, error } = await supabase
        .rpc('get_host_listings', { host_user_id: userId });

      if (error) throw error;

      // Map RPC results to the format expected by ListingsCard component
      // RPC returns: id, listing_title, is_listing_profile_complete, borough, hood, bedrooms, bathrooms,
      //              photos_with_urls_captions_and_sort_order_json (JSONB array), min_nightly, rental_type, monthly_rate, weekly_rate, etc.
      const mappedListings = (data || [])
        .filter(listing => listing.is_listing_profile_complete === true) // Only show complete listings
        .map(listing => {
          return {
            // listing.id is the primary identifier used for routing and URLs
            id: listing.id,
            listing_title: listing.listing_title || 'Unnamed Listing',
            borough: listing.borough || '',
            hood: listing.hood || '',
            bedroom_count: listing.bedrooms || 0,
            bathroom_count: listing.bathrooms || 0,
            lowest_nightly_price_for_map_display: listing.min_nightly || 0,
            weekly_rate_paid_to_host: listing.weekly_rate || 0,
            monthly_rate_paid_to_host: listing.monthly_rate || 0,
            is_listing_profile_complete: listing.is_listing_profile_complete,
            // Pass raw JSONB photo array - ListingsCard handles extraction
            listing_photo: listing.photos_with_urls_captions_and_sort_order_json || [],
            // Rental type for proper price label (Nightly/Weekly/Monthly)
            rental_type: listing.rental_type || 'Nightly',
            source: listing.source || 'listing'
          };
        });

      dispatch({ type: 'SET_HOST_LISTINGS', payload: mappedListings });
    } catch (err) {
      console.error('[AccountProfile] Error fetching host listings:', err);
      // Non-blocking - just log and continue with empty listings
      dispatch({ type: 'SET_HOST_LISTINGS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_LISTINGS', payload: false });
    }
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Wait for auth hook to finish loading
    if (authLoading) return;

    async function initialize() {
      try {
        // FIRST: Check for auth errors in URL hash (e.g., expired magic link)
        // This must happen before any auth checks to prevent redirect loops
        const authError = checkUrlForAuthError();
        if (authError) {
          // Clear the error from URL to prevent re-processing on reload
          clearAuthErrorFromUrl();

          // Set user-friendly error message based on error type
          // These errors typically occur when email verification links expire
          let errorMessage = 'Authentication failed. ';
          if (authError.errorCode === 'otp_expired') {
            errorMessage = 'This verification link has expired or already been used. Please request a new verification email from your profile settings.';
          } else if (authError.errorCode === 'access_denied') {
            errorMessage = 'Access denied. The verification link may have expired or been used already. Please request a new verification email.';
          } else if (authError.errorDescription) {
            errorMessage = authError.errorDescription;
          } else {
            errorMessage = 'The verification link is invalid or has expired. Please request a new verification email from your profile settings.';
          }

          // Throw error to be caught and displayed
          throw new Error(errorMessage);
        }

        // Use auth state from the useAuthenticatedUser hook
        dispatch({ type: 'SET_IS_AUTHENTICATED', payload: hookIsAuthenticated });

        // Get logged-in user ID from the hook (Bubble _id)
        const validatedUserId = authUserId || null;
        dispatch({ type: 'SET_LOGGED_IN_USER_ID', payload: validatedUserId });

        // Extract profile user ID from URL, or fall back to logged-in user's ID
        // This allows users to view their own profile at /account-profile without a userId param
        const urlUserId = getUserIdFromUrl();
        const targetUserId = urlUserId || validatedUserId;

        if (!targetUserId) {
          // No URL param AND not logged in - redirect to login or show error
          throw new Error('Please log in to view your profile, or provide a user ID in the URL');
        }

        dispatch({ type: 'SET_PROFILE_USER_ID', payload: targetUserId });

        // Fetch reference data
        await fetchReferenceData();

        // Fetch profile data
        const userData = await fetchProfileData(targetUserId);

        // If user is a host, fetch their listings
        if (userData) {
          const userType = userData.current_user_role;
          if (isHost({ userType })) {
            await fetchHostListings(targetUserId);
          }
        }

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        console.error('Error initializing profile page:', err);
        dispatch({ type: 'SET_ERROR', payload: err.message });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    initialize();
  }, [authLoading, hookIsAuthenticated, authUserId, fetchReferenceData, fetchProfileData, fetchHostListings]);

  // ============================================================================
  // RENTAL APPLICATION STATUS (Guest-only)
  // ============================================================================

  /**
   * Compute rental application status based on:
   * 1. Database field (already submitted)
   * 2. localStorage draft (in progress)
   * 3. Default (not started)
   */
  useEffect(() => {
    // Only compute for guest users viewing their own profile
    if (!isEditorView || isHostUser) return;

    // Check if already submitted in database
    if (state.profileData?.rental_application_form_id) {
      dispatch({ type: 'SET_RENTAL_APPLICATION', payload: { status: 'submitted', progress: 100 } });
      return;
    }

    // Check localStorage for draft
    try {
      const draft = localStorage.getItem('rentalApplicationDraft');
      if (draft) {
        const draftData = JSON.parse(draft);
        // Calculate progress based on filled fields
        const fields = [
          'fullName', 'dob', 'email', 'phone',
          'currentAddress', 'lengthResided',
          'employmentStatus',
          'signature'
        ];
        const optionalFields = [
          'apartmentUnit', 'renting',
          'employerName', 'jobTitle', 'businessName',
          'hasPets', 'isSmoker', 'needsParking', 'references'
        ];

        let filled = 0;
        const total = fields.length;

        fields.forEach(field => {
          if (draftData[field] && String(draftData[field]).trim()) filled++;
        });

        // Add bonus for optional fields
        optionalFields.forEach(field => {
          if (draftData[field] && String(draftData[field]).trim()) filled += 0.5;
        });

        const progress = Math.min(100, Math.round((filled / total) * 100));

        if (progress > 0) {
          dispatch({ type: 'SET_RENTAL_APPLICATION', payload: { status: 'in_progress', progress } });
          return;
        }
      }
    } catch (e) {
      console.error('Error reading rental application draft:', e);
    }

    // Default: not started
    dispatch({ type: 'SET_RENTAL_APPLICATION', payload: { status: 'not_started', progress: 0 } });
  }, [isEditorView, isHostUser, state.profileData]);

  // ============================================================================
  // EMAIL VERIFICATION CALLBACK
  // ============================================================================

  /**
   * Handle email verification callback from magic link
   * Detects ?verified=email URL param and updates database
   */
  useEffect(() => {
    const handleEmailVerificationCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const verifiedType = params.get('verified');

      // Only process if it's an email verification callback and user is authenticated
      if (verifiedType !== 'email' || !state.isAuthenticated || !state.profileUserId) {
        return;
      }

      // Clean URL immediately to prevent re-processing
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, '', url.toString());

      try {
        // Update user's email verification status in database
        const { error: updateError } = await supabase
          .from('user')
          .update({ is_email_confirmed: true })
          .eq('id', state.profileUserId);

        if (updateError) {
          console.error('[email-verification] Error updating verification status:', updateError);
          if (window.showToast) {
            window.showToast({ title: 'Error', content: 'Failed to update email verification status.', type: 'error' });
          }
          return;
        }

        // Refresh profile data to reflect new verification status
        await fetchProfileData(state.profileUserId);

        // Show success toast
        if (window.showToast) {
          window.showToast({ title: 'Email Verified', content: 'Your email has been verified successfully!', type: 'success' });
        }

      } catch (err) {
        console.error('[email-verification] Unexpected error:', err);
        if (window.showToast) {
          window.showToast({ title: 'Error', content: 'An error occurred during verification.', type: 'error' });
        }
      }
    };

    // Run when authentication state and profile data are available
    if (state.isAuthenticated && state.profileUserId) {
      handleEmailVerificationCallback();
    }
  }, [state.isAuthenticated, state.profileUserId, fetchProfileData]);

  // ============================================================================
  // RENTAL APPLICATION URL NAVIGATION (Guest-only)
  // ============================================================================

  /**
   * Handle rental application deep link from messaging page or other CTAs
   * Detects ?section=rental-application&openRentalApp=true URL params
   * Auto-opens the wizard modal and scrolls to the section
   */
  useEffect(() => {
    // Only process for guests viewing their own profile after loading completes
    if (state.loading || !isEditorView || isHostUser) return;

    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const openRentalApp = params.get('openRentalApp');

    // Only process rental application navigation
    if (section !== 'rental-application') return;

    // Clean URL to prevent re-processing on state changes
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    url.searchParams.delete('openRentalApp');
    window.history.replaceState({}, '', url.toString());

    // Scroll to the rental application section
    // Use setTimeout to ensure DOM has rendered after state updates
    setTimeout(() => {
      const rentalAppSection = document.getElementById('rental-application-section');
      if (rentalAppSection) {
        rentalAppSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Auto-open the wizard modal if requested
      if (openRentalApp === 'true') {
        profileModals.open('rentalWizard');
      }
    }, 100);
  }, [state.loading, isEditorView, isHostUser]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } });
    dispatch({ type: 'SET_IS_DIRTY', payload: true });

    // Clear error for this field
    if (state.formErrors[field]) {
      dispatch({ type: 'CLEAR_FORM_ERROR', payload: field });
    }
  }, [state.formErrors]);

  /**
   * Handle day selection toggle
   */
  const handleDayToggle = useCallback((dayIndex) => {
    const currentDays = state.formData.selectedDays;
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort((a, b) => a - b);

    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'selectedDays', value: newDays } });
    dispatch({ type: 'SET_IS_DIRTY', payload: true });
  }, [state.formData.selectedDays]);

  /**
   * Handle chip selection toggle (for reasons and storage items)
   * AUTOSAVE: Immediately saves to database and shows toast notification
   *
   * @param {string} field - 'goodGuestReasons' or 'storageItems'
   * @param {string} id - The ID of the item being toggled
   */
  const handleChipToggle = useCallback(async (field, id) => {
    // Determine if we're adding or removing
    const currentItems = state.formData[field];
    const isRemoving = currentItems.includes(id);
    const newItems = isRemoving
      ? currentItems.filter(i => i !== id)
      : [...currentItems, id];

    // Update local state immediately for responsive UI
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value: newItems } });
    dispatch({ type: 'SET_IS_DIRTY', payload: true });

    // Get the item name for the toast notification
    let itemName = '';
    if (field === 'goodGuestReasons') {
      const reason = state.goodGuestReasonsList.find(r => r.id === id);
      itemName = reason?.name || 'Reason';
    } else if (field === 'storageItems') {
      const item = state.storageItemsList.find(i => i.id === id);
      itemName = item?.name || 'Item';
    }

    if (window.showToast) {
      const action = isRemoving ? 'Removed' : 'Added';
      window.showToast({
        title: `${action}: ${itemName}`,
        type: 'success',
        duration: 2000
      });
    }
  }, [state.formData, state.goodGuestReasonsList, state.storageItemsList, state.profileUserId]);

  /**
   * Handle transportation method toggle (multi-select)
   */
  const handleTransportToggle = useCallback((transportValue) => {
    const currentTypes = state.formData.transportationTypes;
    const newTypes = currentTypes.includes(transportValue)
      ? currentTypes.filter(t => t !== transportValue)
      : [...currentTypes, transportValue];

    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'transportationTypes', value: newTypes } });
    dispatch({ type: 'SET_IS_DIRTY', payload: true });
  }, [state.formData.transportationTypes]);

  /**
   * Validate form before save
   */
  const validateForm = useCallback(() => {
    const errors = {};

    if (!state.formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Add more validations as needed

    dispatch({ type: 'SET_FORM_ERRORS', payload: errors });
    return Object.keys(errors).length === 0;
  }, [state.formData]);

  /**
   * Save profile changes
   */
  const handleSave = useCallback(async () => {
    if (!isEditorView || !state.profileUserId) {
      console.error('Cannot save: not in editor view or no user ID');
      return { success: false, error: 'Cannot save changes' };
    }

    if (!validateForm()) {
      if (window.showToast) {
        window.showToast({ title: 'Validation error', content: 'Please fix the errors before saving.', type: 'error' });
      }
      return { success: false, error: 'Please fix validation errors' };
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    try {
      // Build the full name from first and last name
      const firstName = state.formData.firstName.trim();
      const lastName = state.formData.lastName.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

      // Convert date of birth from YYYY-MM-DD to ISO timestamp for database
      // Only include if value exists to avoid overwriting with null
      const dateOfBirthISO = state.formData.dateOfBirth
        ? new Date(state.formData.dateOfBirth + 'T00:00:00Z').toISOString()
        : null;

      // Database columns use Bubble.io naming conventions
      // Note: 'Job Title' column does not exist - removed from update
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirthISO,
        bio_text: state.formData.bio.trim(),
        stated_need_for_space_text: state.formData.needForSpace.trim(),
        stated_special_needs_text: state.formData.specialNeeds.trim(),
        recent_days_selected_json: indicesToDayNames(state.formData.selectedDays),
        'transportation medium': state.formData.transportationTypes.length > 0
          ? JSON.stringify(state.formData.transportationTypes)
          : null, // Store as JSON string
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('user')
        .update(updateData)
        .eq('id', state.profileUserId);

      if (updateError) {
        console.error('[handleSave] Update error:', updateError);
        throw updateError;
      }

      // Save job title to rental application table (if user has one)
      const rentalAppId = state.profileData?._rentalAppId;
      if (rentalAppId && state.formData.jobTitle !== undefined) {
        const { error: rentalAppError } = await supabase
          .from('rentalapplication')
          .update({ job_title: state.formData.jobTitle.trim() })
          .eq('id', rentalAppId);

        if (rentalAppError) {
          console.error('Error saving job title to rental application:', rentalAppError);
          // Don't throw - user data was saved successfully, job title is secondary
        }
      }

      // Refresh profile data
      await fetchProfileData(state.profileUserId);
      dispatch({ type: 'SET_IS_DIRTY', payload: false });
      dispatch({ type: 'SET_SAVING', payload: false });

      // Show success toast
      if (window.showToast) {
        window.showToast({ title: 'Profile saved!', content: 'Your changes have been saved successfully.', type: 'success' });
      }

      return { success: true };
    } catch (err) {
      console.error('Error saving profile:', err);
      dispatch({ type: 'SET_SAVING', payload: false });

      // Show error toast
      if (window.showToast) {
        window.showToast({ title: 'Save failed', content: err.message || 'Please try again.', type: 'error' });
      }

      return { success: false, error: err.message };
    }
  }, [isEditorView, state.profileUserId, state.formData, state.profileData, validateForm, fetchProfileData]);

  /**
   * Toggle preview mode to show public view of own profile
   */
  const handlePreviewProfile = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
  }, []);

  // ============================================================================
  // VERIFICATION HANDLERS
  // ============================================================================

  const handleVerifyEmail = useCallback(async () => {
    // Prevent duplicate requests
    if (state.isVerifyingEmail) return;

    // Get user's email from profile data
    const userEmail = state.profileData?.email;
    if (!userEmail) {
      console.error('[handleVerifyEmail] No email found in profile data');
      if (window.showToast) {
        window.showToast({ title: 'Error', content: 'Unable to verify email. Please refresh and try again.', type: 'error' });
      }
      return;
    }

    dispatch({ type: 'SET_IS_VERIFYING_EMAIL', payload: true });

    try {
      // Step 1: Fetch BCC email addresses from os_slack_channels
      const { data: channelData, error: channelError } = await supabase
        .from('os_slack_channels')
        .select('email_address')
        .in('name', ['bots_log', 'customer_activation']);

      let bccEmails = [];
      if (!channelError && channelData) {
        bccEmails = channelData
          .map(c => c.email_address)
          .filter(e => e && e.trim() && e.includes('@'));
      }

      // Step 2: Generate magic link with redirect to account profile + verification param
      const redirectTo = `${window.location.origin}/account-profile/${state.profileUserId}?verified=email`;

      const { data: magicLinkData, error: magicLinkError } = await supabase.functions.invoke('auth-user', {
        body: {
          action: 'generate_magic_link',
          payload: {
            email: userEmail.toLowerCase().trim(),
            redirectTo: redirectTo
          }
        }
      });

      if (magicLinkError || !magicLinkData?.success) {
        console.error('[handleVerifyEmail] Error generating magic link:', magicLinkError || magicLinkData);
        if (window.showToast) {
          window.showToast({ title: 'Error', content: 'Failed to generate verification link. Please try again.', type: 'error' });
        }
        dispatch({ type: 'SET_IS_VERIFYING_EMAIL', payload: false });
        return;
      }

      const magicLink = magicLinkData.data.action_link;
      const firstName = state.profileData?.first_name || 'there';

      // Step 3: Send verification email using send-email edge function
      const bodyText = `Hi ${firstName}. Please click the link below to verify your email address on Split Lease. This helps us ensure your account is secure and builds trust with other members of our community.`;

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send',
          payload: {
            template_id: '1757433099447x202755280527849400', // Security 2 template (Magic Login)
            to_email: userEmail.toLowerCase().trim(),
            variables: {
              toemail: userEmail.toLowerCase().trim(),
              fromemail: 'tech@leasesplit.com',
              fromname: 'Split Lease',
              subject: 'Verify Your Email - Split Lease',
              preheadertext: 'Click to verify your email address',
              title: 'Verify Your Email',
              bodytext: bodyText,
              buttonurl: magicLink,
              buttontext: 'Verify Email',
              bannertext1: 'EMAIL VERIFICATION',
              bannertext2: 'This link expires in 1 hour',
              bannertext3: "If you didn't request this, please ignore this email",
              footermessage: 'For your security, never share this link with anyone.',
              cc_email: '',  // Structural placeholder - becomes empty in template
              bcc_email: ''  // Structural placeholder - becomes empty in template
            },
            ...(bccEmails.length > 0 && { bcc_emails: bccEmails })
          }
        }
      });

      if (emailError) {
        console.error('[handleVerifyEmail] Error sending email:', emailError);
        if (window.showToast) {
          window.showToast({ title: 'Error', content: 'Failed to send verification email. Please try again.', type: 'error' });
        }
      } else {
        dispatch({ type: 'SET_VERIFICATION_EMAIL_SENT', payload: true });
        if (window.showToast) {
          window.showToast({ title: 'Email Sent', content: 'Verification email sent! Check your inbox and click the link to verify.', type: 'success' });
        }
      }

    } catch (err) {
      console.error('[handleVerifyEmail] Unexpected error:', err);
      if (window.showToast) {
        window.showToast({ title: 'Error', content: 'An unexpected error occurred. Please try again.', type: 'error' });
      }
    }

    dispatch({ type: 'SET_IS_VERIFYING_EMAIL', payload: false });
  }, [state.isVerifyingEmail, state.profileData, state.profileUserId]);

  const handleVerifyPhone = useCallback(() => {
    profileModals.open('phoneEdit');
  }, []);

  const handleVerifyGovId = useCallback(() => {
    // Open identity verification modal
    profileModals.open('identityVerification');
  }, []);

  /**
   * Handle identity verification submission
   * Called when user submits documents in the IdentityVerification modal
   */
  const handleIdentityVerificationSubmit = useCallback(async (verificationData) => {
    try {
      // Submit verification using the service
      await submitIdentityVerification({
        userId: state.profileUserId,
        documentType: verificationData.documentType,
        selfieFile: verificationData.selfieFile,
        frontIdFile: verificationData.frontIdFile,
        backIdFile: verificationData.backIdFile,
        onProgress: () => {},
      });

      // Refresh profile data to reflect new verification status
      await fetchProfileData(state.profileUserId);

      // The success toast is shown by the modal's logic hook
    } catch (error) {
      console.error('[Identity Verification] Error:', error);
      // Re-throw so the modal can show the error toast
      throw error;
    }
  }, [state.profileUserId, fetchProfileData]);

  /**
   * Handle closing the identity verification modal
   */
  const handleCloseIdentityVerificationModal = useCallback(() => {
    profileModals.close('identityVerification');
  }, []);

  const handleConnectLinkedIn = useCallback(() => {
    // Trigger LinkedIn OAuth flow
  }, []);

  const handleEditPhone = useCallback(() => {
    profileModals.open('phoneEdit');
  }, []);

  // ============================================================================
  // SETTINGS HANDLERS
  // ============================================================================

  const handleOpenNotificationSettings = useCallback(() => {
    profileModals.open('notification');
  }, []);

  const handleCloseNotificationModal = useCallback(() => {
    profileModals.close('notification');
  }, []);

  const handleClosePhoneEditModal = useCallback(() => {
    profileModals.close('phoneEdit');
  }, []);

  const handleChangePassword = useCallback(() => {
    // Navigate to password reset page
    window.location.href = '/reset-password';
  }, []);

  /**
   * Handle next action card clicks in the sidebar
   * Routes to the appropriate handler based on action ID
   */
  const handleNextActionClick = useCallback((actionId) => {
    switch (actionId) {
      case 'govId':
        // Open identity verification modal
        profileModals.open('identityVerification');
        break;
      case 'phone':
        // Open phone verification modal
        profileModals.open('phoneEdit');
        break;
      case 'email':
        // Trigger email verification
        handleVerifyEmail();
        break;
      case 'linkedin':
        // LinkedIn OAuth flow (TODO: implement)
        break;
      case 'rentalApp':
        // Open rental application wizard (guest-only)
        profileModals.open('rentalWizard');
        break;
      case 'firstListing':
        // Navigate to create listing page (host-only)
        window.location.href = '/self-listing-v2';
        break;
      case 'photo':
        // Scroll to avatar and trigger file upload dialog
        // The avatar input is in the sidebar, so we just need to click it
        document.querySelector('.avatar-edit-overlay')?.click();
        break;
      case 'bio':
        // Scroll to bio section
        document.querySelector('.profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      default:
        console.warn('Unknown action ID:', actionId);
    }
  }, [handleVerifyEmail]);

  // ============================================================================
  // RENTAL APPLICATION WIZARD HANDLERS (Guest-only)
  // ============================================================================

  const handleOpenRentalWizard = useCallback(() => {
    profileModals.open('rentalWizard');
  }, []);

  const handleCloseRentalWizard = useCallback(() => {
    profileModals.close('rentalWizard');
  }, []);

  const handleRentalWizardSuccess = useCallback(() => {
    // On successful submission, update status and close modal
    dispatch({ type: 'SET_RENTAL_APPLICATION', payload: { status: 'submitted', progress: 100 } });
    profileModals.close('rentalWizard');
    // Refresh profile data to reflect the submitted application
    if (state.profileUserId) {
      fetchProfileData(state.profileUserId);
    }
  }, [state.profileUserId, fetchProfileData]);

  // ============================================================================
  // PHOTO HANDLERS
  // ============================================================================

  const handleCoverPhotoChange = useCallback(async (_file) => {
    // TODO: Implement cover photo upload
  }, []);

  const handleAvatarChange = useCallback(async (file) => {
    if (!file || !state.profileUserId) {
      console.error('Cannot upload avatar: no file or user ID');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large. Maximum size is 5MB.');
      return;
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    try {
      // Get the Supabase Auth session to get the auth user ID for storage path
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const authUserIdForStorage = session.user.id;

      // Generate unique filename with timestamp to avoid cache issues
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      const filePath = `${authUserIdForStorage}/${fileName}`;

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      const publicUrl = urlData.publicUrl;

      // Update the user's Profile Photo field in the database
      const { error: updateError } = await supabase
        .from('user')
        .update({
          profile_photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.profileUserId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      dispatch({ type: 'MERGE_PROFILE_DATA', payload: { profile_photo_url: publicUrl } });

    } catch (err) {
      console.error('Error uploading avatar:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to upload profile photo' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.profileUserId]);

  // ============================================================================
  // HOST LISTING HANDLERS
  // ============================================================================

  /**
   * Navigate to listing page based on view context:
   * - Editor View (own profile): Go to listing-dashboard to manage the listing
   * - Public View (visitor): Go to view-split-lease to see listing details with booking
   *
   * Note: listing-dashboard uses query params (?id=), view-split-lease uses path segments (/:id)
   */
  const handleListingClick = useCallback((listingId) => {
    if (listingId) {
      if (isEditorView) {
        // Owner viewing their own profile - go to listing management
        // listing-dashboard uses query params, NOT path segments
        window.location.href = `/listing-dashboard?id=${listingId}`;
      } else {
        // Visitor viewing someone else's profile - go to public listing view
        // view-split-lease uses path segments
        window.location.href = `/view-split-lease/${listingId}`;
      }
    }
  }, [isEditorView]);

  /**
   * Navigate to create listing page (Self Listing V2)
   */
  const handleCreateListing = useCallback(() => {
    window.location.href = '/self-listing-v2';
  }, []);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Core state
    loading: state.loading,
    saving: state.saving,
    error: state.error,

    // View mode
    isEditorView,
    previewMode: state.previewMode,

    // Profile data
    profileData: state.profileData,
    profileUserId: state.profileUserId,

    // Computed display values
    displayJobTitle,
    verifications,
    profileStrength,
    nextActions,
    showDateOfBirthField,

    // Form state
    formData: state.formData,
    formErrors: state.formErrors,
    isDirty: state.isDirty,

    // Reference data
    goodGuestReasonsList: state.goodGuestReasonsList,
    storageItemsList: state.storageItemsList,
    transportationOptions: state.transportationOptions,

    // Form handlers
    handleFieldChange,
    handleDayToggle,
    handleChipToggle,
    handleTransportToggle,

    // Save
    handleSave,
    handlePreviewProfile,

    // Verification handlers
    handleVerifyEmail,
    handleVerifyPhone,
    handleVerifyGovId,
    handleConnectLinkedIn,
    handleEditPhone,

    // Settings handlers
    handleOpenNotificationSettings,
    handleChangePassword,
    handleNextActionClick,

    // Photo handlers
    handleCoverPhotoChange,
    handleAvatarChange,

    // Modal state (backward-compat aliases)
    showNotificationModal: profileModals.isOpen('notification'),
    handleCloseNotificationModal,
    showPhoneEditModal: profileModals.isOpen('phoneEdit'),
    handleClosePhoneEditModal,
    showIdentityVerificationModal: profileModals.isOpen('identityVerification'),
    handleIdentityVerificationSubmit,
    handleCloseIdentityVerificationModal,

    // Host profile
    isHostUser,
    hostListings: state.hostListings,
    loadingListings: state.loadingListings,
    handleListingClick,
    handleCreateListing,

    // Rental application (guest-only)
    rentalApplicationStatus: state.rentalApplicationStatus,
    rentalApplicationProgress: state.rentalApplicationProgress,
    showRentalWizardModal: profileModals.isOpen('rentalWizard'),
    handleOpenRentalWizard,
    handleCloseRentalWizard,
    handleRentalWizardSuccess,

    // Email verification state
    isVerifyingEmail: state.isVerifyingEmail,
    verificationEmailSent: state.verificationEmailSent
  };
}
