export function getProposalDemandDates(recentProposals) {
  if (!recentProposals?.length) return new Map();

  const demandMap = new Map();
  recentProposals.forEach((proposal) => {
    if (proposal.move_in_range_start_date) {
      const dateKey = proposal.move_in_range_start_date.substring(0, 10);
      demandMap.set(dateKey, (demandMap.get(dateKey) || 0) + 1);
    }
  });

  return demandMap;
}

export function getDailyPricingForCalendar(listing) {
  if (!listing) return null;

  const minNights = listing.nightsPerWeekMin || 2;
  const baseNightlyRate = listing.pricing?.[minNights] || 0;

  if (baseNightlyRate > 0) {
    return {
      type: 'nightly',
      perNight: baseNightlyRate,
      tieredRates: listing.pricing,
    };
  }

  if (listing.weeklyHostRate > 0) {
    return { type: 'weekly', perNight: Math.round(listing.weeklyHostRate / 7) };
  }

  if (listing.monthlyHostRate > 0) {
    return { type: 'monthly', perNight: Math.round(listing.monthlyHostRate / 30) };
  }

  return null;
}
