/**
 * Display Utilities for Proposal Cards
 *
 * Pure functions for formatting proposal data for display.
 * Extracted from ProposalCard to enable reuse in ExpandableProposalCard.
 *
 * Day indices use JavaScript 0-based standard (0=Sun, 1=Mon, ..., 6=Sat)
 */

/**
 * Day abbreviations (0-indexed: 0=Sun, 1=Mon, ..., 6=Sat)
 */
export const DAY_ABBREVS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format currency for display
 * @param {number|string} amount - Amount to format
 * @param {boolean} [showCents=false] - Whether to show cents
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showCents = false) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === null || num === undefined) return '$0';

  if (showCents) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${Math.round(num).toLocaleString('en-US')}`;
}

/**
 * Format date for display
 * @param {string|Date} dateValue - Date to format
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(dateValue) {
  if (!dateValue) return 'TBD';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(date.getTime())) return 'TBD';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get short status label for collapsed card display
 * @param {string} status - Raw status string
 * @returns {string} Short status label
 */
export function getShortStatusLabel(status) {
  if (!status) return 'Pending';

  const normalizedStatus = status.trim();

  // Suggested proposals: distinguish guest action vs host action
  if (normalizedStatus.includes('Split Lease - Pending Confirmation')) return 'SL Suggestion';
  if (normalizedStatus.includes('Split Lease - Awaiting Rental Application')) return 'Confirm + Apply';

  // Check for Accepted/Drafting BEFORE Counteroffer to handle "Counteroffer Accepted" status
  if (normalizedStatus.includes('Accepted') || normalizedStatus.includes('Drafting')) return 'Accepted';
  if (normalizedStatus.includes('Counteroffer')) return 'Review Offer';
  if (normalizedStatus.includes('activated')) return 'Active';
  if (normalizedStatus.includes('Signed')) return 'Signed';
  if (normalizedStatus.includes('Awaiting Rental Application')) return 'Apply Now';
  if (normalizedStatus.includes('Rental Application Submitted')) return 'Under Review';
  if (normalizedStatus.includes('Host Review')) return 'Host Review';
  if (normalizedStatus.includes('Lease Documents Sent for Review')) return 'Review Docs';
  if (normalizedStatus.includes('Lease Documents Sent for Signatures')) return 'Sign Lease';
  if (normalizedStatus.includes('Cancelled')) return 'Cancelled';
  if (normalizedStatus.includes('Rejected')) return 'Declined';

  return 'Pending';
}

/**
 * Get status badge CSS class
 * @param {string} status - Raw status string
 * @returns {string} CSS class name
 */
export function getStatusBadgeClass(status) {
  if (!status) return '';

  const normalizedStatus = status.trim();

  // Action required: Suggested proposals pending guest confirmation
  if (normalizedStatus.includes('Split Lease - Pending Confirmation')) {
    return 'action-required';
  }

  // Success states (accepted, completed)
  if (normalizedStatus.includes('Accepted') ||
      normalizedStatus.includes('activated') ||
      normalizedStatus.includes('Signed')) {
    return 'success';
  }

  // Attention states (counteroffer, awaiting action)
  if (normalizedStatus.includes('Counteroffer') ||
      normalizedStatus.includes('Awaiting') ||
      normalizedStatus.includes('Review')) {
    return 'attention';
  }

  return '';
}

/**
 * Check if proposal is SL-suggested
 * @param {string} status - Raw status string
 * @returns {boolean}
 */
export function isSLSuggested(status) {
  if (!status) return false;
  const normalizedStatus = status.trim();
  return normalizedStatus.includes('Submitted for guest by Split Lease');
}

/**
 * Check if proposal is pending confirmation (not yet confirmed by guest)
 * @param {string} status - Raw status string
 * @returns {boolean}
 */
export function isPendingConfirmation(status) {
  if (!status) return false;
  const normalizedStatus = status.trim();
  return normalizedStatus.includes('Pending Confirmation');
}

/**
 * Check if proposal is cancelled or rejected
 * @param {string} status - Raw status string
 * @returns {boolean}
 */
export function isTerminalStatus(status) {
  if (!status) return false;
  const normalizedStatus = status.trim();
  return normalizedStatus.includes('Cancelled') || normalizedStatus.includes('Rejected');
}

/**
 * Extract listing photo URL with fallback
 * @param {Object} listing - Listing object
 * @returns {string|null} Photo URL or null
 */
export function getListingPhoto(listing) {
  if (!listing) return null;

  return listing.featuredPhotoUrl ||
    listing.photos_with_urls_captions_and_sort_order_json?.[0] ||
    null;
}

/**
 * Get host display name
 * @param {Object} host - Host object (Bubble.io format)
 * @returns {string} Display name
 */
export function getHostDisplayName(host) {
  if (!host) return 'Host';

  // User table uses first_name and last_name columns
  return host.first_name ||
    (host.first_name && host.last_name ? `${host.first_name} ${host.last_name}` : null) ||
    host.firstName ||
    host.name ||
    'Host';
}

/**
 * Get host profile photo URL
 * @param {Object} host - Host object (Bubble.io format)
 * @returns {string|null} Photo URL or null
 */
export function getHostProfilePhoto(host) {
  if (!host) return null;

  return host.profile_photo_url || null;
}

/**
 * Build meta text for collapsed card (e.g., "5 days · 12 weeks")
 * @param {Array} daysSelected - Array of selected day indices
 * @param {string|number} weeks - Number of weeks
 * @returns {string} Meta text
 */
export function buildMetaText(daysSelected, weeks) {
  const daysCount = Array.isArray(daysSelected) ? daysSelected.length : 0;
  if (weeks) {
    return `${daysCount} day${daysCount !== 1 ? 's' : ''} · ${weeks} weeks`;
  }
  return `${daysCount} day${daysCount !== 1 ? 's' : ''}`;
}

/**
 * Format weekly price display
 * @param {number} nightlyPrice - Price per night
 * @param {number} daysCount - Number of days per week
 * @returns {string} Formatted weekly price
 */
export function formatWeeklyPrice(nightlyPrice, daysCount) {
  if (!nightlyPrice || !daysCount) return '$0/wk';
  const weekly = nightlyPrice * daysCount;
  return `${formatCurrency(weekly)}/wk`;
}

/**
 * Get progress stage number from status
 * @param {string} status - Raw status string
 * @returns {number} Stage 1-6 or 0 if unknown
 */
export function getProgressStage(status) {
  if (!status) return 0;

  const normalizedStatus = status.trim();

  // Stage 1: Initial/Submitted
  if (normalizedStatus.includes('Awaiting Rental Application') ||
      normalizedStatus.includes('Pending') ||
      normalizedStatus.includes('Split Lease - Pending Confirmation')) {
    return 1;
  }

  // Stage 2: Application submitted
  if (normalizedStatus.includes('Rental Application Submitted')) {
    return 2;
  }

  // Stage 3: Under review / counteroffer
  if (normalizedStatus.includes('Host Review') ||
      normalizedStatus.includes('Counteroffer')) {
    return 3;
  }

  // Stage 4: Accepted / Documents
  if (normalizedStatus.includes('Accepted') ||
      normalizedStatus.includes('Drafting') ||
      normalizedStatus.includes('Documents Sent for Review') ||
      normalizedStatus.includes('Reviewing')) {
    return 4;
  }

  // Stage 5: Signing
  if (normalizedStatus.includes('Signatures')) {
    return 5;
  }

  // Stage 6: Payment / Activated
  if (normalizedStatus.includes('Payment') ||
      normalizedStatus.includes('activated')) {
    return 6;
  }

  return 0;
}

/**
 * Get progress stage labels for display
 * @returns {Array<string>} Array of stage labels
 */
export function getProgressStageLabels() {
  return [
    'Submitted',
    'Application',
    'Review',
    'Accepted',
    'Signing',
    'Active'
  ];
}

/* ========================================
   NARRATIVE TEXT GENERATION
   For mobile guest proposal display
   ======================================== */

const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Convert days array to day range text for narrative
 * @param {number[]} days - Array of day indices (0-6)
 * @returns {Object} { dayRangeText, checkInDay, checkOutDay, isWeekdays, isWeekends, isEveryDay }
 */
function getNightRangeInfo(days) {
  if (!days || days.length === 0) {
    return { dayRangeText: '', checkInDay: '', checkOutDay: '', isWeekdays: false, isWeekends: false, isEveryDay: false };
  }

  // Parse days if they're strings
  const parsed = days.map(d => {
    if (typeof d === 'number') return d;
    if (typeof d === 'string') {
      const num = parseInt(d, 10);
      if (!isNaN(num)) return num;
      const idx = DAY_NAMES_FULL.indexOf(d) !== -1 ? DAY_NAMES_FULL.indexOf(d) : DAY_NAMES.indexOf(d);
      return idx >= 0 ? idx : -1;
    }
    return -1;
  }).filter(d => d >= 0 && d <= 6);

  if (parsed.length === 0) {
    return { dayRangeText: '', checkInDay: '', checkOutDay: '', isWeekdays: false, isWeekends: false, isEveryDay: false };
  }

  const sorted = [...parsed].sort((a, b) => a - b);
  const isEveryDay = sorted.length === 7;
  const isWeekdays = sorted.length === 5 &&
    sorted.includes(1) && sorted.includes(2) && sorted.includes(3) &&
    sorted.includes(4) && sorted.includes(5) && !sorted.includes(0) && !sorted.includes(6);
  const isWeekends = sorted.length === 2 && sorted.includes(0) && sorted.includes(6);

  let dayRangeText;
  if (isEveryDay) {
    dayRangeText = 'every day';
  } else if (isWeekdays) {
    dayRangeText = 'Monday through Friday';
  } else if (isWeekends) {
    dayRangeText = 'weekends only';
  } else {
    dayRangeText = sorted.map(d => DAY_NAMES_FULL[d]).join(', ');
  }

  const checkInDay = DAY_NAMES_FULL[sorted[0]];
  const checkOutDay = DAY_NAMES_FULL[sorted[sorted.length - 1]];

  return { dayRangeText, checkInDay, checkOutDay, isWeekdays, isWeekends, isEveryDay };
}

/**
 * Generates narrative text for mobile guest proposal display
 * @param {Object} proposal - Proposal object with listing relation
 * @returns {Object} - { duration, schedule, pricing, listingContext }
 */
export function generateGuestNarrativeText(proposal) {
  const isCounteroffer = proposal?.['counter offer happened'];

  // Days selected (prefer counteroffer if exists)
  let daysSelected = isCounteroffer && proposal?.['host_counter_offer_days_selected']?.length > 0
    ? proposal['host_counter_offer_days_selected']
    : proposal?.['Days Selected'] || [];

  // Parse if string
  if (typeof daysSelected === 'string') {
    try { daysSelected = JSON.parse(daysSelected); } catch (e) { daysSelected = []; }
  }

  const nightsPerWeek = Array.isArray(daysSelected) ? daysSelected.length : 0;

  // Duration
  const durationWeeks = isCounteroffer && proposal?.['host_counter_offer_reservation_span_weeks']
    ? proposal['host_counter_offer_reservation_span_weeks']
    : proposal?.['Reservation Span (Weeks)'] || 0;

  // Pricing
  const nightlyRate = isCounteroffer && proposal?.['host_counter_offer_nightly_price'] != null
    ? proposal['host_counter_offer_nightly_price']
    : proposal?.['proposal nightly price'] || 0;

  const totalPrice = isCounteroffer && proposal?.['host_counter_offer_total_price'] != null
    ? proposal['host_counter_offer_total_price']
    : proposal?.['Total Price for Reservation (guest)'] || 0;

  const weeklyPrice = nightlyRate * nightsPerWeek;

  // Dates
  const moveInDate = isCounteroffer && proposal?.['host_counter_offer_move_in_date']
    ? proposal['host_counter_offer_move_in_date']
    : proposal?.['Move in range start'];

  // Format dates
  const startFormatted = moveInDate
    ? new Date(moveInDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '';

  // Calculate end date
  let endFormatted = '';
  if (moveInDate && durationWeeks) {
    const endDate = new Date(moveInDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));
    endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Get day range info
  const { dayRangeText, checkInDay, checkOutDay, isEveryDay } = getNightRangeInfo(daysSelected);
  const weekendsFree = Array.isArray(daysSelected) && !daysSelected.includes(0) && !daysSelected.includes(6);

  // Build narrative objects
  const weekWord = durationWeeks === 1 ? 'week' : 'weeks';

  const duration = {
    text: `This is a ${durationWeeks}-${weekWord} stay`,
    startDate: startFormatted,
    endDate: endFormatted
  };

  let scheduleText;
  if (isEveryDay) {
    scheduleText = `The schedule is every day of each week. That's ${nightsPerWeek} nights per week.`;
  } else if (dayRangeText) {
    const weekendSuffix = weekendsFree ? ', with weekends free' : '';
    scheduleText = `The schedule is ${dayRangeText} each week — checking in ${checkInDay} and out ${checkOutDay}. That's ${nightsPerWeek} nights per week${weekendSuffix}.`;
  } else {
    scheduleText = `That's ${nightsPerWeek} nights per week.`;
  }

  const schedule = { text: scheduleText, dayRangeText, nightsPerWeek };

  const pricing = {
    nightlyRate,
    weeklyPrice,
    total: totalPrice,
    weeks: durationWeeks,
    cleaningFee: proposal?.['cleaning fee'] || 0
  };

  // Listing context (what guest sees about the listing)
  const listing = proposal?.listing || {};
  const host = listing?.host || {};
  const listingName = listing?.Name || 'Listing';
  const location = [listing?.hoodName, listing?.boroughName].filter(Boolean).join(', ') || 'New York';
  const hostFirstName = host?.first_name || 'Host';
  const hostPhoto = host?.profile_photo_url || null;

  const listingContext = {
    listingName,
    location,
    hostFirstName,
    hostPhoto
  };

  return { duration, schedule, pricing, listingContext };
}
