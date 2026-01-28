/**
 * EmptyState Component Stories
 *
 * Display component for when no results match filters or data is empty.
 * Used across admin pages and dashboards.
 */
import EmptyState from './EmptyState';

export default {
  title: 'States/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## EmptyState Component

Displayed when a list or data set has no items to show.
Provides helpful messaging and optional action to clear filters.

### Use Cases

- Search results with no matches
- Empty inbox or messages
- No items in a filtered list
- First-time user with no data

### Usage

\`\`\`jsx
import EmptyState from './EmptyState';

<EmptyState
  title="No threads found"
  message="Try adjusting your filters to find conversations."
  onClearFilters={() => setFilters({})}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main heading text',
    },
    message: {
      control: 'text',
      description: 'Descriptive message explaining the empty state',
    },
    onClearFilters: {
      action: 'cleared',
      description: 'Optional callback to clear filters (shows button when provided)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px', background: '#f9fafb', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

// Default empty state
export const Default = {
  args: {
    title: 'No threads found',
    message: 'There are no message threads to display.',
  },
};

// With clear filters action
export const WithClearFilters = {
  args: {
    title: 'No matching results',
    message: 'Try adjusting your filters to find what you\'re looking for.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "Clear Filters" button when onClearFilters is provided.',
      },
    },
  },
};

// No search results
export const NoSearchResults = {
  args: {
    title: 'No results for "brooklyn studio"',
    message: 'Try different keywords or check your spelling.',
  },
};

// Empty inbox
export const EmptyInbox = {
  args: {
    title: 'No messages yet',
    message: 'When guests or hosts message you, they\'ll appear here.',
  },
};

// No listings
export const NoListings = {
  args: {
    title: 'No listings found',
    message: 'You haven\'t created any listings yet. Click "Add Listing" to get started.',
  },
};

// No proposals
export const NoProposals = {
  args: {
    title: 'No proposals',
    message: 'You don\'t have any booking proposals at the moment.',
  },
};

// Filtered empty state
export const FilteredEmpty = {
  args: {
    title: 'No active threads',
    message: 'There are no threads matching your current filter. Try selecting a different status.',
  },
};

// All variations
export const AllVariations = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Messages</h4>
        <EmptyState
          title="No messages"
          message="Your inbox is empty."
        />
      </div>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Search</h4>
        <EmptyState
          title="No results"
          message="Try different search terms."
          onClearFilters={() => {}}
        />
      </div>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Favorites</h4>
        <EmptyState
          title="No favorites"
          message="Save listings to find them later."
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different empty state contexts showing versatility.',
      },
    },
  },
};
