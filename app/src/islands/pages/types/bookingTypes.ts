/**
 * TypeScript Type Definitions for Booking System
 *
 * Converted from JSDoc typedefs to native TypeScript interfaces and types.
 * Provides full type safety and IntelliSense support.
 *
 * @module types/bookingTypes
 * @architecture Type Definitions
 */

import type { RefObject, Dispatch, SetStateAction } from 'react';

/**
 * Listing Object - Complete listing data structure
 */
export interface ListingObject {
  id: string;
  Name: string;
  Description: string;
  'Description - Neighborhood'?: string;
  Active: boolean;
  Approved: boolean;
  Complete: boolean;
  photos: PhotoObject[];
  coordinates: CoordinatesObject;
  amenitiesInUnit?: AmenityObject[];
  safetyFeatures?: FeatureObject[];
  houseRules?: RuleObject[];
  hostData: HostObject;
  neighborhoodName?: string;
  'Starting nightly price'?: string;
  'Features - Qty Bedrooms'?: number;
  'Features - Qty Bathrooms'?: number;
  'Features - Qty Beds'?: number;
  'Features - Qty Guests'?: number;
  'rental type'?: 'Nightly' | 'Weekly' | 'Monthly';
  'Weeks offered'?: string;
  'Minimum Nights'?: number;
  'Maximum Nights'?: number;
  ' First Available'?: string;
  'Last Available'?: string;
  'Dates - Blocked'?: string[];
  'Days Available (List of Days)'?: string[];
  'Days Not Available'?: string[];
}

/**
 * Photo Object - Listing photo data
 */
export interface PhotoObject {
  id: string;
  url: string;
  /** @deprecated Use url instead */
  Photo?: string;
  /** @deprecated Use url instead */
  'Photo (thumbnail)'?: string;
  Caption?: string;
  caption?: string;
  SortOrder?: number;
  toggleMainPhoto?: boolean;
}

/**
 * Coordinates Object - Geographic location
 */
export interface CoordinatesObject {
  lat: number;
  lng: number;
}

/**
 * Amenity Object - Available amenity
 */
export interface AmenityObject {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

/**
 * Feature Object - Safety or other feature
 */
export interface FeatureObject {
  id: string;
  name: string;
  icon?: string;
}

/**
 * Rule Object - House rule
 */
export interface RuleObject {
  id: string;
  text: string;
  icon?: string;
}

/**
 * Host Object - Host information
 */
export interface HostObject {
  userId: string;
  first_name: string;
  last_name?: string;
  Photo?: string;
  Verified?: boolean;
}

/**
 * Day Object - Represents a day of the week with selection state
 */
export interface Day {
  dayOfWeek: number; // 0-6, where 0=Sunday
  name: string; // e.g., "Monday"
  abbrev: string; // e.g., "Mon"
  selected: boolean;
}

/**
 * Price Breakdown - Calculated pricing information
 */
export interface PriceBreakdown {
  pricePerNight: number;
  pricePerFourWeeks: number;
  totalPrice: number;
  cleaningFee?: number;
  damageDeposit?: number;
  grandTotal?: number;
  valid: boolean;
}

/**
 * Validation Result - Schedule validation output
 */
export interface ValidationResult {
  hasErrors: boolean;
  errors: string[];
  warnings?: string[];
  showTutorial?: boolean;
  nightsCount?: number;
  isContiguous?: boolean;
}

/**
 * ZAT Configuration - Price adjustment multipliers
 */
export interface ZatConfigObject {
  priceMultipliers: {
    2: number;
    3: number;
    4: number;
    5: number;
    7: number;
  };
}

/**
 * User Object - User profile data
 */
export interface UserObject {
  userId: string;
  aboutMe?: string;
  needForSpace?: string;
  specialNeeds?: string;
  favoritedListings?: string[];
}

/**
 * Proposal Object - Existing proposal data
 */
export interface ProposalObject {
  id: string;
  Guest: string;
  Listing: string;
  Status?: string;
  'Created Date'?: string;
}

/**
 * Pricing Details - Pricing information for proposal
 */
export interface PricingDetails {
  pricePerNight: number;
  pricePerFourWeeks: number;
  totalPrice: number;
}

/**
 * Proposal Details - Additional proposal information
 */
export interface ProposalDetails {
  needForSpace: string;
  aboutMe: string;
  specialNeeds?: string;
  moveInRangeText?: string;
}

/**
 * Proposal Payload - Complete proposal submission data
 */
export interface ProposalPayload {
  guestId: string; // JWT-derived, NEVER from user input
  listingId: string;
  moveInDate: string;
  daysSelectedObjects: Day[];
  reservationSpanWeeks: number;
  pricing: PricingDetails;
  details: ProposalDetails;
}

/**
 * Informational Text - Help tooltip content
 */
export interface InformationalText {
  id: string;
  title: string;
  desktop: string;
  mobile: string;
  desktopPlus?: string;
  showMore?: boolean;
}

/**
 * Validation Rule Function Type
 */
export type ValidationRule = (
  selectedDays: Day[],
  listing: ListingObject,
  context: Record<string, any>
) => { valid: boolean; error?: string };

/**
 * Hook Options - Configuration for useViewSplitLeaseLogic hook
 */
export interface UseViewSplitLeaseLogicOptions {
  mode?: 'view' | 'preview';
  listingId?: string;
  forceStrictMode?: boolean;
  customValidationRules?: ValidationRule[];
}

/**
 * Hook Return Type - Complete return type for useViewSplitLeaseLogic
 */
export interface UseViewSplitLeaseLogicReturn {
  // Loading & Data
  loading: boolean;
  error: string | null;
  listing: ListingObject | null;
  zatConfig: ZatConfigObject | null;
  informationalTexts: Record<string, InformationalText>;

  // Auth & User
  isAuthenticated: boolean;
  authUserId: string | null;
  loggedInUserData: UserObject | null;
  isFavorited: boolean;
  existingProposalForListing: ProposalObject | null;

  // Booking State
  selectedDayObjects: Day[];
  moveInDate: string | null;
  reservationSpan: number;
  strictMode: boolean;

  // Computed Values
  minMoveInDate: string;
  priceBreakdown: PriceBreakdown | null;
  validationErrors: ValidationResult;
  isBookingValid: boolean;
  formattedPrice: string;
  formattedStartingPrice: string;

  // Modals
  isProposalModalOpen: boolean;
  showContactHostModal: boolean;
  showAuthModal: boolean;
  showPhotoModal: boolean;
  showSuccessModal: boolean;
  currentPhotoIndex: number;
  successProposalId: string | null;
  isSubmittingProposal: boolean;

  // UI State
  isMobile: boolean;
  shouldLoadMap: boolean;
  mapRef: RefObject<any>;
  hasAutoZoomedRef: RefObject<boolean>;

  // Handlers: Schedule
  handleScheduleChange: (dayObjects: Day[]) => void;
  handleMoveInDateChange: (newDate: string) => void;
  handleReservationSpanChange: (newSpan: number) => void;

  // Handlers: Modals
  handleOpenContactModal: () => Promise<void>;
  handleCloseContactModal: () => void;
  handleOpenProposalModal: () => void;
  handleCloseProposalModal: () => void;
  handlePhotoClick: (index: number) => void;
  handleClosePhotoModal: () => void;
  handleCloseSuccessModal: () => void;

  // Handlers: Actions
  handleSubmitProposal: (proposalData: any) => Promise<{ success: boolean; proposalId?: string }>;
  handleAuthSuccess: () => Promise<void>;
  handleToggleFavorite: () => Promise<void>;
  handleLoadMap: () => void;

  // Setters
  setShowAuthModal: Dispatch<SetStateAction<boolean>>;
  setStrictMode: Dispatch<SetStateAction<boolean>>;
  setShouldLoadMap: Dispatch<SetStateAction<boolean>>;
}

/**
 * Component Props Types
 */

export interface PhotoGalleryProps {
  photos: PhotoObject[];
  listingName: string;
  onPhotoClick: (index: number) => void;
  currentIndex: number;
  isModalOpen: boolean;
  onCloseModal: () => void;
  isMobile: boolean;
}

export interface BookingWidgetProps {
  listing: ListingObject;
  selectedDays: Day[];
  moveInDate: string | null;
  reservationSpan: number;
  priceBreakdown: PriceBreakdown | null;
  minMoveInDate: string;
  validationErrors: ValidationResult;
  isValid: boolean;
  formattedPrice: string;
  formattedStartingPrice: string;
  existingProposal: ProposalObject | null;
  onScheduleChange: (dayObjects: Day[]) => void;
  onMoveInDateChange: (date: string) => void;
  onReservationSpanChange: (span: number) => void;
  onSubmit: () => void;
}

export interface ListingHeaderProps {
  listing: ListingObject;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onLocationClick: () => void;
  isAuthenticated: boolean;
  userId?: string | null;
  onRequireAuth?: () => void;
}

export interface DescriptionSectionProps {
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface AmenitiesGridProps {
  amenities?: AmenityObject[];
  safetyFeatures?: FeatureObject[];
  isExpanded: boolean;
  onToggle: () => void;
}

export interface MapSectionProps {
  coordinates: CoordinatesObject;
  listingName: string;
  neighborhood?: string;
  shouldLoad: boolean;
  onLoadMap: () => void;
  mapRef: RefObject<any>;
}

export interface HostInfoCardProps {
  host: HostObject;
  onContactClick: () => void;
  isAuthenticated: boolean;
}
