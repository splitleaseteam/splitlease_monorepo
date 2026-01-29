/**
 * FavoriteButton Component Stories
 *
 * Heart icon button for favoriting listings with immediate visual feedback.
 */

import { useState } from 'react';
import FavoriteButton from './FavoriteButton';
import './FavoriteButton.css';

export default {
  title: 'Shared/FavoriteButton',
  component: FavoriteButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## FavoriteButton Component

A reusable heart icon button for favoriting listings.

### Features
- Immediate visual feedback (no waiting for API)
- Syncs with parent state
- Animation on toggle
- Authentication check
- Multiple size options
- Overlay or inline positioning

### Usage
\`\`\`jsx
import FavoriteButton from 'islands/shared/FavoriteButton/FavoriteButton';

<FavoriteButton
  listingId="listing-123"
  userId="user-456"
  initialFavorited={false}
  onToggle={(newState, listingId) => handleToggle(listingId, newState)}
  onRequireAuth={() => showLoginModal()}
  size="medium"
  variant="overlay"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    initialFavorited: {
      control: 'boolean',
      description: 'Initial favorited state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    variant: {
      control: 'select',
      options: ['overlay', 'inline'],
      description: 'Positioning variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'overlay' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onToggle: {
      action: 'toggled',
    },
    onRequireAuth: {
      action: 'authRequired',
    },
  },
};

// Interactive wrapper for testing
const FavoriteButtonDemo = ({
  initialFavorited = false,
  userId = 'user-123',
  ...args
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);

  return (
    <div style={{
      position: 'relative',
      width: '200px',
      height: '150px',
      backgroundColor: '#e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <FavoriteButton
        listingId="listing-demo"
        userId={userId}
        initialFavorited={isFavorited}
        onToggle={(newState) => {
          setIsFavorited(newState);
          console.log('Favorite toggled:', newState);
        }}
        {...args}
      />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        fontSize: '12px',
        color: '#6b7280',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '4px 8px',
        borderRadius: '4px',
      }}>
        {isFavorited ? 'Favorited' : 'Not Favorited'}
      </div>
    </div>
  );
};

// Default - Not Favorited
export const Default = {
  render: (args) => <FavoriteButtonDemo {...args} />,
  args: {
    initialFavorited: false,
    size: 'medium',
    variant: 'overlay',
    disabled: false,
  },
};

// Favorited State
export const Favorited = {
  render: (args) => <FavoriteButtonDemo {...args} initialFavorited={true} />,
  args: {
    initialFavorited: true,
    size: 'medium',
    variant: 'overlay',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button in favorited state with filled heart.',
      },
    },
  },
};

// Small Size
export const Small = {
  render: (args) => <FavoriteButtonDemo {...args} />,
  args: {
    initialFavorited: false,
    size: 'small',
    variant: 'overlay',
    disabled: false,
  },
};

// Large Size
export const Large = {
  render: (args) => <FavoriteButtonDemo {...args} />,
  args: {
    initialFavorited: false,
    size: 'large',
    variant: 'overlay',
    disabled: false,
  },
};

// Inline Variant
export const Inline = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ color: '#374151', fontSize: '14px' }}>Add to favorites:</span>
      <FavoriteButton
        listingId="listing-inline"
        userId="user-123"
        variant="inline"
        size="medium"
        {...args}
      />
    </div>
  ),
  args: {
    initialFavorited: false,
    variant: 'inline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline variant for use within text flows or lists.',
      },
    },
  },
};

// Disabled
export const Disabled = {
  render: (args) => <FavoriteButtonDemo {...args} />,
  args: {
    initialFavorited: false,
    size: 'medium',
    variant: 'overlay',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - button cannot be clicked.',
      },
    },
  },
};

// No User ID (Auth Required)
export const RequiresAuth = {
  render: (args) => (
    <div style={{
      position: 'relative',
      width: '200px',
      height: '150px',
      backgroundColor: '#e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <FavoriteButton
        listingId="listing-auth"
        userId={null}
        initialFavorited={false}
        onRequireAuth={() => alert('Please log in to favorite listings!')}
        {...args}
      />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        fontSize: '11px',
        color: '#9ca3af',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '4px 8px',
        borderRadius: '4px',
      }}>
        Click to see auth prompt
      </div>
    </div>
  ),
  args: {
    size: 'medium',
    variant: 'overlay',
  },
  parameters: {
    docs: {
      description: {
        story: 'When no userId is provided, clicking triggers onRequireAuth callback.',
      },
    },
  },
};

// All Sizes Comparison
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
      {['small', 'medium', 'large'].map((size) => (
        <div key={size} style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            {size}
          </p>
          <div style={{
            position: 'relative',
            width: size === 'small' ? '60px' : size === 'medium' ? '80px' : '100px',
            height: size === 'small' ? '60px' : size === 'medium' ? '80px' : '100px',
            backgroundColor: '#e5e7eb',
            borderRadius: '8px',
          }}>
            <FavoriteButton
              listingId={`listing-${size}`}
              userId="user-123"
              initialFavorited={true}
              size={size}
              variant="overlay"
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all available sizes.',
      },
    },
  },
};

// On Listing Card
const OnListingCardWrapper = () => {
  const [favorited, setFavorited] = useState(false);

  return (
    <div style={{
      width: '320px',
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        position: 'relative',
        height: '200px',
        backgroundColor: '#d1d5db',
        backgroundImage: 'url(https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <FavoriteButton
          listingId="listing-card"
          userId="user-123"
          initialFavorited={favorited}
          onToggle={(newState) => setFavorited(newState)}
          size="medium"
          variant="overlay"
        />
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1f2937' }}>
          Cozy Chelsea Studio
        </h3>
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
          Chelsea, Manhattan
        </p>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#7c3aed' }}>
          $125 / night
        </p>
      </div>
    </div>
  );
};

export const OnListingCard = {
  render: () => <OnListingCardWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'FavoriteButton as it appears on a listing card.',
      },
    },
  },
};
