/**
 * useSelfListingV2Logic - Custom hook for SelfListingPageV2
 *
 * Contains all form state, validation, navigation, pricing calculations,
 * address autocomplete, draft persistence, and submission logic.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../shared/Toast.jsx';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { createListing, getListingById } from '../../../lib/listing/index.js';
import { isGuest } from '../../../logic/rules/users/isGuest.js';
import { supabase } from '../../../lib/supabase.js';
import { NYC_BOUNDS, isValidServiceArea, getBoroughForZipCode, getBoroughFromCounty } from '../../../lib/nycZipCodes';
import { fetchInformationalTexts } from '../../../lib/informationalTextsFetcher.js';
import type { SelfListingFormData, NightId, SpaceType, AddressData } from './types';
import { DEFAULT_FORM_DATA, HOST_TYPES, WEEKLY_PATTERNS } from './types';

const STORAGE_KEY = 'selfListingV2Draft';
const LAST_HOST_TYPE_KEY = 'selfListingV2LastHostType';
const LAST_MARKET_STRATEGY_KEY = 'selfListingV2LastMarketStrategy';

// Platform pricing constants (must match priceCalculations.js)
const SITE_MARKUP = 0.17;
const UNUSED_NIGHTS_DISCOUNT_MULTIPLIER = 0.03;
const FULL_TIME_DISCOUNT = 0.13;

// Mapping of tooltip IDs to database tag titles with fallback content
const infoContentConfig: Record<string, { title: string; dbTag: string; fallbackContent: string; fallbackExpanded: string }> = {
  leaseStyleNightly: {
    title: 'Nightly Rental',
    dbTag: 'Nightly Rental',
    fallbackContent: 'Rent by the night with flexible availability. Perfect for hosts who want maximum control over their schedule.',
    fallbackExpanded: 'With nightly rentals, you can select specific nights of the week to make available. Guests book individual nights, and you receive payment for each night booked. This model offers the highest flexibility but requires more active management.',
  },
  leaseStyleWeekly: {
    title: 'Weekly Rental',
    dbTag: 'Weekly Rental',
    fallbackContent: 'Rent in weekly patterns with consistent schedules. Ideal for hosts with predictable routines.',
    fallbackExpanded: 'Weekly rentals allow you to set patterns like "one week on, one week off." This provides predictable income and less turnover than nightly rentals while maintaining some flexibility.',
  },
  leaseStyleMonthly: {
    title: 'Monthly Rental',
    dbTag: 'Monthly Rental',
    fallbackContent: 'Traditional month-to-month rental with stable, predictable income.',
    fallbackExpanded: 'With monthly rentals, you receive a fixed monthly rate regardless of how many nights your guest uses. Split Lease may sublease unused nights to maximize occupancy. This model offers the most predictable income with minimal management.',
  },
  baseNightlyRate: {
    title: 'Base Nightly Rate',
    dbTag: 'Base Nightly Rate',
    fallbackContent: 'This is your starting price per night. Consecutive nights automatically get discounted based on your Long Stay Discount setting.',
    fallbackExpanded: 'Set this to the rate you want for a single night stay. Multi-night bookings will be cheaper per night, encouraging longer stays and reducing your turnover effort.',
  },
  longStayDiscount: {
    title: 'Long Stay Discount',
    dbTag: 'Long Stay Discount',
    fallbackContent: 'The percentage discount applied to consecutive nights. Higher discounts encourage longer bookings.',
    fallbackExpanded: 'A 20% discount means each consecutive night gets progressively cheaper. For example, if your base rate is $100, night 2 might be $95, night 3 might be $90, and so on. This creates an incentive for guests to book longer stays.',
  },
  damageDeposit: {
    title: 'Damage Deposit',
    dbTag: 'Damage Deposit',
    fallbackContent: 'A refundable security deposit to protect your property against damages during the stay.',
    fallbackExpanded: 'The damage deposit is held during the guest\'s stay and returned within 7 days after checkout, minus any deductions for damages. We recommend a minimum of $500 for adequate protection.',
  },
  cleaningFee: {
    title: 'Maintenance Fee',
    dbTag: 'Regular Maintenance Fee',
    fallbackContent: 'A recurring monthly fee to cover cleaning and maintenance costs between guest stays.',
    fallbackExpanded: 'Typically, a fee for cleaning and maintenance is charged every four weeks. This includes DIY or housekeeper cleaning costs.',
  },
  desiredRent: {
    title: 'Desired Rent',
    dbTag: 'Desired Rent',
    fallbackContent: 'The total amount you want to receive for each rental period (weekly or monthly).',
    fallbackExpanded: 'This is your take-home amount before any Split Lease service fees. Set this based on your costs (mortgage, utilities, etc.) plus your desired profit margin.',
  },
  securityDeposit: {
    title: 'Security Deposit',
    dbTag: 'Security Deposit',
    fallbackContent: 'A refundable deposit held for the duration of the lease to cover potential damages.',
    fallbackExpanded: 'For weekly and monthly rentals, we recommend at least one week or month\'s rent as a security deposit. This is refunded at the end of the lease if no damages occur.',
  },
  utilities: {
    title: 'Utilities',
    dbTag: 'Utilities',
    fallbackContent: 'Specify whether utilities are included in the rent or charged separately.',
    fallbackExpanded: 'If utilities are not included, specify the estimated monthly cost so guests know what to expect. Common utilities include electricity, gas, water, internet, and trash removal.',
  },
  schedule: {
    title: 'Schedule Information',
    dbTag: 'Schedule Information',
    fallbackContent: 'This shows how many nights per week you\'ve selected to make available for guests.',
    fallbackExpanded: 'With Split Lease, you can select specific nights of the week to share your space. You keep access to your home on the nights you don\'t select. The more nights you offer, the more you can earn.',
  },
};

export function useSelfListingV2Logic() {
  // Auth hook
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuthenticatedUser();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SelfListingFormData>(DEFAULT_FORM_DATA);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [headerKey, setHeaderKey] = useState(0);

  // Refs for nightly calculator
  const nightlyPricesRef = useRef<number[]>([100, 95, 90, 86, 82, 78, 74]);

  // Address autocomplete state and refs
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);

  // Continue on Phone modal state
  const [showContinueOnPhoneModal, setShowContinueOnPhoneModal] = useState(false);
  const [continueOnPhoneLink, setContinueOnPhoneLink] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftListingId, setDraftListingId] = useState<string | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Validation errors for highlighting fields
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Informational text tooltip state
  const [activeInfoTooltip, setActiveInfoTooltip] = useState<string | null>(null);
  const [informationalTexts, setInformationalTexts] = useState<Record<string, { desktop?: string; mobile?: string; desktopPlus?: string; showMore?: boolean }>>({});

  // Refs for informational text tooltips
  const leaseStyleNightlyInfoRef = useRef<HTMLButtonElement>(null);
  const leaseStyleWeeklyInfoRef = useRef<HTMLButtonElement>(null);
  const leaseStyleMonthlyInfoRef = useRef<HTMLButtonElement>(null);
  const baseNightlyRateInfoRef = useRef<HTMLButtonElement>(null);
  const longStayDiscountInfoRef = useRef<HTMLButtonElement>(null);
  const damageDepositInfoRef = useRef<HTMLButtonElement>(null);
  const cleaningFeeInfoRef = useRef<HTMLButtonElement>(null);
  const desiredRentInfoRef = useRef<HTMLButtonElement>(null);
  const securityDepositInfoRef = useRef<HTMLButtonElement>(null);
  const utilitiesInfoRef = useRef<HTMLButtonElement>(null);
  const scheduleInfoRef = useRef<HTMLButtonElement>(null);

  // Access control state
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Helper to get informational text content (database-first with fallback)
  const getInfoContent = (tooltipId: string) => {
    const config = infoContentConfig[tooltipId];
    if (!config) return { title: '', content: '', expandedContent: '', showMore: false };

    const dbEntry = informationalTexts[config.dbTag];
    return {
      title: config.title,
      content: dbEntry?.desktop || config.fallbackContent,
      expandedContent: dbEntry?.desktopPlus || config.fallbackExpanded,
      showMore: dbEntry?.showMore ?? true,
    };
  };

  // Handle info tooltip toggle
  const handleInfoClick = (tooltipId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveInfoTooltip(activeInfoTooltip === tooltipId ? null : tooltipId);
  };

  // Fetch informational texts from database on mount
  useEffect(() => {
    const loadInformationalTexts = async () => {
      const texts = await fetchInformationalTexts();
      setInformationalTexts(texts);
    };
    loadInformationalTexts();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Access control: Redirect guest users to index page
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      console.log('[SelfListingPageV2] User is logged out - access allowed');
      setIsCheckingAccess(false);
      return;
    }

    const userType = authUser?.userType;
    console.log('[SelfListingPageV2] User type:', userType);

    if (isGuest({ userType })) {
      console.log('[SelfListingPageV2] Guest user detected - redirecting to index');
      window.location.href = '/';
      return;
    }

    console.log('[SelfListingPageV2] Host user - access allowed');
    setIsCheckingAccess(false);
  }, [authLoading, isAuthenticated, authUser]);

  // Load draft and step from localStorage
  useEffect(() => {
    const lastHostType = localStorage.getItem(LAST_HOST_TYPE_KEY);
    const lastMarketStrategy = localStorage.getItem(LAST_MARKET_STRATEGY_KEY);

    const prefillFromLastListing: Partial<SelfListingFormData> = {};

    if (lastHostType && ['resident', 'liveout', 'coliving', 'agent'].includes(lastHostType)) {
      prefillFromLastListing.hostType = lastHostType as SelfListingFormData['hostType'];
      console.log('[SelfListingPageV2] Prefilling hostType from last listing:', lastHostType);
    }
    if (lastMarketStrategy && ['private', 'public'].includes(lastMarketStrategy)) {
      prefillFromLastListing.marketStrategy = lastMarketStrategy as FormData['marketStrategy'];
      console.log('[SelfListingPageV2] Prefilling marketStrategy from last listing:', lastMarketStrategy);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          setFormData({
            ...DEFAULT_FORM_DATA,
            ...parsed.formData,
            ...prefillFromLastListing,
          });
          console.log('[SelfListingPageV2] Restored draft with LAST_* prefill applied');
        }
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 8) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    } else if (Object.keys(prefillFromLastListing).length > 0) {
      setFormData(prev => ({ ...prev, ...prefillFromLastListing }));
      console.log('[SelfListingPageV2] No draft, applied LAST_* prefill');
    }
  }, []);

  // Save draft and step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      formData,
      currentStep,
    }));
  }, [formData, currentStep]);

  // Sync auth hook state to local isLoggedIn + phone number
  useEffect(() => {
    if (authLoading) return;
    setIsLoggedIn(isAuthenticated);
    if (authUser?.phoneNumber) {
      setUserPhoneNumber(authUser.phoneNumber);
      setPhoneNumber(authUser.phoneNumber);
    }
  }, [authLoading, isAuthenticated, authUser]);

  // Handle URL parameters for continuing from another device or editing existing listing
  useEffect(() => {
    const loadDraftFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get('id');
      const draftId = urlParams.get('draft');
      const sessionId = urlParams.get('session');
      const step = urlParams.get('step');

      // Check for edit mode first (existing listing ID)
      if (listingId) {
        console.log('[SelfListingPageV2] Edit mode detected, loading listing:', listingId);
        setIsEditMode(true);
        setEditingListingId(listingId);

        try {
          const existingListing = await getListingById(listingId);

          if (existingListing) {
            localStorage.removeItem(STORAGE_KEY);

            setFormData(prev => ({
              ...prev,
              hostType: existingListing.host_type || prev.hostType,
            }));

            console.log('[SelfListingPageV2] Listing loaded, hostType pre-set to:', existingListing.host_type);
          } else {
            console.warn('[SelfListingPageV2] Listing not found:', listingId);
          }
        } catch (error) {
          console.error('[SelfListingPageV2] Failed to load listing for editing:', error);
        }

        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (draftId) {
        try {
          const { data, error } = await supabase
            .from('listing_drafts')
            .select('form_data, current_step')
            .eq('id', draftId)
            .maybeSingle();

          if (!error && data) {
            setFormData(data.form_data);
            if (data.form_data.nightlyPrices) {
              nightlyPricesRef.current = data.form_data.nightlyPrices;
            }
            setCurrentStep(data.current_step || 7);
            setDraftListingId(draftId);
          }
        } catch (err) {
          console.log('Could not load draft from database:', err);
        }
      } else if (sessionId) {
        const storedData = localStorage.getItem(`${STORAGE_KEY}_session_${sessionId}`);
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (parsed.formData) {
              setFormData(parsed.formData);
              if (parsed.formData.nightlyPrices) {
                nightlyPricesRef.current = parsed.formData.nightlyPrices;
              }
            }
            setCurrentStep(parsed.currentStep || 7);
            setDraftListingId(sessionId);
          } catch (err) {
            console.log('Could not parse localStorage draft:', err);
          }
        }
      }

      // If step parameter is provided, go to that step
      if (step) {
        const stepNum = parseInt(step, 10);
        if (stepNum >= 1 && stepNum <= 8) {
          setCurrentStep(stepNum);
        }
      }

      // Clear the URL parameters to avoid confusion on refresh
      if (draftId || sessionId) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    loadDraftFromUrl();
  }, []);

  /**
   * Calculate platform multiplier for a given night count
   */
  const getPlatformMultiplier = useCallback((nightsCount: number): number => {
    const unusedNights = 7 - nightsCount;
    const unusedDiscount = unusedNights * UNUSED_NIGHTS_DISCOUNT_MULTIPLIER;
    const fullTimeDiscount = nightsCount === 7 ? FULL_TIME_DISCOUNT : 0;
    return 1 + SITE_MARKUP - unusedDiscount - fullTimeDiscount;
  }, []);

  /**
   * Calculate host rates that produce desired guest prices after platform markup
   */
  const calculateNightlyPrices = useCallback(() => {
    const { nightlyBaseRate, nightlyDiscount } = formData;
    const N = 7;

    const desiredGuestPrices: number[] = [];
    for (let nights = 1; nights <= N; nights++) {
      const progressiveFactor = (nights - 1) / (N - 1);
      const nightDiscount = progressiveFactor * (nightlyDiscount / 100);
      const guestPrice = nightlyBaseRate * (1 - nightDiscount);
      desiredGuestPrices.push(guestPrice);
    }

    const hostRates: number[] = [];
    for (let nights = 1; nights <= N; nights++) {
      const multiplier = getPlatformMultiplier(nights);
      const hostRate = desiredGuestPrices[nights - 1] / multiplier;
      hostRates.push(Math.ceil(hostRate));
    }

    nightlyPricesRef.current = hostRates;

    const numNights = formData.selectedNights.length;
    let weeklyTotal = 0;
    for (let i = 0; i < numNights && i < hostRates.length; i++) {
      const guestPrice = hostRates[i] * getPlatformMultiplier(i + 1);
      weeklyTotal += Math.round(guestPrice);
    }

    setFormData(prev => ({
      ...prev,
      weeklyTotal,
      monthlyEstimate: weeklyTotal * 4.33,
    }));
  }, [formData.nightlyBaseRate, formData.nightlyDiscount, formData.selectedNights, getPlatformMultiplier]);

  // Recalculate prices when relevant values change
  useEffect(() => {
    if (formData.leaseStyle === 'nightly') {
      calculateNightlyPrices();
    }
  }, [formData.nightlyBaseRate, formData.nightlyDiscount, formData.selectedNights, formData.leaseStyle]);

  // Initialize Google Places autocomplete when on step 6
  useEffect(() => {
    if (currentStep !== 6) return;

    let retryCount = 0;
    const maxRetries = 50;

    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(initAutocomplete, 100);
        } else {
          setAddressError('Address autocomplete is unavailable. Please enter your address manually.');
        }
        return;
      }

      if (!addressInputRef.current) return;

      const nycBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(NYC_BOUNDS.south, NYC_BOUNDS.west),
        new window.google.maps.LatLng(NYC_BOUNDS.north, NYC_BOUNDS.east)
      );

      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          bounds: nycBounds,
          strictBounds: true,
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
        }
      );

      autocompleteRef.current = autocomplete;

      window.google.maps.event.addDomListener(addressInputRef.current, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.place_id || !place.geometry || !place.address_components) {
          setAddressError('Please select a valid address from the dropdown');
          setIsAddressValid(false);
          return;
        }

        let streetNumber = '';
        let streetName = '';
        let city = '';
        let state = '';
        let zip = '';
        let neighborhood = '';
        let county = '';

        place.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) streetName = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.short_name;
          if (types.includes('administrative_area_level_2')) county = component.long_name;
          if (types.includes('postal_code')) zip = component.long_name;
          if (types.includes('neighborhood') || types.includes('sublocality')) neighborhood = component.long_name;
        });

        if (!isValidServiceArea(zip, state, county)) {
          const boroughFromZip = zip ? getBoroughForZipCode(zip) : null;
          const boroughFromCounty = county ? getBoroughFromCounty(county) : null;

          let errorMsg: string;
          if (boroughFromZip) {
            errorMsg = `This address (zip: ${zip}) is outside our service area. We only accept listings in NYC and Hudson County, NJ.`;
          } else if (state === 'NJ' && county) {
            errorMsg = `This address is outside our service area. We only accept listings in Hudson County, NJ, not ${county}.`;
          } else if (boroughFromCounty) {
            errorMsg = `This address in ${boroughFromCounty} couldn't be validated. Please try selecting a more specific address.`;
          } else {
            errorMsg = `This address is outside our NYC / Hudson County service area.`;
          }

          console.warn('Address validation failed:', { zip, state, county, boroughFromZip, boroughFromCounty });
          setAddressError(errorMsg);
          setIsAddressValid(false);
          return;
        }

        const parsedAddress: AddressData = {
          fullAddress: place.formatted_address || '',
          number: streetNumber,
          street: streetName,
          city: city,
          state: state,
          zip: zip,
          neighborhood: neighborhood,
          latitude: place.geometry.location?.lat() || null,
          longitude: place.geometry.location?.lng() || null,
          validated: true
        };

        updateFormData({ address: parsedAddress });
        setAddressError(null);
        setIsAddressValid(true);
        setValidationErrors(prev => ({ ...prev, address: false }));
      });
    };

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [currentStep]);

  // Handle manual address input change
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsAddressValid(false);
    setAddressError(null);
    if (validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: false }));
    }
    updateFormData({
      address: {
        ...formData.address,
        fullAddress: value,
        validated: false
      }
    });
  };

  // Update form data
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle night selection change from HostScheduleSelector
  const handleNightSelectionChange = (nights: NightId[]) => {
    updateFormData({ selectedNights: nights });
    if (nights.length >= 2 && validationErrors.nightSelector) {
      setValidationErrors(prev => ({ ...prev, nightSelector: false }));
    }
  };

  // Get schedule text
  const getScheduleText = () => {
    const count = formData.selectedNights.length;
    const weekdayNights: NightId[] = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const isWeekdays = count === 4 && weekdayNights.every(n => formData.selectedNights.includes(n));

    if (count < 2) return { text: 'Select at least 2 nights', error: true };
    if (isWeekdays) return { text: 'Weekdays Only (You keep weekends!)', error: false };
    return { text: `${count} Nights / Week`, error: false };
  };

  // Determine next step based on lease style
  const getNextStep = (current: number): number => {
    if (current === 3) {
      return formData.leaseStyle === 'nightly' ? 4 : 5;
    }
    if (current === 4) {
      return 6;
    }
    return current + 1;
  };

  // Determine previous step based on lease style
  const getPrevStep = (current: number): number => {
    if (current === 6) {
      return formData.leaseStyle === 'nightly' ? 4 : 5;
    }
    if (current === 5) {
      return 3;
    }
    if (current === 4) {
      return 3;
    }
    return current - 1;
  };

  // Get display step number (for progress)
  const getDisplayStep = (actual: number): number => {
    if (formData.leaseStyle === 'nightly') {
      const map: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 6: 5, 7: 6, 8: 7 };
      return map[actual] || actual;
    } else {
      const map: Record<number, number> = { 1: 1, 2: 2, 3: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
      return map[actual] || actual;
    }
  };

  // Scroll to first error field
  const scrollToFirstError = useCallback((errorFieldId: string) => {
    const element = document.getElementById(errorFieldId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  }, []);

  // Validation
  const validateStep = (step: number): boolean => {
    setValidationErrors({});

    switch (step) {
      case 3:
        if (formData.leaseStyle === 'nightly' && formData.selectedNights.length < 2) {
          showToast('Please select at least 2 nights', 'error', 4000);
          setValidationErrors({ nightSelector: true });
          scrollToFirstError('nightSelector');
          return false;
        }
        if (formData.leaseStyle === 'monthly' && !formData.monthlyAgreement) {
          showToast('You must agree to the terms or select a different rental style.', 'error', 4000);
          setValidationErrors({ monthlyAgreement: true });
          scrollToFirstError('monthlyAgreement');
          return false;
        }
        return true;
      case 5:
        if (!formData.price || formData.price <= 0) {
          showToast('Please enter a price', 'error', 4000);
          setValidationErrors({ price: true });
          scrollToFirstError('price');
          return false;
        }
        return true;
      case 6:
        if (!formData.typeOfSpace) {
          showToast('Please select a type of space', 'error', 4000);
          setValidationErrors({ typeOfSpace: true });
          scrollToFirstError('typeOfSpace');
          return false;
        }
        if (!formData.address.fullAddress.trim()) {
          showToast('Please enter your address', 'error', 4000);
          setValidationErrors({ address: true });
          scrollToFirstError('address');
          return false;
        }
        if (!formData.address.validated) {
          showToast('Please select a valid address from the dropdown suggestions', 'error', 4000);
          setValidationErrors({ address: true });
          scrollToFirstError('address');
          return false;
        }
        return true;
      case 7:
        return true;
      default:
        return true;
    }
  };

  // Navigation
  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    const next = getNextStep(currentStep);
    if (next <= 8) {
      setCurrentStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    const prev = getPrevStep(currentStep);
    if (prev >= 1) {
      setCurrentStep(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Skip current step (for optional steps like Photos)
  const skipStep = () => {
    const next = getNextStep(currentStep);
    if (next <= 8) {
      setCurrentStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Save draft to Supabase draft_listings table and generate continue link
  const saveDraftAndGenerateLink = async () => {
    setIsSavingDraft(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const draftData = {
        user_id: user.id,
        form_data: {
          ...formData,
          nightlyPrices: nightlyPricesRef.current,
        },
        current_step: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let savedDraftId = draftListingId;

      if (draftListingId) {
        const { error } = await supabase
          .from('listing_drafts')
          .update({
            form_data: draftData.form_data,
            current_step: draftData.current_step,
            updated_at: draftData.updated_at,
          })
          .eq('id', draftListingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('listing_drafts')
          .insert(draftData)
          .select('id')
          .single();

        if (error) throw error;
        savedDraftId = data.id;
        setDraftListingId(savedDraftId);
      }

      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}?draft=${savedDraftId}&step=7`;
      setContinueOnPhoneLink(link);

      return link;
    } catch (error: any) {
      console.error('Failed to save draft listing:', error);

      if (error?.message?.includes('listing_drafts') || error?.code === '42P01') {
        console.log('Falling back to localStorage-based draft saving');
        const sessionId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const draftData = {
          formData: {
            ...formData,
            nightlyPrices: nightlyPricesRef.current,
          },
          currentStep: 7,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(`${STORAGE_KEY}_session_${sessionId}`, JSON.stringify(draftData));

        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?session=${sessionId}`;
        setContinueOnPhoneLink(link);
        setDraftListingId(sessionId);

        return link;
      }

      showToast('Failed to save progress. Please try again.', 'error', 4000);
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Continue on Phone button click
  const handleContinueOnPhone = async () => {
    if (!isLoggedIn) {
      showToast('Please log in to save your progress and continue on phone', 'info', 4000);
      setShowAuthModal(true);
      return;
    }
    setShowContinueOnPhoneModal(true);
    await saveDraftAndGenerateLink();
  };

  // Auth success handler
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setIsLoggedIn(true);
    setHeaderKey(prev => prev + 1);

    if (pendingSubmit) {
      setPendingSubmit(false);
      handleSubmit();
    }
  };

  // Map form data to listingService format
  const mapFormDataToListingService = (data: FormData) => {
    const allDaysAvailable = {
      sunday: true,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
    };

    const availableNights = data.leaseStyle === 'nightly'
      ? {
          sunday: data.selectedNights.includes('sunday'),
          monday: data.selectedNights.includes('monday'),
          tuesday: data.selectedNights.includes('tuesday'),
          wednesday: data.selectedNights.includes('wednesday'),
          thursday: data.selectedNights.includes('thursday'),
          friday: data.selectedNights.includes('friday'),
          saturday: data.selectedNights.includes('saturday'),
        }
      : allDaysAvailable;

    const nightlyPricing = data.leaseStyle === 'nightly' ? {
      oneNightPrice: data.nightlyBaseRate,
      discountPercentage: data.nightlyDiscount,
      decayRate: Math.pow(1 - data.nightlyDiscount / 100, 0.25),
      calculatedRates: {
        night1: nightlyPricesRef.current[0],
        night2: nightlyPricesRef.current[1],
        night3: nightlyPricesRef.current[2],
        night4: nightlyPricesRef.current[3],
        night5: nightlyPricesRef.current[4],
        night6: nightlyPricesRef.current[5],
        night7: nightlyPricesRef.current[6],
      },
    } : null;

    return {
      hostType: data.hostType,
      marketStrategy: data.marketStrategy,
      source_type: 'self-listing-v2',

      spaceSnapshot: {
        listingName: `${data.bedrooms} Bedroom ${data.typeOfSpace || 'Space'} in ${data.address.neighborhood || data.address.city || 'NYC'}`,
        typeOfSpace: data.typeOfSpace || 'Entire Place',
        bedrooms: parseInt(data.bedrooms) || 1,
        beds: parseInt(data.bedrooms) || 1,
        bathrooms: data.bathrooms === 'Shared' ? 1 : parseFloat(data.bathrooms) || 1,
        typeOfKitchen: 'Full Kitchen',
        typeOfParking: 'No Parking',
        address: {
          fullAddress: data.address.fullAddress,
          number: data.address.number,
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          neighborhood: data.address.neighborhood,
          latitude: data.address.latitude,
          longitude: data.address.longitude,
          validated: data.address.validated,
        },
      },

      features: {
        amenitiesInsideUnit: [],
        amenitiesOutsideUnit: [],
        descriptionOfLodging: `${data.bedrooms} bedroom ${(data.typeOfSpace || 'space').toLowerCase()} available for ${data.leaseStyle} rental.`,
        neighborhoodDescription: '',
      },

      leaseStyles: {
        rentalType: data.leaseStyle.charAt(0).toUpperCase() + data.leaseStyle.slice(1),
        availableNights: availableNights,
        weeklyPattern: data.leaseStyle === 'weekly' ? data.weeklyPattern : '',
        subsidyAgreement: data.leaseStyle === 'monthly' ? data.monthlyAgreement : false,
      },

      pricing: {
        damageDeposit: data.leaseStyle === 'nightly' ? 500 : data.securityDeposit,
        maintenanceFee: data.leaseStyle === 'nightly' ? 0 : data.cleaningFee,
        extraCharges: data.leaseStyle !== 'nightly' && !data.utilitiesIncluded ? data.utilityCost : null,
        weeklyCompensation: data.leaseStyle === 'weekly' ? data.price : null,
        monthlyCompensation: data.leaseStyle === 'monthly' ? data.price : null,
        nightlyPricing: nightlyPricing,
      },

      rules: {
        cancellationPolicy: 'Standard',
        preferredGender: 'No Preference',
        numberOfGuests: 2,
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        idealMinDuration: 2,
        idealMaxDuration: 52,
        houseRules: [],
        blockedDates: [],
      },

      photos: {
        photos: data.photos.map((p, i) => ({
          id: p.id,
          url: p.url,
          file: p.file,
          caption: '',
          displayOrder: i,
        })),
        minRequired: 0,
      },

      review: {
        safetyFeatures: [],
        squareFootage: null,
        firstDayAvailable: new Date().toISOString().split('T')[0],
        agreedToTerms: true,
        optionalNotes: '',
        previousReviewsLink: '',
      },

      isSubmitted: true,
      isDraft: false,
    };
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      console.log('[SelfListingPageV2] User not logged in, showing auth modal');
      setIsSubmitting(false);
      setShowAuthModal(true);
      setPendingSubmit(true);
      return;
    }

    console.log('[SelfListingPageV2] User is logged in, proceeding with submission');

    try {
      const listingData = mapFormDataToListingService(formData);
      const result = await createListing(listingData);

      console.log('[SelfListingPageV2] Listing created:', result);
      setCreatedListingId(result.id);
      setSubmitSuccess(true);
      localStorage.setItem(LAST_HOST_TYPE_KEY, formData.hostType);
      localStorage.setItem(LAST_MARKET_STRATEGY_KEY, formData.marketStrategy);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[SelfListingPageV2] Submit error:', error);
      alert('Failed to create listing. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Progress percentage
  const progressPercentage = (getDisplayStep(currentStep) / 7) * 100;

  return {
    // Auth state
    isAuthenticated,
    isLoggedIn,
    authLoading,
    isCheckingAccess,
    showAuthModal,
    setShowAuthModal,
    pendingSubmit,
    setPendingSubmit,
    handleAuthSuccess,
    headerKey,

    // Form state
    formData,
    updateFormData,
    setFormData,
    validationErrors,
    setValidationErrors,

    // Navigation
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    skipStep,
    getDisplayStep,
    progressPercentage,

    // Pricing
    nightlyPricesRef,
    getPlatformMultiplier,

    // Address
    addressInputRef,
    addressError,
    isAddressValid,
    handleAddressInputChange,

    // Night selection
    handleNightSelectionChange,
    getScheduleText,

    // Photos (handlers moved to step component)

    // Submit
    isSubmitting,
    submitSuccess,
    createdListingId,
    handleSubmit,

    // Continue on Phone
    showContinueOnPhoneModal,
    setShowContinueOnPhoneModal,
    continueOnPhoneLink,
    setContinueOnPhoneLink,
    phoneNumber,
    setPhoneNumber,
    userPhoneNumber,
    isSavingDraft,
    isMobile,
    handleContinueOnPhone,
    saveDraftAndGenerateLink,
    draftListingId,

    // Edit mode
    isEditMode,
    editingListingId,

    // Toast
    toasts,
    showToast,
    removeToast,

    // Informational text
    activeInfoTooltip,
    setActiveInfoTooltip,
    getInfoContent,
    handleInfoClick,

    // Info tooltip refs
    leaseStyleNightlyInfoRef,
    leaseStyleWeeklyInfoRef,
    leaseStyleMonthlyInfoRef,
    baseNightlyRateInfoRef,
    longStayDiscountInfoRef,
    damageDepositInfoRef,
    cleaningFeeInfoRef,
    desiredRentInfoRef,
    securityDepositInfoRef,
    utilitiesInfoRef,
    scheduleInfoRef,

    // Constants for step components
    WEEKLY_PATTERNS,
    HOST_TYPES,
  };
}

export type SelfListingV2Logic = ReturnType<typeof useSelfListingV2Logic>;
