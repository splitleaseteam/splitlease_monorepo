/**
 * PropertyCard Component Stories
 *
 * Memoized listing card component used in SearchPage and FavoriteListingsPage.
 * Displays listing image carousel, details, pricing, and action buttons.
 */

import PropertyCard from './PropertyCard';

// Mock listing data
const mockListing = {
  id: 'listing-123',
  title: 'Cozy Chelsea Studio with City Views',
  location: 'Chelsea, Manhattan',
  type: 'Entire Place',
  maxGuests: 4,
  bedrooms: 1,
  bathrooms: 1,
  price: { starting: 125 },
  images: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  ],
  host: {
    name: 'Sarah Johnson',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    verified: true,
  },
  amenities: [
    { name: 'WiFi', icon: '📶' },
    { name: 'Kitchen', icon: '🍳' },
    { name: 'Washer', icon: '🧺' },
    { name: 'AC', icon: '❄️' },
    { name: 'Heating', icon: '🔥' },
    { name: 'TV', icon: '📺' },
  ],
  isNew: false,
  rentalType: 'Periodic',
};

const newListing = {
  ...mockListing,
  id: 'listing-456',
  title: 'Sunny Williamsburg Loft',
  location: 'Williamsburg, Brooklyn',
  isNew: true,
  price: { starting: 165 },
};

const studioListing = {
  ...mockListing,
  id: 'listing-789',
  title: 'Modern Studio in Financial District',
  location: 'FiDi, Manhattan',
  type: 'Private Room',
  bedrooms: 0,
  maxGuests: 2,
  price: { starting: 89 },
  host: {
    name: 'John Smith',
    image: null,
    verified: false,
  },
};

export default {
  title: 'ListingCard/PropertyCard',
  component: PropertyCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PropertyCard Component

A memoized listing card used throughout the application for displaying property listings.

### Features
- Image carousel with navigation
- Favorite button
- Location pill with map icon
- Property details (type, guests, bedrooms, bathrooms)
- Dynamic pricing based on nights selected
- Host profile section
- Action buttons (Message, Create Proposal)
- New listing badge
- Family-friendly tag for entire places

### Variants
- **search**: Full-featured card for search results
- **favorites**: Simplified card for favorites page

### Usage
\`\`\`jsx
import PropertyCard from 'islands/shared/ListingCard/PropertyCard';

<PropertyCard
  listing={listing}
  variant="search"
  selectedNightsCount={5}
  isLoggedIn={true}
  isFavorited={false}
  onOpenContactModal={(listing) => handleContact(listing)}
  onOpenCreateProposalModal={(listing) => handleProposal(listing)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['search', 'favorites'],
      description: 'Card variant for different contexts',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'search' },
      },
    },
    selectedNightsCount: {
      control: { type: 'range', min: 0, max: 7, step: 1 },
      description: 'Number of nights selected (affects price display)',
    },
    isLoggedIn: {
      control: 'boolean',
      description: 'Whether user is logged in',
    },
    isFavorited: {
      control: 'boolean',
      description: 'Whether listing is favorited',
    },
    showCreateProposalButton: {
      control: 'boolean',
      description: 'Whether to show Create Proposal button',
    },
    onLocationClick: { action: 'locationClicked' },
    onCardHover: { action: 'cardHovered' },
    onCardLeave: { action: 'cardLeft' },
    onOpenContactModal: { action: 'contactModalOpened' },
    onOpenInfoModal: { action: 'infoModalOpened' },
    onToggleFavorite: { action: 'favoriteToggled' },
    onRequireAuth: { action: 'authRequired' },
    onOpenCreateProposalModal: { action: 'createProposalModalOpened' },
  },
};

// Default Search Card
export const Default = {
  args: {
    listing: mockListing,
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: false,
    userId: 'user-123',
    showCreateProposalButton: true,
  },
};

// Favorites Variant
export const FavoritesVariant = {
  args: {
    listing: mockListing,
    variant: 'favorites',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: true,
    userId: 'user-123',
    showCreateProposalButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card variant used on the Favorite Listings page.',
      },
    },
  },
};

// New Listing
export const NewListing = {
  args: {
    listing: newListing,
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: false,
    showCreateProposalButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Listing with "New Listing" badge.',
      },
    },
  },
};

// Studio Listing
export const StudioListing = {
  args: {
    listing: studioListing,
    variant: 'search',
    selectedNightsCount: 3,
    isLoggedIn: false,
    isFavorited: false,
    showCreateProposalButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Studio listing (0 bedrooms) with unverified host and no photo.',
      },
    },
  },
};

// Favorited
export const Favorited = {
  args: {
    listing: mockListing,
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: true,
    userId: 'user-123',
    showCreateProposalButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Listing that has been favorited by the user.',
      },
    },
  },
};

// With Existing Proposal
export const WithExistingProposal = {
  args: {
    listing: mockListing,
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: false,
    showCreateProposalButton: true,
    proposalForListing: {
      id: 'proposal-123',
      status: 'Pending',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'When user already has a proposal for this listing, shows "View Proposal" button.',
      },
    },
  },
};

// Logged Out
export const LoggedOut = {
  args: {
    listing: mockListing,
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: false,
    isFavorited: false,
    showCreateProposalButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card when user is not logged in. Favorite and proposal buttons may require auth.',
      },
    },
  },
};

// Single Image
export const SingleImage = {
  args: {
    listing: {
      ...mockListing,
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    },
    variant: 'search',
    selectedNightsCount: 5,
    isLoggedIn: true,
    isFavorited: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Listing with only one image. Carousel navigation is hidden.',
      },
    },
  },
};

// Multiple Cards Grid
export const MultipleCardsGrid = {
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
      maxWidth: '1200px',
    }}>
      <PropertyCard
        listing={mockListing}
        variant="search"
        selectedNightsCount={5}
        isLoggedIn={true}
        showCreateProposalButton={true}
        onOpenContactModal={() => {}}
        onOpenInfoModal={() => {}}
        onToggleFavorite={() => {}}
        onOpenCreateProposalModal={() => {}}
      />
      <PropertyCard
        listing={newListing}
        variant="search"
        selectedNightsCount={5}
        isLoggedIn={true}
        isFavorited={true}
        showCreateProposalButton={true}
        onOpenContactModal={() => {}}
        onOpenInfoModal={() => {}}
        onToggleFavorite={() => {}}
        onOpenCreateProposalModal={() => {}}
      />
      <PropertyCard
        listing={studioListing}
        variant="search"
        selectedNightsCount={3}
        isLoggedIn={true}
        showCreateProposalButton={true}
        onOpenContactModal={() => {}}
        onOpenInfoModal={() => {}}
        onToggleFavorite={() => {}}
        onOpenCreateProposalModal={() => {}}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple property cards in a grid layout, similar to search results.',
      },
    },
  },
};
