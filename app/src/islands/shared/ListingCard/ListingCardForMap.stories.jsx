/**
 * ListingCardForMap Component Stories
 *
 * Compact listing card that appears above map pins with photo gallery and actions.
 */

import { useState } from 'react';
import ListingCardForMap from './ListingCardForMap';
import './ListingCardForMap.css';

// Mock listing data
const mockListing = {
  id: 'listing-123',
  title: 'Cozy Chelsea Studio',
  location: 'Chelsea, Manhattan',
  images: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  ],
  price: {
    starting: 125,
  },
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: 650,
  isNew: false,
};

const mockNewListing = {
  ...mockListing,
  id: 'listing-456',
  title: 'Sunny Williamsburg Loft',
  location: 'Williamsburg, Brooklyn',
  price: { starting: 175 },
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 950,
  isNew: true,
};

const mockStudioListing = {
  ...mockListing,
  id: 'listing-789',
  title: 'Modern FiDi Studio',
  location: 'Financial District, Manhattan',
  price: { starting: 95 },
  bedrooms: 0,
  bathrooms: 1,
  squareFeet: 400,
  images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
};

export default {
  title: 'ListingCard/ListingCardForMap',
  component: ListingCardForMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## ListingCardForMap Component

A compact listing card that appears above map pins in the GoogleMap component.

### Features
- Photo gallery with navigation arrows
- Pricing display (per night)
- Property features (bedrooms, bathrooms, sqft)
- "NEW" badge for new listings
- View Details and Message action buttons
- Favorite button integration
- Pointer arrow pointing to pin below
- Absolute positioning for map overlay

### Usage
\`\`\`jsx
import ListingCardForMap from 'islands/shared/ListingCard/ListingCardForMap';

<ListingCardForMap
  listing={listing}
  isVisible={true}
  position={{ x: 200, y: 100 }}
  onClose={() => setCardVisible(false)}
  onMessageClick={(listing) => handleMessage(listing)}
  isLoggedIn={true}
  isFavorited={false}
  onToggleFavorite={handleFavoriteToggle}
  userId="user-123"
  showMessageButton={true}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the card is visible',
    },
    isLoggedIn: {
      control: 'boolean',
      description: 'Whether user is logged in',
    },
    isFavorited: {
      control: 'boolean',
      description: 'Whether listing is favorited',
    },
    showMessageButton: {
      control: 'boolean',
      description: 'Whether to show message button',
    },
    onClose: { action: 'closed' },
    onMessageClick: { action: 'messageClicked' },
    onToggleFavorite: { action: 'favoriteToggled' },
    onRequireAuth: { action: 'authRequired' },
  },
  decorators: [
    (Story) => (
      <div style={{
        position: 'relative',
        width: '600px',
        height: '500px',
        backgroundColor: '#e5e7eb',
        borderRadius: '12px',
        overflow: 'visible',
      }}>
        <Story />
        {/* Simulated map pin */}
        <div style={{
          position: 'absolute',
          left: '300px',
          bottom: '50px',
          width: '60px',
          padding: '6px 12px',
          backgroundColor: '#5B21B6',
          color: 'white',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center',
          transform: 'translateX(-50%)',
        }}>
          $125
        </div>
      </div>
    ),
  ],
};

// Default
export const Default = {
  args: {
    listing: mockListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: true,
    isFavorited: false,
    showMessageButton: true,
    userId: 'user-123',
  },
};

// New Listing Badge
export const NewListing = {
  args: {
    listing: mockNewListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: true,
    isFavorited: false,
    showMessageButton: true,
    userId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Listing with "NEW" badge displayed on the image.',
      },
    },
  },
};

// Favorited State
export const Favorited = {
  args: {
    listing: mockListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: true,
    isFavorited: true,
    showMessageButton: true,
    userId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card showing favorited state with filled heart.',
      },
    },
  },
};

// Single Image (No Gallery Controls)
export const SingleImage = {
  args: {
    listing: mockStudioListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: true,
    isFavorited: false,
    showMessageButton: true,
    userId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Listing with only one image - gallery navigation is hidden.',
      },
    },
  },
};

// Without Message Button (Host View)
export const HostView = {
  args: {
    listing: mockListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: true,
    isFavorited: false,
    showMessageButton: false,
    userId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Host view - message button is hidden since hosts cannot message themselves.',
      },
    },
  },
};

// Not Logged In
export const NotLoggedIn = {
  args: {
    listing: mockListing,
    isVisible: true,
    position: { x: 300, y: 50 },
    isLoggedIn: false,
    isFavorited: false,
    showMessageButton: true,
    userId: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card when user is not logged in. Favorite button triggers auth prompt.',
      },
    },
  },
};

// Interactive Demo
const InteractiveDemoWrapper = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <>
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '12px 24px',
            backgroundColor: '#5B21B6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Show Card
        </button>
      )}
      <ListingCardForMap
        listing={mockListing}
        isVisible={isVisible}
        position={{ x: 300, y: 50 }}
        onClose={() => setIsVisible(false)}
        onMessageClick={(listing) => {
          console.log('Message clicked for:', listing.title);
          alert(`Message clicked for: ${listing.title}`);
        }}
        isLoggedIn={true}
        isFavorited={isFavorited}
        onToggleFavorite={(listingId, title, newState) => {
          setIsFavorited(newState);
          console.log(`${newState ? 'Added' : 'Removed'} favorite:`, title);
        }}
        userId="user-123"
        showMessageButton={true}
      />
    </>
  );
};

export const InteractiveDemo = {
  render: () => <InteractiveDemoWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - close the card and click button to reopen. Try favoriting!',
      },
    },
  },
};

// Different Position
export const LeftPositioned = {
  args: {
    listing: mockListing,
    isVisible: true,
    position: { x: 150, y: 50 },
    isLoggedIn: true,
    isFavorited: false,
    showMessageButton: true,
    userId: 'user-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card positioned on the left side of the map.',
      },
    },
  },
};
