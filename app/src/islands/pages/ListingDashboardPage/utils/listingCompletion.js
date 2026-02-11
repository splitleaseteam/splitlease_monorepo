/**
 * Shared completion logic for the Listing Dashboard.
 *
 * Single source of truth for the 8-item completeness checks used by
 * PropertyInfoSection, ListingDetailsTab, and ListingDashboardContext.
 */

export const COMPLETION_CHECKS = [
  { key: 'title', label: 'Title', section: 'name', test: (l) => !!l.title && l.title !== 'Untitled' && l.title !== 'Untitled Listing' },
  { key: 'description', label: 'Description', section: 'description', test: (l) => !!l.description && l.description.length > 20 },
  { key: 'photos', label: 'Photos (3+)', section: 'photos', test: (l) => (l.photos?.length || 0) >= 3 },
  { key: 'pricing', label: 'Pricing', section: 'pricing', test: (l) => (l.monthlyHostRate || 0) > 0 || (l.weeklyHostRate || 0) > 0 },
  { key: 'availability', label: 'Availability', section: 'availability', test: (l) => !!l.earliestAvailableDate },
  { key: 'details', label: 'Details', section: 'details', test: (l) => !!(l.features?.bedrooms && l.features?.bathrooms) },
  { key: 'amenities', label: 'Amenities', section: 'amenities', test: (l) => (l.inUnitAmenities?.length || 0) + (l.buildingAmenities?.length || 0) > 0 },
  { key: 'rules', label: 'Rules', section: 'rules', test: (l) => (l.houseRules?.length || 0) > 0 },
];

/** Returns integer 0-100 representing listing completeness. */
export function getCompletionPct(listing) {
  if (!listing) return 0;
  const passed = COMPLETION_CHECKS.filter((c) => c.test(listing)).length;
  return Math.round((passed / COMPLETION_CHECKS.length) * 100);
}

/** Returns array of COMPLETION_CHECKS entries that are failing. */
export function getMissingFields(listing) {
  if (!listing) return COMPLETION_CHECKS;
  return COMPLETION_CHECKS.filter((c) => !c.test(listing));
}
