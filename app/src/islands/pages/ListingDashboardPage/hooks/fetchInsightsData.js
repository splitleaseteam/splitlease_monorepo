function safeParseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function isListingUnderperforming(listing, counts) {
  if (!listing || !counts) return false;

  const createdAt = listing.createdAt || listing.original_created_at;
  if (!createdAt) return false;

  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > 30 && (counts.proposals || 0) < 3 && (listing.viewCount || 0) < 20;
}

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

export function analyzeListingVsComparables(listing, comparables) {
  const empty = {
    insights: [],
    comparableStats: { medianMonthlyRate: 0, avgPhotos: 0, avgClicks: 0, topAmenities: [] },
  };

  if (!listing || !comparables?.length) return empty;

  const insights = [];

  const rates = comparables
    .map((c) => c.monthly_rate_paid_to_host)
    .filter((rate) => rate > 0)
    .sort((a, b) => a - b);
  const medianRate = rates.length > 0 ? rates[Math.floor(rates.length / 2)] : 0;
  const listingRate = listing.monthlyHostRate || 0;

  if (medianRate > 0 && listingRate > 0) {
    const priceDiff = ((listingRate - medianRate) / medianRate) * 100;
    if (priceDiff > 20) {
      insights.push({
        type: 'pricing',
        message: `Your monthly rate ($${listingRate}) is ${Math.round(priceDiff)}% above the area median ($${medianRate})`,
        priority: 'high',
      });
    } else if (priceDiff < -30) {
      insights.push({
        type: 'pricing',
        message: `Your monthly rate ($${listingRate}) is ${Math.round(Math.abs(priceDiff))}% below the area median ($${medianRate})`,
        priority: 'medium',
      });
    }
  }

  const photoCounts = comparables.map((c) => safeParseJsonArray(c.photos_with_urls_captions_and_sort_order_json).length);
  const avgPhotos = photoCounts.length > 0 ? photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length : 0;
  const listingPhotos = listing.photos?.length || 0;

  if (avgPhotos > 0 && listingPhotos < avgPhotos) {
    insights.push({
      type: 'photos',
      message: `You have ${listingPhotos} photos. Top listings in your area average ${Math.round(avgPhotos)}`,
      priority: listingPhotos < avgPhotos * 0.5 ? 'high' : 'medium',
    });
  }

  const descLengths = comparables
    .map((c) => (c.listing_description || '').length)
    .filter((length) => length > 0)
    .sort((a, b) => a - b);
  const medianDescLength = descLengths.length > 0 ? descLengths[Math.floor(descLengths.length / 2)] : 0;
  const listingDescLength = (listing.description || '').length;

  if (listingDescLength < 200 && medianDescLength > 400) {
    insights.push({
      type: 'description',
      message: `Your description is ${listingDescLength} characters. Longer descriptions get more engagement`,
      priority: 'medium',
    });
  }

  const amenityCounts = {};
  comparables.forEach((comparable) => {
    const ids = new Set([
      ...safeParseJsonArray(comparable.in_unit_amenity_reference_ids_json),
      ...safeParseJsonArray(comparable.in_building_amenity_reference_ids_json),
    ]);

    ids.forEach((id) => {
      amenityCounts[id] = (amenityCounts[id] || 0) + 1;
    });
  });

  const listingAmenityIds = new Set([
    ...safeParseJsonArray(listing['Features - Amenities In-Unit']),
    ...safeParseJsonArray(listing['Features - Amenities In-Building']),
  ]);

  const topAmenities = Object.entries(amenityCounts)
    .map(([id, count]) => ({
      name: id,
      percentOfListings: Math.round((count / comparables.length) * 100),
    }))
    .filter((amenity) => amenity.percentOfListings > 50)
    .sort((a, b) => b.percentOfListings - a.percentOfListings);

  const missingPopular = topAmenities.filter((amenity) => !listingAmenityIds.has(amenity.name));
  if (missingPopular.length > 0) {
    insights.push({
      type: 'amenities',
      message: `${missingPopular.length} popular amenities in your area are missing from your listing`,
      priority: missingPopular.length > 3 ? 'high' : 'low',
    });
  }

  const clicksPerDay = comparables
    .map((comparable) => {
      const age = comparable.original_created_at
        ? (Date.now() - new Date(comparable.original_created_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      return age > 0 ? (comparable.total_click_count || 0) / age : 0;
    })
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (clicksPerDay.length >= 4) {
    const q1 = clicksPerDay[Math.floor(clicksPerDay.length * 0.25)];
    const listingAge = listing.createdAt
      ? (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 1;
    const listingCpd = listingAge > 0 ? (listing.viewCount || 0) / listingAge : 0;

    if (listingCpd < q1) {
      insights.push({
        type: 'engagement',
        message: 'Your listing gets fewer daily views than 75% of comparable listings',
        priority: 'high',
      });
    }
  }

  const avgClicks = comparables.reduce((sum, comparable) => sum + (comparable.total_click_count || 0), 0) / comparables.length;

  return {
    insights,
    comparableStats: {
      medianMonthlyRate: medianRate,
      avgPhotos: Math.round(avgPhotos),
      avgClicks: Math.round(avgClicks),
      topAmenities,
    },
  };
}
