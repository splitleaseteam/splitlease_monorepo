import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ListingDetailDrawer from './ListingDetailDrawer.jsx';

const baseListing = {
  id: 'listing-1',
  title: 'A sample listing title for edge case tests',
  location: 'SoHo, Manhattan',
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  images: ['https://example.com/a.jpg'],
  host: { name: 'Host Name', image: null, verified: true },
  listingDescription: 'Sample description',
  unitAmenities: [],
  buildingAmenities: [],
  houseRules: [],
  safetyFeatures: [],
};

function renderDrawer(listingOverride = {}) {
  return render(
    <ListingDetailDrawer
      isOpen={true}
      listing={{ ...baseListing, ...listingOverride }}
      onClose={vi.fn()}
      onOpenContactModal={vi.fn()}
      onOpenCreateProposalModal={vi.fn()}
      showCreateProposalButton={false}
      proposalsByListingId={new Map()}
      selectedNightsCount={4}
      isLoggedIn={false}
      favoritedListingIds={new Set()}
      onToggleFavorite={vi.fn()}
      userId={null}
      onRequireAuth={vi.fn()}
    />
  );
}

describe('ListingDetailDrawer edge cases', () => {
  it('renders a placeholder when listing has no photos', () => {
    renderDrawer({ images: [] });
    expect(screen.getByText('No photos available')).toBeInTheDocument();
  });

  it('hides description section when description is null', () => {
    renderDrawer({ listingDescription: null });
    expect(screen.queryByText('About this space')).not.toBeInTheDocument();
  });

  it('hides amenities section when amenities arrays are empty', () => {
    renderDrawer({ unitAmenities: [], buildingAmenities: [] });
    expect(screen.queryByText('Amenities')).not.toBeInTheDocument();
  });

  it('shows all amenities when unit and building amenities are present', () => {
    renderDrawer({
      unitAmenities: Array.from({ length: 12 }).map((_, i) => ({ name: `Unit Amenity ${i + 1}` })),
      buildingAmenities: Array.from({ length: 12 }).map((_, i) => ({ name: `Building Amenity ${i + 1}` })),
    });

    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('Unit Amenity 1')).toBeInTheDocument();
    expect(screen.getByText('Building Amenity 12')).toBeInTheDocument();
  });
});
