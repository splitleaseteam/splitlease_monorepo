import { useState, useCallback, useRef } from 'react';
import { logger } from '../../../../lib/logger';

const INSIGHTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Safely parse a JSON string or return the value if already an array.
 * Duplicated from useListingData — kept local to avoid cross-module coupling.
 */
function safeParseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      logger.warn('Failed to parse JSON array:', e);
      return [];
    }
  }
  return [];
}

/**
 * Safely get photo count from a listing's photo field (handles string JSON, array, or null).
 */
function getPhotoCount(listing) {
  try {
    const photos = typeof listing.photos_with_urls_captions_and_sort_order_json === 'string'
      ? JSON.parse(listing.photos_with_urls_captions_and_sort_order_json)
      : listing.photos_with_urls_captions_and_sort_order_json;
    return Array.isArray(photos) ? photos.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Determine if a listing is underperforming based on age, proposal count, and clicks.
 */
export function isListingUnderperforming(listing, counts) {
  if (!listing || !counts) return false;
  const createdAt = listing.createdAt || listing.original_created_at;
  if (!createdAt) return false;
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > 30 && (counts.proposals || 0) < 3 && (listing.viewCount || 0) < 20;
}

/**
 * Fetch up to 20 comparable active listings in the same zip code.
 */
export async function fetchComparableListings(listingId, zipCode, supabaseClient) {
  if (!zipCode || !listingId) return [];
  const { data } = await supabaseClient
    .from('listing')
    .select(`
      id,
      listing_title,
      total_click_count,
      user_ids_who_favorited_json,
      monthly_rate_paid_to_host,
      weekly_rate_paid_to_host,
      bedroom_count,
      bathroom_count,
      photos_with_urls_captions_and_sort_order_json,
      in_unit_amenity_reference_ids_json,
      in_building_amenity_reference_ids_json,
      first_available_date,
      listing_description,
      original_created_at
    `)
    .neq('id', listingId)
    .eq('zip_code', zipCode)
    .eq('is_active', true)
    .order('total_click_count', { ascending: false })
    .limit(20);

  return data || [];
}

/**
 * Generate self-diagnostic insights that don't require comparables.
 */
function generateSelfDiagnosticInsights(listing, counts, calendarData) {
  const insights = [];

  // Availability: flag if > 50% of next 90 days blocked
  const totalFutureDays = 90;
  const blockedCount = calendarData?.blockedDates?.filter(d => new Date(d) > new Date()).length || 0;
  const blockedPercent = blockedCount / totalFutureDays;
  if (blockedPercent > 0.5) {
    insights.push({
      type: 'availability',
      message: `You have ${Math.round(blockedPercent * 100)}% of the next 90 days blocked. Consider opening more dates to increase proposals.`,
      priority: blockedPercent > 0.75 ? 'high' : 'medium',
      data: { actionLabel: 'Open calendar' },
    });
  }

  // Response time: nudge if pending proposals exist
  const staleProposals = counts?.proposalsByStatus?.pending || 0;
  if (staleProposals > 0) {
    insights.push({
      type: 'response',
      message: `You have ${staleProposals} pending proposal${staleProposals > 1 ? 's' : ''} awaiting your response. Quick responses lead to more bookings.`,
      priority: staleProposals > 2 ? 'high' : 'medium',
      data: { actionLabel: 'View proposals' },
    });
  }

  // Title quality: flag short titles
  const titleLength = listing?.title?.length || listing?.listing_title?.length || 0;
  if (titleLength > 0 && titleLength < 20) {
    insights.push({
      type: 'title',
      message: `Your listing title is only ${titleLength} characters. Descriptive titles with neighborhood and key features get more clicks.`,
      priority: 'medium',
      data: { actionLabel: 'Edit title' },
    });
  }

  return insights;
}

/**
 * Compare a listing against comparable listings and return actionable insights.
 * Includes self-diagnostic insights that don't require comparables.
 */
export function analyzeListingVsComparables(listing, comparables, counts, calendarData) {
  const selfDiagnosticInsights = generateSelfDiagnosticInsights(listing, counts, calendarData);

  // If no comparables, return self-diagnostic insights only
  if (!listing || !comparables || comparables.length === 0) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    selfDiagnosticInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return { insights: selfDiagnosticInsights, comparableStats: null };
  }

  const insights = [];

  // Pricing: bedroom-normalized comparison
  const listingBedrooms = listing.bedrooms || listing.bedroom_count || 0;
  const sameBedroom = comparables.filter(c => (c.bedroom_count || 0) === listingBedrooms);
  const comparisonSet = sameBedroom.length >= 3 ? sameBedroom : comparables;
  const bedroomLabel = sameBedroom.length >= 3
    ? `${listingBedrooms}BR listings in your area`
    : 'Listings in your area';

  const rates = comparisonSet.map(c => c.monthly_rate_paid_to_host).filter(r => r > 0).sort((a, b) => a - b);
  const medianRate = rates.length > 0 ? rates[Math.floor(rates.length / 2)] : 0;
  const listingRate = listing.monthlyHostRate || 0;

  if (medianRate > 0 && listingRate > 0) {
    const priceDiff = ((listingRate - medianRate) / medianRate) * 100;
    if (priceDiff > 20) {
      insights.push({ type: 'pricing', message: `Your monthly rate ($${listingRate}) is ${Math.round(priceDiff)}% above the ${bedroomLabel.toLowerCase()} median ($${medianRate}). ${bedroomLabel} average $${medianRate}/month`, priority: 'high' });
    } else if (priceDiff < -30) {
      insights.push({ type: 'pricing', message: `Your monthly rate ($${listingRate}) is ${Math.round(Math.abs(priceDiff))}% below the ${bedroomLabel.toLowerCase()} median ($${medianRate}). You may be leaving money on the table`, priority: 'medium' });
    }
  }

  // Photos: compare count against average (with safe parsing for comparables)
  const photoCounts = comparables.map(c => getPhotoCount(c));
  const avgPhotos = photoCounts.length > 0 ? photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length : 0;
  const listingPhotos = listing.photos?.length || 0;

  if (avgPhotos > 0 && listingPhotos < avgPhotos) {
    insights.push({ type: 'photos', message: `You have ${listingPhotos} photos. Top listings in your area average ${Math.round(avgPhotos)}`, priority: listingPhotos < avgPhotos * 0.5 ? 'high' : 'medium' });
  }

  // Description: flag short descriptions when median is long
  const descLengths = comparables.map(c => (c.listing_description || '').length).filter(l => l > 0).sort((a, b) => a - b);
  const medianDescLength = descLengths.length > 0 ? descLengths[Math.floor(descLengths.length / 2)] : 0;
  const listingDescLength = (listing.description || '').length;

  if (listingDescLength < 200 && medianDescLength > 400) {
    insights.push({ type: 'description', message: `Your description is ${listingDescLength} characters. Longer descriptions get more engagement`, priority: 'medium' });
  }

  // Amenities: find popular amenities missing from this listing
  const amenityCounts = {};
  comparables.forEach(c => {
    const ids = new Set([
      ...safeParseJsonArray(c.in_unit_amenity_reference_ids_json),
      ...safeParseJsonArray(c.in_building_amenity_reference_ids_json),
    ]);
    ids.forEach(id => { amenityCounts[id] = (amenityCounts[id] || 0) + 1; });
  });

  const listingAmenityIds = new Set([
    ...safeParseJsonArray(listing['Features - Amenities In-Unit']),
    ...safeParseJsonArray(listing['Features - Amenities In-Building']),
  ]);

  const topAmenities = Object.entries(amenityCounts)
    .map(([id, count]) => ({ name: id, percentOfListings: Math.round((count / comparables.length) * 100) }))
    .filter(a => a.percentOfListings > 50)
    .sort((a, b) => b.percentOfListings - a.percentOfListings);

  const missingPopular = topAmenities.filter(a => !listingAmenityIds.has(a.name));
  if (missingPopular.length > 0) {
    insights.push({ type: 'amenities', message: `${missingPopular.length} popular amenities in your area are missing from your listing`, priority: missingPopular.length > 3 ? 'high' : 'low' });
  }

  // Clicks: normalize by listing age, flag if bottom quartile
  const clicksPerDay = comparables.map(c => {
    const age = c.original_created_at ? (Date.now() - new Date(c.original_created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;
    return age > 0 ? (c.total_click_count || 0) / age : 0;
  }).filter(c => c > 0).sort((a, b) => a - b);

  if (clicksPerDay.length >= 4) {
    const q1 = clicksPerDay[Math.floor(clicksPerDay.length * 0.25)];
    const listingAge = listing.createdAt ? (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 1;
    const listingCpd = listingAge > 0 ? (listing.viewCount || 0) / listingAge : 0;
    if (listingCpd < q1) {
      insights.push({ type: 'engagement', message: 'Your listing gets fewer daily views than 75% of comparable listings', priority: 'high' });
    }
  }

  const avgClicks = comparables.reduce((sum, c) => sum + (c.total_click_count || 0), 0) / comparables.length;

  // Merge comparison insights with self-diagnostic insights
  const allInsights = [...insights, ...selfDiagnosticInsights];

  // Sort by priority: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    insights: allInsights,
    comparableStats: {
      medianMonthlyRate: medianRate,
      avgPhotos: Math.round(avgPhotos),
      avgClicks: Math.round(avgClicks),
      topAmenities,
    },
  };
}

/**
 * useInsightsData — Lazy-loaded competitive insights for a listing.
 *
 * Returns:
 *   - insights: analysis result (null until fetched)
 *   - isLoading: boolean
 *   - fetchInsights: trigger function (cached with 10-min TTL)
 *   - isUnderperforming: boolean flag based on age/proposals/views
 */
export function useInsightsData(listingId, listing, counts, calendarData, supabaseClient) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(null);
  const cacheTimeRef = useRef(null);

  const fetchInsights = useCallback(async () => {
    // Return cached result if within TTL
    if (cacheRef.current && cacheTimeRef.current && Date.now() - cacheTimeRef.current < INSIGHTS_CACHE_TTL) {
      return cacheRef.current;
    }
    if (!listing) return null;
    setIsLoading(true);
    try {
      let comparables = [];
      try {
        comparables = await fetchComparableListings(listingId, listing.location?.zipCode, supabaseClient);
      } catch (error) {
        logger.warn('[Insights] Failed to fetch comparables:', error);
        // Continue with self-diagnostic insights only
      }
      const analysis = analyzeListingVsComparables(listing, comparables, counts, calendarData);
      cacheRef.current = analysis;
      cacheTimeRef.current = Date.now();
      setInsights(analysis);
      return analysis;
    } finally {
      setIsLoading(false);
    }
  }, [listingId, listing, counts, calendarData, supabaseClient]);

  return {
    insights,
    isLoading,
    fetchInsights,
    isUnderperforming: isListingUnderperforming(listing, counts),
  };
}
