/**
 * useAccountProfilePageLogic - Logic Hook for AccountProfilePage
 *
 * Orchestrates all business logic for the Account Profile page.
 * Supports two views:
 * - Editor View: User viewing/editing their own profile
 * - Public View: User viewing someone else's profile (read-only)
 *
 * ARCHITECTURE: Hollow Component Pattern
 * - Manages all React state (useState, useEffect, useCallback, useMemo)
 * - Component using this hook is "hollow" (presentation only)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { checkUrlForAuthError, clearAuthErrorFromUrl } from '../../../lib/auth/index.js';
import { isHost } from '../../../logic/rules/users/isHost.js';
import { submitIdentityVerification } from '../../../lib/api/identityVerificationService.js';

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
    loading: authLoading,
    isAuthenticated: hookIsAuthenticated
  } = useAuthenticatedUser();

  // ============================================================================
  // STATE
  // ============================================================================

  // Core state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // User identity
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Profile data from database
  const [profileData, setProfileData] = useState(null);

  // Form state (for editor view)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    dateOfBirth: '', // ISO date string (YYYY-MM-DD)
    bio: '',
    needForSpace: '',
    specialNeeds: '',
    selectedDays: [], // 0-indexed day indices
    transportationTypes: [], // Array of transport method values (multi-select)
    goodGuestReasons: [], // Array of IDs
    storageItems: [] // Array of IDs
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Reference data
  const [goodGuestReasonsList, setGoodGuestReasonsList] = useState([]);
  const [storageItemsList, setStorageItemsList] = useState([]);
  const [transportationOptions] = useState([
    { value: '', label: 'Select transportation...' },
    { value: 'car', label: 'Car' },
    { value: 'public_transit', label: 'Public Transit' },
    { value: 'plane', label: 'Plane' }
  ]);

  // UI state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPhoneEditModal, setShowPhoneEditModal] = useState(false);
  const [showIdentityVerificationModal, setShowIdentityVerificationModal] = useState(false);

  // Host listings state
  const [hostListings, setHostListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Rental application wizard state (guest-only)
  const [showRentalWizardModal, setShowRentalWizardModal] = useState(false);
  const [rentalApplicationStatus, setRentalApplicationStatus] = useState('not_started'); // 'not_started' | 'in_progress' | 'submitted'
  const [rentalApplicationProgress, setRentalApplicationProgress] = useState(0);

  // Preview mode state - when true, shows public view even for own profile
  const [previewMode, setPreviewMode] = useState(false);

  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Determine if user is the owner of this profile (even in preview mode)
   */
  const isOwnProfile = useMemo(() => {
    return isAuthenticated && loggedInUserId && profileUserId && loggedInUserId === profileUserId;
  }, [isAuthenticated, loggedInUserId, profileUserId]);

  /**
   * Determine if current user is viewing their own profile (editor view)
   * or someone else's profile (public view)
   * Note: Preview mode forces public view even for own profile
   */
  const isEditorView = useMemo(() => {
    // If preview mode is active, show public view even for own profile
    if (previewMode) return false;
    return isOwnProfile;
  }, [isOwnProfile, previewMode]);

  /**
   * Determine if profile belongs to a host user
   */
  const isHostUser = useMemo(() => {
    const userType = profileData?.['Type - User Signup'];
    return isHost({ userType });
  }, [profileData]);

  /**
   * Extract verifications from profile data
   */
  const verifications = useMemo(() => {
    if (!profileData) return { email: false, phone: false, govId: false, linkedin: false };

    return {
      email: profileData['is email confirmed'] === true,
      phone: profileData['Verify - Phone'] === true,
      govId: profileData.is_user_verified === true,
      linkedin: !!profileData['Verify - Linked In ID']
    };
  }, [profileData]);

  /**
   * Extract role-specific milestones
   * - For hosts: whether they've created their first listing
   * - For guests: whether they've submitted their rental application
   */
  const milestones = useMemo(() => {
    return {
      isHost: isHostUser,
      firstListingCreated: hostListings.length > 0,
      rentalAppSubmitted: !!profileData?.['Rental Application']
    };
  }, [isHostUser, hostListings, profileData]);

  /**
   * Calculate profile strength (0-100)
   * Includes base criteria (90%) + role-specific milestone (25%)
   */
  const profileStrength = useMemo(() => {
    const profileInfo = {
      profilePhoto: profileData?.profile_photo_url,
      bio: formData.bio || profileData?.bio_text,
      firstName: formData.firstName || profileData?.first_name,
      lastName: formData.lastName || profileData?.last_name,
      jobTitle: formData.jobTitle || profileData?.['Job Title'],
      goodGuestReasons: formData.goodGuestReasons || profileData?.['Reasons to Host me'] || [],
      storageItems: formData.storageItems || profileData?.['About - Commonly Stored Items'] || [],
      transportationTypes: formData.transportationTypes || []
    };
    return calculateProfileStrength(profileInfo, verifications, milestones);
  }, [profileData, formData, verifications, milestones]);

  /**
   * Generate next action suggestions
   * Prioritizes role-specific milestones as they have the highest impact (25pts)
   */
  const nextActions = useMemo(() => {
    const profileInfo = {
      profilePhoto: profileData?.profile_photo_url,
      bio: formData.bio || profileData?.bio_text,
      firstName: formData.firstName || profileData?.first_name,
      lastName: formData.lastName || profileData?.last_name,
      jobTitle: formData.jobTitle || profileData?.['Job Title'],
      goodGuestReasons: formData.goodGuestReasons || profileData?.['Reasons to Host me'] || [],
      storageItems: formData.storageItems || profileData?.['About - Commonly Stored Items'] || [],
      transportationTypes: formData.transportationTypes || []
    };
    return generateNextActions(profileInfo, verifications, milestones);
  }, [profileData, formData, verifications, milestones]);

  /**
   * Display job title for sidebar
   */
  const displayJobTitle = useMemo(() => {
    return formData.jobTitle || profileData?.['Job Title'] || '';
  }, [formData.jobTitle, profileData]);

  /**
   * Determine if Date of Birth field should be shown.
   * Only show when the user has NO date of birth in the database
   * (typically OAuth signups via LinkedIn/Google where DOB isn't collected).
   * Once the user saves a DOB, this field will be hidden on subsequent visits.
   */
  const showDateOfBirthField = useMemo(() => {
    return !profileData?.['Date of Birth'];
  }, [profileData]);

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
        .schema('reference_table')
        .from('zat_goodguestreasons')
        .select('_id, name')
        .order('name');

      if (reasonsError) {
        console.error('Error fetching good guest reasons:', reasonsError);
      } else {
        setGoodGuestReasonsList(reasons || []);
      }

      // Fetch storage items
      const { data: storage, error: storageError } = await supabase
        .schema('reference_table')
        .from('zat_storage')
        .select('_id, Name')
        .order('Name');

      if (storageError) {
        console.error('Error fetching storage items:', storageError);
      } else {
        // Filter out deprecated storage options
        const excludedItems = ['ID / Wallet / Money', 'Luggage', 'Portable Massager', 'Protein', 'Sound System', 'TV'];
        const filteredStorage = (storage || []).filter(item => !excludedItems.includes(item.Name));
        setStorageItemsList(filteredStorage);
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
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      // Fetch job title and employment status from linked rental application (if exists)
      let jobTitle = '';
      let employmentStatus = '';
      const rentalAppId = userData['Rental Application'];
      if (rentalAppId) {
        const { data: rentalAppData } = await supabase
          .from('rentalapplication')
          .select('"job title", "employment status"')
          .eq('id', rentalAppId)
          .single();

        if (rentalAppData) {
          // Use job title if available, otherwise use employment status as display value
          jobTitle = rentalAppData['job title'] || '';
          employmentStatus = rentalAppData['employment status'] || '';

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

      setProfileData({ ...userData, _jobTitle: jobTitle, _employmentStatus: employmentStatus, _rentalAppId: rentalAppId });

      // Initialize form data from profile
      // Database columns use Bubble.io naming conventions
      // Date of Birth is stored as timestamp, convert to YYYY-MM-DD for date input
      const dobTimestamp = userData['Date of Birth'];
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

      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        jobTitle,
        dateOfBirth,
        bio: userData.bio_text || '',
        needForSpace: userData.stated_need_for_space_text || '',
        specialNeeds: userData.stated_special_needs_text || '',
        selectedDays: dayNamesToIndices(userData['Recent Days Selected'] || []),
        transportationTypes,
        goodGuestReasons: userData['Reasons to Host me'] || [],
        storageItems: userData['About - Commonly Stored Items'] || []
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
    setLoadingListings(true);
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
            Name: listing.listing_title || 'Unnamed Listing',
            // Map location fields to match ListingsCard expectations
            'Borough/Region': listing.borough || '',
            hood: listing.hood || '',
            // Bedroom/bathroom counts (now returned by updated RPC)
            'Qty of Bedrooms': listing.bedrooms || 0,
            'Qty of Bathrooms': listing.bathrooms || 0,
            // Pricing fields - pass through for rental-type-aware display
            'Start Nightly Price': listing.min_nightly || 0,
            min_nightly: listing.min_nightly || 0,
            weekly_rate: listing.weekly_rate || 0,
            monthly_rate: listing.monthly_rate || 0,
            Complete: listing.is_listing_profile_complete,
            // Pass raw JSONB photo array - ListingsCard handles extraction
            listing_photo: listing.photos_with_urls_captions_and_sort_order_json || [],
            // Rental type for proper price label (Nightly/Weekly/Monthly)
            rental_type: listing.rental_type || 'Nightly',
            source: listing.source || 'listing'
          };
        });

      setHostListings(mappedListings);
    } catch (err) {
      console.error('[AccountProfile] Error fetching host listings:', err);
      // Non-blocking - just log and continue with empty listings
      setHostListings([]);
    } finally {
      setLoadingListings(false);
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
        setIsAuthenticated(hookIsAuthenticated);

        // Get logged-in user ID from the hook (Bubble _id)
        const validatedUserId = authUserId || null;
        setLoggedInUserId(validatedUserId);

        // Extract profile user ID from URL, or fall back to logged-in user's ID
        // This allows users to view their own profile at /account-profile without a userId param
        const urlUserId = getUserIdFromUrl();
        const targetUserId = urlUserId || validatedUserId;

        if (!targetUserId) {
          // No URL param AND not logged in - redirect to login or show error
          throw new Error('Please log in to view your profile, or provide a user ID in the URL');
        }

        setProfileUserId(targetUserId);

        // Fetch reference data
        await fetchReferenceData();

        // Fetch profile data
        const userData = await fetchProfileData(targetUserId);

        // If user is a host, fetch their listings
        if (userData) {
          const userType = userData['Type - User Signup'];
          if (isHost({ userType })) {
            await fetchHostListings(targetUserId);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing profile page:', err);
        setError(err.message);
        setLoading(false);
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
    if (profileData?.['Rental Application']) {
      setRentalApplicationStatus('submitted');
      setRentalApplicationProgress(100);
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
          setRentalApplicationStatus('in_progress');
          setRentalApplicationProgress(progress);
          return;
        }
      }
    } catch (e) {
      console.error('Error reading rental application draft:', e);
    }

    // Default: not started
    setRentalApplicationStatus('not_started');
    setRentalApplicationProgress(0);
  }, [isEditorView, isHostUser, profileData]);

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
      if (verifiedType !== 'email' || !isAuthenticated || !profileUserId) {
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
          .update({ 'is email confirmed': true })
          .eq('id', profileUserId);

        if (updateError) {
          console.error('[email-verification] Error updating verification status:', updateError);
          if (window.showToast) {
            window.showToast({ title: 'Error', content: 'Failed to update email verification status.', type: 'error' });
          }
          return;
        }

        // Refresh profile data to reflect new verification status
        await fetchProfileData(profileUserId);

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
    if (isAuthenticated && profileUserId) {
      handleEmailVerificationCallback();
    }
  }, [isAuthenticated, profileUserId, fetchProfileData]);

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
    if (loading || !isEditorView || isHostUser) return;

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
        setShowRentalWizardModal(true);
      }
    }, 100);
  }, [loading, isEditorView, isHostUser]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [formErrors]);

  /**
   * Handle day selection toggle
   */
  const handleDayToggle = useCallback((dayIndex) => {
    setFormData(prev => {
      const currentDays = prev.selectedDays;
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex].sort((a, b) => a - b);

      return { ...prev, selectedDays: newDays };
    });
    setIsDirty(true);
  }, []);

  /**
   * Handle chip selection toggle (for reasons and storage items)
   * AUTOSAVE: Immediately saves to database and shows toast notification
   *
   * @param {string} field - 'goodGuestReasons' or 'storageItems'
   * @param {string} id - The ID of the item being toggled
   */
  const handleChipToggle = useCallback(async (field, id) => {
    // Determine if we're adding or removing
    const currentItems = formData[field];
    const isRemoving = currentItems.includes(id);
    const newItems = isRemoving
      ? currentItems.filter(i => i !== id)
      : [...currentItems, id];

    // Update local state immediately for responsive UI
    setFormData(prev => ({
      ...prev,
      [field]: newItems
    }));
    setIsDirty(true);

    // Get the item name for the toast notification
    let itemName = '';
    if (field === 'goodGuestReasons') {
      const reason = goodGuestReasonsList.find(r => r.id === id);
      itemName = reason?.name || 'Reason';
    } else if (field === 'storageItems') {
      const item = storageItemsList.find(i => i.id === id);
      itemName = item?.Name || 'Item';
    }

    // Map field name to database column
    const dbColumn = field === 'goodGuestReasons'
      ? 'Reasons to Host me'
      : 'About - Commonly Stored Items';

    // Autosave to database
    if (!profileUserId) {
      console.error('[handleChipToggle] Cannot autosave: no user ID');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('user')
        .update({
          [dbColumn]: newItems,
          'Modified Date': new Date().toISOString()
        })
        .eq('id', profileUserId);

      if (updateError) {
        console.error('[handleChipToggle] Autosave error:', updateError);
        // Revert local state on error
        setFormData(prev => ({
          ...prev,
          [field]: currentItems
        }));
        if (window.showToast) {
          window.showToast({
            title: 'Save Failed',
            content: `Could not save "${itemName}". Please try again.`,
            type: 'error',
            duration: 3000
          });
        }
        return;
      }

      // Show success toast
      if (window.showToast) {
        const action = isRemoving ? 'Removed' : 'Added';
        window.showToast({
          title: `${action}: ${itemName}`,
          type: 'success',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('[handleChipToggle] Unexpected error:', err);
      // Revert local state on error
      setFormData(prev => ({
        ...prev,
        [field]: currentItems
      }));
      if (window.showToast) {
        window.showToast({
          title: 'Save Failed',
          content: 'An unexpected error occurred. Please try again.',
          type: 'error',
          duration: 3000
        });
      }
    }
  }, [formData, goodGuestReasonsList, storageItemsList, profileUserId]);

  /**
   * Handle transportation method toggle (multi-select)
   */
  const handleTransportToggle = useCallback((transportValue) => {
    setFormData(prev => {
      const currentTypes = prev.transportationTypes;
      const newTypes = currentTypes.includes(transportValue)
        ? currentTypes.filter(t => t !== transportValue)
        : [...currentTypes, transportValue];

      return { ...prev, transportationTypes: newTypes };
    });
    setIsDirty(true);
  }, []);

  /**
   * Validate form before save
   */
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Add more validations as needed

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Save profile changes
   */
  const handleSave = useCallback(async () => {
    if (!isEditorView || !profileUserId) {
      console.error('Cannot save: not in editor view or no user ID');
      return { success: false, error: 'Cannot save changes' };
    }

    if (!validateForm()) {
      if (window.showToast) {
        window.showToast({ title: 'Validation error', content: 'Please fix the errors before saving.', type: 'error' });
      }
      return { success: false, error: 'Please fix validation errors' };
    }

    setSaving(true);

    try {
      // Build the full name from first and last name
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;

      // Convert date of birth from YYYY-MM-DD to ISO timestamp for database
      // Only include if value exists to avoid overwriting with null
      const dateOfBirthISO = formData.dateOfBirth
        ? new Date(formData.dateOfBirth + 'T00:00:00Z').toISOString()
        : null;

      // Database columns use Bubble.io naming conventions
      // Note: 'Job Title' column does not exist - removed from update
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        'Date of Birth': dateOfBirthISO,
        bio_text: formData.bio.trim(),
        stated_need_for_space_text: formData.needForSpace.trim(),
        stated_special_needs_text: formData.specialNeeds.trim(),
        'Recent Days Selected': indicesToDayNames(formData.selectedDays),
        'transportation medium': formData.transportationTypes.length > 0
          ? JSON.stringify(formData.transportationTypes)
          : null, // Store as JSON string
        'Reasons to Host me': formData.goodGuestReasons,
        'About - Commonly Stored Items': formData.storageItems,
        'Modified Date': new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('user')
        .update(updateData)
        .eq('id', profileUserId);

      if (updateError) {
        console.error('[handleSave] Update error:', updateError);
        throw updateError;
      }

      // Save job title to rental application table (if user has one)
      const rentalAppId = profileData?._rentalAppId;
      if (rentalAppId && formData.jobTitle !== undefined) {
        const { error: rentalAppError } = await supabase
          .from('rentalapplication')
          .update({ 'job title': formData.jobTitle.trim() })
          .eq('id', rentalAppId);

        if (rentalAppError) {
          console.error('Error saving job title to rental application:', rentalAppError);
          // Don't throw - user data was saved successfully, job title is secondary
        }
      }

      // Refresh profile data
      await fetchProfileData(profileUserId);
      setIsDirty(false);
      setSaving(false);

      // Show success toast
      if (window.showToast) {
        window.showToast({ title: 'Profile saved!', content: 'Your changes have been saved successfully.', type: 'success' });
      }

      return { success: true };
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaving(false);

      // Show error toast
      if (window.showToast) {
        window.showToast({ title: 'Save failed', content: err.message || 'Please try again.', type: 'error' });
      }

      return { success: false, error: err.message };
    }
  }, [isEditorView, profileUserId, formData, validateForm, fetchProfileData]);

  /**
   * Toggle preview mode to show public view of own profile
   */
  const handlePreviewProfile = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  // ============================================================================
  // VERIFICATION HANDLERS
  // ============================================================================

  const handleVerifyEmail = useCallback(async () => {
    // Prevent duplicate requests
    if (isVerifyingEmail) return;

    // Get user's email from profile data
    const userEmail = profileData?.email;
    if (!userEmail) {
      console.error('[handleVerifyEmail] No email found in profile data');
      if (window.showToast) {
        window.showToast({ title: 'Error', content: 'Unable to verify email. Please refresh and try again.', type: 'error' });
      }
      return;
    }

    setIsVerifyingEmail(true);

    try {
      // Step 1: Fetch BCC email addresses from os_slack_channels
      const { data: channelData, error: channelError } = await supabase
        .schema('reference_table')
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
      const redirectTo = `${window.location.origin}/account-profile/${profileUserId}?verified=email`;

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
        setIsVerifyingEmail(false);
        return;
      }

      const magicLink = magicLinkData.data.action_link;
      const firstName = profileData?.first_name || 'there';

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
        setVerificationEmailSent(true);
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

    setIsVerifyingEmail(false);
  }, [isVerifyingEmail, profileData, profileUserId]);

  const handleVerifyPhone = useCallback(() => {
    setShowPhoneEditModal(true);
  }, []);

  const handleVerifyGovId = useCallback(() => {
    // Open identity verification modal
    setShowIdentityVerificationModal(true);
  }, []);

  /**
   * Handle identity verification submission
   * Called when user submits documents in the IdentityVerification modal
   */
  const handleIdentityVerificationSubmit = useCallback(async (verificationData) => {
    try {
      // Submit verification using the service
      await submitIdentityVerification({
        userId: profileUserId,
        documentType: verificationData.documentType,
        selfieFile: verificationData.selfieFile,
        frontIdFile: verificationData.frontIdFile,
        backIdFile: verificationData.backIdFile,
        onProgress: () => {},
      });

      // Refresh profile data to reflect new verification status
      await fetchProfileData(profileUserId);

      // The success toast is shown by the modal's logic hook
    } catch (error) {
      console.error('[Identity Verification] Error:', error);
      // Re-throw so the modal can show the error toast
      throw error;
    }
  }, [profileUserId, fetchProfileData]);

  /**
   * Handle closing the identity verification modal
   */
  const handleCloseIdentityVerificationModal = useCallback(() => {
    setShowIdentityVerificationModal(false);
  }, []);

  const handleConnectLinkedIn = useCallback(() => {
    // Trigger LinkedIn OAuth flow
  }, []);

  const handleEditPhone = useCallback(() => {
    setShowPhoneEditModal(true);
  }, []);

  // ============================================================================
  // SETTINGS HANDLERS
  // ============================================================================

  const handleOpenNotificationSettings = useCallback(() => {
    setShowNotificationModal(true);
  }, []);

  const handleCloseNotificationModal = useCallback(() => {
    setShowNotificationModal(false);
  }, []);

  const handleClosePhoneEditModal = useCallback(() => {
    setShowPhoneEditModal(false);
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
        setShowIdentityVerificationModal(true);
        break;
      case 'phone':
        // Open phone verification modal
        setShowPhoneEditModal(true);
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
        setShowRentalWizardModal(true);
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
    setShowRentalWizardModal(true);
  }, []);

  const handleCloseRentalWizard = useCallback(() => {
    setShowRentalWizardModal(false);
  }, []);

  const handleRentalWizardSuccess = useCallback(() => {
    // On successful submission, update status and close modal
    setRentalApplicationStatus('submitted');
    setRentalApplicationProgress(100);
    setShowRentalWizardModal(false);
    // Refresh profile data to reflect the submitted application
    if (profileUserId) {
      fetchProfileData(profileUserId);
    }
  }, [profileUserId, fetchProfileData]);

  // ============================================================================
  // PHOTO HANDLERS
  // ============================================================================

  const handleCoverPhotoChange = useCallback(async (_file) => {
    // TODO: Implement cover photo upload
  }, []);

  const handleAvatarChange = useCallback(async (file) => {
    if (!file || !profileUserId) {
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

    setSaving(true);

    try {
      // Get the Supabase Auth session to get the auth user ID for storage path
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const authUserId = session.user.id;

      // Generate unique filename with timestamp to avoid cache issues
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      const filePath = `${authUserId}/${fileName}`;

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
          'Modified Date': new Date().toISOString()
        })
        .eq('id', profileUserId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfileData(prev => ({
        ...prev,
        profile_photo_url: publicUrl
      }));

    } catch (err) {
      console.error('âŒ Error uploading avatar:', err);
      setError(err.message || 'Failed to upload profile photo');
    } finally {
      setSaving(false);
    }
  }, [profileUserId]);

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
    loading,
    saving,
    error,

    // View mode
    isEditorView,
    previewMode,

    // Profile data
    profileData,
    profileUserId,

    // Computed display values
    displayJobTitle,
    verifications,
    profileStrength,
    nextActions,
    showDateOfBirthField,

    // Form state
    formData,
    formErrors,
    isDirty,

    // Reference data
    goodGuestReasonsList,
    storageItemsList,
    transportationOptions,

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

    // Modal state
    showNotificationModal,
    handleCloseNotificationModal,
    showPhoneEditModal,
    handleClosePhoneEditModal,
    showIdentityVerificationModal,
    handleIdentityVerificationSubmit,
    handleCloseIdentityVerificationModal,

    // Host profile
    isHostUser,
    hostListings,
    loadingListings,
    handleListingClick,
    handleCreateListing,

    // Rental application (guest-only)
    rentalApplicationStatus,
    rentalApplicationProgress,
    showRentalWizardModal,
    handleOpenRentalWizard,
    handleCloseRentalWizard,
    handleRentalWizardSuccess,

    // Email verification state
    isVerifyingEmail,
    verificationEmailSent
  };
}
