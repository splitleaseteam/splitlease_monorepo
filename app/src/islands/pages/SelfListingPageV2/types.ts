/**
 * Shared types for SelfListingPageV2
 */

// Space type options
export type SpaceType = 'Private Room' | 'Entire Place' | 'Shared Room' | '';

// Address data structure
export interface AddressData {
  fullAddress: string;
  number: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  validated: boolean;
}

// Night ID type matching HostScheduleSelector
export type NightId = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export const NIGHT_IDS: NightId[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Types
export interface FormData {
  // Step 1: Host Type
  hostType: 'resident' | 'liveout' | 'coliving' | 'agent';

  // Step 2: Market Strategy
  marketStrategy: 'private' | 'public';

  // Step 3: Listing Strategy
  leaseStyle: 'nightly' | 'weekly' | 'monthly';
  selectedNights: NightId[]; // Array of night IDs like ['monday', 'tuesday', ...]
  weeklyPattern: string;
  monthlyAgreement: boolean;

  // Step 4: Nightly Pricing (only for nightly)
  nightlyBaseRate: number;
  nightlyDiscount: number;
  weeklyTotal: number;
  monthlyEstimate: number;

  // Step 5: Financials (for weekly/monthly)
  price: number;
  frequency: 'Month' | 'Week';
  utilitiesIncluded: boolean;
  utilityCost: number;
  securityDeposit: number;
  cleaningFee: number;

  // Step 6: Space & Time
  typeOfSpace: SpaceType;
  address: AddressData;
  bedrooms: string;
  bathrooms: string;

  // Step 7: Photos
  photos: Array<{ id: string; url: string; file?: File }>;
}

export const DEFAULT_FORM_DATA: FormData = {
  hostType: 'resident',
  marketStrategy: 'private',
  leaseStyle: 'nightly',
  selectedNights: ['monday', 'tuesday', 'wednesday', 'thursday'], // Mon-Thu default (keep weekends)
  weeklyPattern: '1on1off',
  monthlyAgreement: true,
  nightlyBaseRate: 100,
  nightlyDiscount: 20,
  weeklyTotal: 0,
  monthlyEstimate: 0,
  price: 2000,
  frequency: 'Month',
  utilitiesIncluded: true,
  utilityCost: 150,
  securityDeposit: 1000,
  cleaningFee: 150,
  typeOfSpace: '',
  address: {
    fullAddress: '',
    number: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    neighborhood: '',
    latitude: null,
    longitude: null,
    validated: false,
  },
  bedrooms: '1',
  bathrooms: '1',
  photos: [],
};

// Host Type Options
export const HOST_TYPES = [
  { id: 'resident', description: 'I live in the property part-time and rent out the nights I\'m away.' },
  { id: 'liveout', description: 'I own or rent the property but do not live there.' },
  { id: 'coliving', description: 'I live in the property and rent out a private room in my space.' },
  { id: 'agent', description: 'I manage listings for landlords.' },
];

// Weekly Pattern Options
export const WEEKLY_PATTERNS = [
  { value: '1on1off', label: 'One week on and one week off' },
  { value: '2on2off', label: 'Two weeks on and two weeks off' },
  { value: '1on3off', label: 'One week on and three weeks off' },
];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Info content configuration type
export interface InfoContentConfig {
  title: string;
  dbTag: string;
  fallbackContent: string;
  fallbackExpanded: string;
}

// Common step props
export interface StepNavigationProps {
  onNext: () => void;
  onBack: () => void;
}
