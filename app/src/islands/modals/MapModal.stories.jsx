/**
 * MapModal Component Stories
 *
 * Modal overlay displaying listing location with address and Google Maps link.
 * Shows a placeholder for future Google Maps integration.
 */
import MapModal from './MapModal';

export default {
  title: 'Modals/MapModal',
  component: MapModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## MapModal Component

A modal displaying listing location information with a decorative placeholder
for the interactive map. Includes address details and a link to open in Google Maps.

### Features

- Displays listing name and neighborhood/borough
- Shows full address with copy capability
- "Open in Google Maps" external link
- Responsive design for mobile
- Click outside or X button to close

### Usage

\`\`\`jsx
import MapModal from 'islands/modals/MapModal';

<MapModal
  listing={{
    listing_title: 'Cozy Studio in Brooklyn',
    address_with_lat_lng_json: '123 Example St, Brooklyn, NY 11201',
    primary_neighborhood_reference_id: 'Williamsburg',
    borough: 'Brooklyn',
  }}
  onClose={() => setShowMap(false)}
/>
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    listing: {
      description: 'Listing object with location properties',
      table: {
        type: { summary: 'object' },
      },
    },
    address: {
      control: 'text',
      description: 'Override address (optional, falls back to listing address)',
    },
    onClose: {
      action: 'closed',
      description: 'Handler called when modal is closed',
    },
  },
};

// Default with full listing data
export const Default = {
  args: {
    listing: {
      listing_title: 'Sunny 1BR in Williamsburg',
      address_with_lat_lng_json: '456 Bedford Ave, Brooklyn, NY 11211',
      primary_neighborhood_reference_id: 'Williamsburg',
      borough: 'Brooklyn',
    },
  },
};

// Manhattan listing
export const ManhattanListing = {
  args: {
    listing: {
      listing_title: 'Modern Studio in Chelsea',
      address_with_lat_lng_json: '200 W 23rd St, New York, NY 10011',
      primary_neighborhood_reference_id: 'Chelsea',
      borough: 'Manhattan',
    },
  },
};

// Queens listing
export const QueensListing = {
  args: {
    listing: {
      listing_title: 'Spacious 2BR in Astoria',
      address_with_lat_lng_json: '30-50 Steinway St, Astoria, NY 11103',
      primary_neighborhood_reference_id: 'Astoria',
      borough: 'Queens',
    },
  },
};

// With address override
export const WithAddressOverride = {
  args: {
    listing: {
      listing_title: 'Private Room near Central Park',
      primary_neighborhood_reference_id: 'Upper West Side',
      borough: 'Manhattan',
    },
    address: '100 Central Park West, New York, NY 10023',
  },
  parameters: {
    docs: {
      description: {
        story: 'Address can be passed separately from the listing object.',
      },
    },
  },
};

// Minimal listing data
export const MinimalData = {
  args: {
    listing: {
      listing_title: 'Cozy Studio',
    },
    address: '123 Example Street, Brooklyn, NY',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal gracefully handles missing neighborhood/borough data.',
      },
    },
  },
};

// No listing (address only)
export const AddressOnly = {
  args: {
    listing: null,
    address: '500 5th Avenue, New York, NY 10110',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal works with just an address when listing is unavailable.',
      },
    },
  },
};

// Long address
export const LongAddress = {
  args: {
    listing: {
      listing_title: 'Charming Brownstone Apartment with Private Garden',
      address_with_lat_lng_json: 'Apartment 3B, 789 Prospect Place, Crown Heights, Brooklyn, New York, NY 11216',
      primary_neighborhood_reference_id: 'Crown Heights',
      borough: 'Brooklyn',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal handles long listing names and addresses.',
      },
    },
  },
};

// Mobile view
export const MobileView = {
  args: {
    listing: {
      listing_title: 'Sunny 1BR in Williamsburg',
      address_with_lat_lng_json: '456 Bedford Ave, Brooklyn, NY 11211',
      primary_neighborhood_reference_id: 'Williamsburg',
      borough: 'Brooklyn',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Modal layout on mobile devices.',
      },
    },
  },
};

// All borough examples
export const AllBoroughs = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '16px', color: '#31135D' }}>NYC Boroughs</h2>
      <p style={{ marginBottom: '24px', color: '#6b7280' }}>
        The MapModal supports listings from all NYC boroughs.
        Click &quot;View Details&quot; buttons below (in a real implementation).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {[
          { name: 'Manhattan', hood: 'Chelsea', address: '200 W 23rd St' },
          { name: 'Brooklyn', hood: 'Williamsburg', address: '456 Bedford Ave' },
          { name: 'Queens', hood: 'Astoria', address: '30-50 Steinway St' },
          { name: 'Bronx', hood: 'Riverdale', address: '100 Riverdale Ave' },
          { name: 'Staten Island', hood: 'St. George', address: '50 Bay St' },
        ].map((borough) => (
          <div
            key={borough.name}
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
            }}
          >
            <h4 style={{ margin: '0 0 8px', color: '#31135D' }}>{borough.name}</h4>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#374151' }}>{borough.hood}</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>{borough.address}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference showing all NYC boroughs supported by the application.',
      },
    },
  },
};
