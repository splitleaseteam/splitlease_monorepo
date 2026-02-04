/**
 * ErrorOverlay Component Stories
 *
 * Modal overlay for displaying error messages with context-specific titles
 * and a dismissal action. Used in schedule selection and booking flows.
 */
import { ErrorOverlay } from './ErrorOverlay';

export default {
  title: 'Shared/ErrorOverlay',
  component: ErrorOverlay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## ErrorOverlay Component

A modal overlay that displays error messages with context-appropriate titles.
Commonly used in schedule selectors and booking flows to communicate validation errors.

### Error Types

| Type | Title | Use Case |
|------|-------|----------|
| minimum_nights | Minimum Days Required | Guest selected fewer than minimum |
| maximum_nights | Maximum Days Exceeded | Guest selected more than maximum |
| maximum_nights_warning | Host Preference Notice | Soft limit exceeded (warning only) |
| contiguity | Days Not Consecutive | Non-contiguous day selection |
| availability | Day Not Available | Trying to book unavailable day |
| days_selected | Invalid Selection | General selection error |
| nights_outside_host | Outside Host Availability | Conflicting with host schedule |

### Usage

\`\`\`jsx
import { ErrorOverlay } from 'islands/shared/ErrorOverlay';

<ErrorOverlay
  errorState={{
    hasError: true,
    errorType: 'minimum_nights',
    errorMessage: 'Please select at least 3 nights.',
  }}
  onClose={handleCloseError}
/>
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    errorState: {
      description: 'Error state object with hasError, errorType, and errorMessage',
      table: {
        type: { summary: 'object' },
      },
    },
    onClose: {
      action: 'closed',
      description: 'Handler called when user dismisses the overlay',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

// Default - No Error (renders nothing)
export const NoError = {
  args: {
    errorState: {
      hasError: false,
      errorType: null,
      errorMessage: '',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'When hasError is false, the component renders nothing.',
      },
    },
  },
};

// Minimum Nights Error
export const MinimumNights = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'minimum_nights',
      errorMessage: 'This listing requires a minimum of 3 nights. Please select at least 3 consecutive nights.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Displayed when guest attempts to book fewer nights than required minimum.',
      },
    },
  },
};

// Maximum Nights Error
export const MaximumNights = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'maximum_nights',
      errorMessage: 'This listing has a maximum stay of 14 nights. Please reduce your selection.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Displayed when guest selects more nights than the hard maximum.',
      },
    },
  },
};

// Maximum Nights Warning (Soft Limit)
export const MaximumNightsWarning = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'maximum_nights_warning',
      errorMessage: 'The host prefers stays of 7 nights or fewer.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Soft warning when exceeding host preference - guest can still proceed.',
      },
    },
  },
};

// Contiguity Error
export const ContiguityError = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'contiguity',
      errorMessage: 'Please select consecutive days. Your current selection has gaps.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Displayed when guest selects non-consecutive days.',
      },
    },
  },
};

// Availability Error
export const AvailabilityError = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'availability',
      errorMessage: 'Wednesday is not available. The host does not offer this listing on Wednesdays.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Displayed when guest tries to select a day the host has not made available.',
      },
    },
  },
};

// Invalid Days Selection
export const InvalidSelection = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'days_selected',
      errorMessage: 'Please select at least one day to continue.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'General error for invalid day selection.',
      },
    },
  },
};

// Outside Host Availability
export const OutsideHostAvailability = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'nights_outside_host',
      errorMessage: 'Some of your selected nights fall outside the host availability window.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Displayed when selection conflicts with host availability dates.',
      },
    },
  },
};

// Generic Error
export const GenericError = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'unknown',
      errorMessage: 'An unexpected error occurred. Please try again.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Fallback error display for unrecognized error types.',
      },
    },
  },
};

// All Error Types Gallery
export const AllErrorTypes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px' }}>
      <h2 style={{ margin: 0, color: '#31135D' }}>Error Type Gallery</h2>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Click on any error type below to see the overlay (opens in a simulated modal).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {[
          { type: 'minimum_nights', message: 'Please select at least 3 nights.' },
          { type: 'maximum_nights', message: 'Maximum stay is 14 nights.' },
          { type: 'maximum_nights_warning', message: 'Host prefers stays under 7 nights.' },
          { type: 'contiguity', message: 'Please select consecutive days.' },
          { type: 'availability', message: 'This day is not available.' },
          { type: 'days_selected', message: 'Please select at least one day.' },
          { type: 'nights_outside_host', message: 'Selection outside host availability.' },
        ].map(({ type, message }) => (
          <div
            key={type}
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#fff',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#31135D' }}>{type}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{message}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference gallery of all error types and their contexts.',
      },
    },
  },
};

// Mobile View
export const MobileView = {
  args: {
    errorState: {
      hasError: true,
      errorType: 'minimum_nights',
      errorMessage: 'This listing requires a minimum of 3 nights. Please select at least 3 consecutive nights to continue with your booking.',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Error overlay on mobile viewport showing responsive behavior.',
      },
    },
  },
};
