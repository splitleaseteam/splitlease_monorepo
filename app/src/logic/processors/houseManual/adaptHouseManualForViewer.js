/**
 * House Manual Processor: adaptHouseManualForViewer
 *
 * Adapts raw house manual API response data for the viewer component.
 * Following the Processors pattern - pure data transformation, no side effects.
 *
 * @module logic/processors/houseManual/adaptHouseManualForViewer
 */

/**
 * Section category definitions for grouping
 */
const SECTION_CATEGORIES = {
  essentials: ['check_in', 'check_out', 'wifi', 'parking', 'keys', 'access'],
  living: ['kitchen', 'bathroom', 'bedroom', 'laundry', 'amenities', 'hvac', 'appliances'],
  local: ['neighborhood', 'restaurants', 'transportation', 'attractions', 'emergency'],
  other: [], // Catch-all for sections that don't match
};

/**
 * Adapts the raw API response for the house manual viewer.
 *
 * @param {Object} params
 * @param {Object} params.response - Raw API response with house manual data
 * @returns {Object} Adapted data with houseManual and visit objects
 */
export function adaptHouseManualForViewer({ response }) {
  if (!response) {
    return {
      houseManual: null,
      visit: null,
    };
  }

  const { house_manual, visit, listing } = response;

  // Adapt house manual sections
  const sections = (house_manual?.sections || []).map((section, index) => ({
    id: section.id || `section-${index}`,
    title: section.title || 'Untitled Section',
    content: section.content || '',
    category: section.category || 'other',
    order: section.order ?? index,
    icon: section.icon || null,
    images: section.images || [],
  }));

  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);

  return {
    houseManual: {
      id: house_manual?.id || null,
      title: house_manual?.title || listing?.title || 'House Manual',
      description: house_manual?.description || '',
      sections,
      listingId: listing?.id || null,
      listingTitle: listing?.title || '',
      listingAddress: listing?.address || '',
      hostName: listing?.host_name || '',
      hostPhone: listing?.host_phone || '',
      emergencyContact: house_manual?.emergency_contact || '',
    },
    visit: {
      id: visit?.id || null,
      guestId: visit?.guest_id || null,
      guestName: visit?.guest_name || '',
      checkInDate: visit?.check_in_date || null,
      checkOutDate: visit?.check_out_date || null,
      hasReviewed: Boolean(visit?.has_reviewed),
      linkSaw: Boolean(visit?.link_saw),
      status: visit?.status || 'unknown',
    },
  };
}

/**
 * Groups house manual sections by category for organized display.
 *
 * @param {Object} params
 * @param {Array} params.sections - Array of section objects
 * @returns {Object} Sections grouped by category
 */
export function groupSectionsByCategory({ sections }) {
  const grouped = {
    essentials: [],
    living: [],
    local: [],
    other: [],
  };

  if (!Array.isArray(sections)) {
    return grouped;
  }

  for (const section of sections) {
    const category = section.category?.toLowerCase() || 'other';

    // Find which group this category belongs to
    let assignedGroup = 'other';

    for (const [groupName, categories] of Object.entries(SECTION_CATEGORIES)) {
      if (categories.includes(category)) {
        assignedGroup = groupName;
        break;
      }
    }

    grouped[assignedGroup].push(section);
  }

  return grouped;
}

export default adaptHouseManualForViewer;
