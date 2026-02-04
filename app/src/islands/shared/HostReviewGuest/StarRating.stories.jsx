/**
 * StarRating Component Stories
 *
 * Interactive 5-star rating widget with keyboard accessibility.
 */

import { useState } from 'react';
import StarRating from './StarRating';

export default {
  title: 'HostReviewGuest/StarRating',
  component: StarRating,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## StarRating Component

An interactive 5-star rating widget with full keyboard accessibility.

### Features
- Hover preview effect
- Click to select rating
- Keyboard navigation (Arrow keys, Enter, Space)
- Multiple sizes (small, medium, large)
- Disabled state support
- ARIA labels for accessibility

### Keyboard Controls
- **Arrow Right/Up**: Increase rating
- **Arrow Left/Down**: Decrease rating
- **Enter/Space**: Confirm selection

### Usage
\`\`\`jsx
import StarRating from 'islands/shared/HostReviewGuest/StarRating';

<StarRating
  value={rating}
  onChange={(newRating) => setRating(newRating)}
  size="medium"
  disabled={false}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
      description: 'Current rating value',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    maxStars: {
      control: { type: 'range', min: 3, max: 10, step: 1 },
      description: 'Maximum number of stars',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
      },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the stars',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the rating is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      action: 'changed',
      description: 'Called when rating changes',
    },
  },
};

// Interactive wrapper
const StarRatingDemo = ({ initialValue = 0, ...args }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <StarRating
        {...args}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          console.log('Rating changed to:', newValue);
        }}
      />
      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
        Selected: {value} / {args.maxStars || 5} stars
      </p>
    </div>
  );
};

// Default
export const Default = {
  render: (args) => <StarRatingDemo {...args} />,
  args: {
    maxStars: 5,
    size: 'medium',
    disabled: false,
  },
};

// With Initial Value
export const WithInitialValue = {
  render: (args) => <StarRatingDemo {...args} initialValue={4} />,
  args: {
    maxStars: 5,
    size: 'medium',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Star rating with a pre-selected value of 4.',
      },
    },
  },
};

// Small Size
export const Small = {
  render: (args) => <StarRatingDemo {...args} initialValue={3} />,
  args: {
    maxStars: 5,
    size: 'small',
    disabled: false,
  },
};

// Large Size
export const Large = {
  render: (args) => <StarRatingDemo {...args} initialValue={5} />,
  args: {
    maxStars: 5,
    size: 'large',
    disabled: false,
  },
};

// Disabled
export const Disabled = {
  args: {
    value: 3,
    maxStars: 5,
    size: 'medium',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - rating cannot be changed.',
      },
    },
  },
};

// Custom Max Stars
export const TenStars = {
  render: (args) => <StarRatingDemo {...args} initialValue={7} />,
  args: {
    maxStars: 10,
    size: 'small',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: '10-star rating scale (useful for certain review systems).',
      },
    },
  },
};

// All Sizes Comparison
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Small</p>
        <StarRating value={4} maxStars={5} size="small" onChange={() => {}} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Medium</p>
        <StarRating value={4} maxStars={5} size="medium" onChange={() => {}} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Large</p>
        <StarRating value={4} maxStars={5} size="large" onChange={() => {}} />
      </div>
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

// All Rating Levels
export const AllRatingLevels = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[0, 1, 2, 3, 4, 5].map((rating) => (
        <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ width: '80px', fontSize: '14px', color: '#374151' }}>
            {rating} star{rating !== 1 ? 's' : ''}:
          </span>
          <StarRating value={rating} maxStars={5} size="medium" onChange={() => {}} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual display of all possible rating values from 0 to 5.',
      },
    },
  },
};

// In Form Context
const InFormContextWrapper = () => {
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    communication: 0,
    location: 0,
    value: 0,
  });

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      maxWidth: '400px',
    }}>
      <h3 style={{ margin: '0 0 20px', color: '#1f2937', fontSize: '18px' }}>
        Rate Your Experience
      </h3>

      {[
        { key: 'cleanliness', label: 'Cleanliness' },
        { key: 'communication', label: 'Communication' },
        { key: 'location', label: 'Location' },
        { key: 'value', label: 'Value' },
      ].map(({ key, label }) => (
        <div key={key} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
          <StarRating
            value={ratings[key]}
            onChange={(value) => setRatings({ ...ratings, [key]: value })}
            size="small"
          />
        </div>
      ))}

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Average: {(Object.values(ratings).reduce((a, b) => a + b, 0) / 4).toFixed(1)} / 5
        </p>
      </div>
    </div>
  );
};

export const InFormContext = {
  render: () => <InFormContextWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Star rating component in a review form context with multiple categories.',
      },
    },
  },
};
