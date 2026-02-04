/**
 * LoadingState Component Stories
 *
 * Loading indicator with optional message for async operations.
 * Used across admin pages and data-fetching components.
 */
import LoadingState from './LoadingState';

export default {
  title: 'States/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## LoadingState Component

A centered loading indicator with spinner and customizable message.
Used during data fetching, form submissions, and async operations.

### Usage

\`\`\`jsx
import LoadingState from './LoadingState';

// Default message
<LoadingState />

// Custom message
<LoadingState message="Fetching your listings..." />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Loading message to display',
      table: {
        defaultValue: { summary: 'Loading...' },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px', background: '#f9fafb', minHeight: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

// Default loading
export const Default = {
  args: {},
};

// Custom message
export const CustomMessage = {
  args: {
    message: 'Fetching your data...',
  },
};

// Loading threads
export const LoadingThreads = {
  args: {
    message: 'Loading message threads...',
  },
};

// Loading listings
export const LoadingListings = {
  args: {
    message: 'Loading your listings...',
  },
};

// Loading proposals
export const LoadingProposals = {
  args: {
    message: 'Loading proposals...',
  },
};

// Submitting form
export const SubmittingForm = {
  args: {
    message: 'Submitting your request...',
  },
};

// Saving changes
export const SavingChanges = {
  args: {
    message: 'Saving changes...',
  },
};

// Processing payment
export const ProcessingPayment = {
  args: {
    message: 'Processing your payment...',
  },
};

// Various contexts
export const AllContexts = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
      {[
        'Loading...',
        'Fetching listings...',
        'Processing...',
        'Saving...',
        'Searching...',
        'Uploading photos...',
      ].map((message) => (
        <div
          key={message}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <LoadingState message={message} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading states with various contextual messages.',
      },
    },
  },
};

// Full page loading
export const FullPage = {
  args: {
    message: 'Loading your dashboard...',
  },
  decorators: [
    (Story) => (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Loading state centered on full page during initial page load.',
      },
    },
  },
};
