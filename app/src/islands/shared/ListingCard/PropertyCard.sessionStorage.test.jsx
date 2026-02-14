import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PropertyCard from './PropertyCard.jsx';

const listing = {
  id: 'listing-ss-1',
  title: 'Session storage test listing',
  location: 'Manhattan',
  images: ['https://example.com/photo.jpg'],
  pricingList: { startingNightlyPrice: 200, nightlyPrice: [200, 190, 180, 170, 160, 150, 140] },
  host: { name: 'Host', image: null, verified: false },
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
};

function renderCard() {
  return render(
    <PropertyCard
      listing={listing}
      onLocationClick={vi.fn()}
      onCardHover={vi.fn()}
      onCardLeave={vi.fn()}
      onOpenContactModal={vi.fn()}
      onOpenInfoModal={vi.fn()}
      onOpenDetailDrawer={vi.fn()}
      isLoggedIn={false}
      isFavorited={false}
      userId={null}
      onToggleFavorite={vi.fn()}
      onRequireAuth={vi.fn()}
      selectedNightsCount={4}
      variant="search"
    />
  );
}

describe('PropertyCard sessionStorage edge behavior', () => {
  it('does not crash when sessionStorage is unavailable', () => {
    const getItemSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('sessionStorage disabled');
    });

    expect(() => renderCard()).not.toThrow();
    getItemSpy.mockRestore();
  });

  it('handles 100+ viewed listing IDs without render failure', () => {
    const viewedIds = Array.from({ length: 120 }).map((_, i) => `listing-${i}`);
    viewedIds.push('listing-ss-1');

    const getItemSpy = vi
      .spyOn(window.sessionStorage.__proto__, 'getItem')
      .mockImplementation(() => JSON.stringify(viewedIds));

    const { container } = renderCard();
    const card = container.querySelector('.listing-card');

    expect(card).toBeTruthy();
    getItemSpy.mockRestore();
  });
});
