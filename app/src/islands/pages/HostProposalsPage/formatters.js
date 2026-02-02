/**
 * Formatting utilities for Host Proposals Page
 */

/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date as M/D/YY
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Format a date as full date (e.g., "Mar 28, 2025")
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date with time (e.g., "Mar 28, 2025 12:00 pm")
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', '');
}

/**
 * Format time only (e.g., "2:00 pm")
 * @param {string} time - The time string
 * @returns {string} Formatted time string
 */
export function formatTime(time) {
  if (!time) return '';
  return time.toLowerCase();
}

/**
 * Format a date range
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(start, end) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/* ========================================
   NARRATIVE TEXT GENERATION
   For mobile proposal display
   ======================================== */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Convert nights array to day range text
 * @param {number[]} nights - Array of night indices (0-6)
 * @returns {Object} { dayRangeText, checkInDay, checkOutDay, isWeekdays, isWeekends, isEveryDay }
 */
function getNightRangeInfo(nights) {
  if (!nights || nights.length === 0) {
    return { dayRangeText: '', checkInDay: '', checkOutDay: '', isWeekdays: false, isWeekends: false, isEveryDay: false };
  }

  const sorted = [...nights].sort((a, b) => a - b);
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
    dayRangeText = sorted.map(d => DAY_NAMES[d]).join(', ');
  }

  // Check-in is first night, check-out is day after last night
  const checkInDay = DAY_NAMES[sorted[0]];
  const checkOutDay = DAY_NAMES[sorted[sorted.length - 1]];

  return { dayRangeText, checkInDay, checkOutDay, isWeekdays, isWeekends, isEveryDay };
}

/**
 * Generates narrative text for mobile proposal display
 * @param {Object} proposal - Normalized proposal object
 * @returns {Object} - { duration, schedule, pricing, guestContext }
 */
export function generateNarrativeText(proposal) {
  const guest = proposal?.guest || proposal?.user || {};
  const nightsSelected = proposal?.nights_selected || [];
  const durationWeeks = proposal?.duration_weeks || 0;
  // Use host compensation values ONLY - never guest prices
  const hostTotalCompensation = proposal?.['Total Compensation (proposal - host)'] || proposal?.total_compensation || 0;
  const nightsPerWeek = nightsSelected.length;
  // Calculate host nightly compensation from total (total / total_nights)
  const totalNights = nightsPerWeek * durationWeeks;
  const hostNightlyCompensation = totalNights > 0 ? Math.round((hostTotalCompensation / totalNights) * 100) / 100 : 0;
  const weeklyEarnings = hostNightlyCompensation * nightsPerWeek;

  // Format dates
  const startDate = proposal?.start_date ? new Date(proposal.start_date) : null;
  const endDate = proposal?.end_date ? new Date(proposal.end_date) : null;
  const startFormatted = startDate ? startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';
  const endFormatted = endDate ? endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // Get night range info
  const { dayRangeText, checkInDay, checkOutDay, isEveryDay } = getNightRangeInfo(nightsSelected);

  // Check if weekends are free
  const weekendsFree = !nightsSelected.includes(0) && !nightsSelected.includes(6);

  // Duration paragraph
  const weekWord = durationWeeks === 1 ? 'week' : 'weeks';
  const duration = {
    text: `This proposal is for a ${durationWeeks}-${weekWord} stay`,
    startDate: startFormatted,
    endDate: endFormatted
  };

  // Schedule paragraph
  let scheduleText;
  if (isEveryDay) {
    scheduleText = `The schedule is every day of each week. That's ${nightsPerWeek} nights per week.`;
  } else {
    const weekendSuffix = weekendsFree ? ', with weekends free' : '';
    scheduleText = `The schedule is ${dayRangeText} each week — checking in ${checkInDay} and out ${checkOutDay}. That's ${nightsPerWeek} nights per week${weekendSuffix}.`;
  }
  const schedule = { text: scheduleText, dayRangeText, nightsPerWeek };

  // Pricing paragraph - all values are host compensation (NOT guest prices)
  const pricing = {
    nightlyRate: hostNightlyCompensation,
    weeklyEarnings,
    total: hostTotalCompensation,
    weeks: durationWeeks
  };

  // Guest context
  const firstName = (guest.first_name || guest.full_name?.split(' ')[0] || guest.name?.split(' ')[0] || 'Guest');
  const bio = guest.bio || '';
  const idVerified = guest.id_verified;
  const workVerified = guest.work_verified;
  const reviewCount = guest.review_count || 0;

  // Build credential parts
  const credentialParts = [];
  if (idVerified && workVerified) {
    credentialParts.push('ID and work verified');
  } else if (idVerified) {
    credentialParts.push('ID verified');
  } else if (workVerified) {
    credentialParts.push('work verified');
  }
  if (reviewCount > 0) {
    credentialParts.push(`with ${reviewCount} positive review${reviewCount > 1 ? 's' : ''}`);
  }

  // Build guest context sentence (gender-neutral)
  let guestContextText = `${firstName}`;
  if (bio) {
    guestContextText += ` is a ${bio.toLowerCase()}`;
  }
  if (credentialParts.length > 0) {
    guestContextText += ` — ${credentialParts.join(', ')}`;
  }
  guestContextText += '.';

  const guestContext = {
    text: guestContextText,
    firstName,
    avatar: guest.avatar || guest.profilePhoto || null
  };

  return { duration, schedule, pricing, guestContext };
}
