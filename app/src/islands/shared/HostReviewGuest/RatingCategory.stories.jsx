/**
 * RatingCategory Component Stories
 *
 * Displays a single rating dimension with title, question, and star input.
 */

import { useState } from 'react';
import RatingCategory from './RatingCategory';

// Mock category data
const cleanlinessCategory = {
  title: 'Cleanliness',
  question: 'How clean did the guest leave your space?',
};

const communicationCategory = {
  title: 'Communication',
  question: 'How responsive and clear was the guest in their communication?',
};

const houseRulesCategory = {
  title: 'House Rules',
  question: 'Did the guest follow your house rules?',
};

const overallCategory = {
  title: 'Overall Experience',
  question: 'How would you rate your overall experience with this guest?',
};

export default {
  title: 'HostReviewGuest/RatingCategory',
  component: RatingCategory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RatingCategory Component

A single rating dimension component used in the host review guest form.

### Features
- Category title display
- Question prompt for the rating dimension
- Integrated StarRating component
- Scale label display based on current value:
  - 1: "Very poor"
  - 2: "Poor"
  - 3: "Average"
  - 4: "Good"
  - 5: "Excellent"
- Disabled state support

### Usage
\`\`\`jsx
import RatingCategory from 'islands/shared/HostReviewGuest/RatingCategory';

<RatingCategory
  category={{ title: 'Cleanliness', question: 'How clean was the space?' }}
  value={rating}
  onChange={(newValue) => setRating(newValue)}
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
      description: 'Current rating value (0-5)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the rating is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Called when rating changes',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '500px', backgroundColor: 'white', padding: '24px', borderRadius: '12px' }}>
        <Story />
      </div>
    ),
  ],
};

// Interactive wrapper
const RatingCategoryDemo = ({ category, initialValue = 0, ...args }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <RatingCategory
      category={category}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        console.log('Rating changed to:', newValue);
      }}
      {...args}
    />
  );
};

// Default - Cleanliness
export const Default = {
  render: (args) => <RatingCategoryDemo {...args} category={cleanlinessCategory} />,
  args: {
    disabled: false,
  },
};

// With Initial Value
export const WithInitialValue = {
  render: (args) => <RatingCategoryDemo {...args} category={cleanlinessCategory} initialValue={4} />,
  args: {
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Rating category with a pre-selected value of 4 ("Good").',
      },
    },
  },
};

// Communication Category
export const Communication = {
  render: (args) => <RatingCategoryDemo {...args} category={communicationCategory} initialValue={5} />,
  args: {
    disabled: false,
  },
};

// House Rules Category
export const HouseRules = {
  render: (args) => <RatingCategoryDemo {...args} category={houseRulesCategory} />,
  args: {
    disabled: false,
  },
};

// Disabled State
export const Disabled = {
  args: {
    category: cleanlinessCategory,
    value: 3,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled rating category - value cannot be changed.',
      },
    },
  },
};

// All Scale Labels
export const AllScaleLabels = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <div key={value}>
          <RatingCategory
            category={{
              title: `Rating: ${value}`,
              question: `This shows the scale label for value ${value}`,
            }}
            value={value}
            onChange={() => {}}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all scale labels from "Very poor" (1) to "Excellent" (5).',
      },
    },
  },
};

// Full Review Form
const FullReviewFormWrapper = () => {
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    communication: 0,
    houseRules: 0,
    overall: 0,
  });

  const categories = [
    { key: 'cleanliness', ...cleanlinessCategory },
    { key: 'communication', ...communicationCategory },
    { key: 'houseRules', ...houseRulesCategory },
    { key: 'overall', ...overallCategory },
  ];

  const handleRatingChange = (key) => (value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const filledCount = Object.values(ratings).filter((v) => v > 0).length;
  const averageRating = filledCount > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / filledCount).toFixed(1)
    : '0.0';

  return (
    <div>
      <h3 style={{ margin: '0 0 24px', color: '#1f2937', fontSize: '18px' }}>
        Review Your Guest
      </h3>

      {categories.map((category) => (
        <div key={category.key} style={{ marginBottom: '24px' }}>
          <RatingCategory
            category={{ title: category.title, question: category.question }}
            value={ratings[category.key]}
            onChange={handleRatingChange(category.key)}
          />
        </div>
      ))}

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f5f3ff',
        borderRadius: '8px',
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#5b21b6' }}>
          <strong>Summary:</strong> {filledCount}/4 categories rated
          {filledCount > 0 && ` | Average: ${averageRating} stars`}
        </p>
      </div>
    </div>
  );
};

export const FullReviewForm = {
  render: () => <FullReviewFormWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Complete review form with multiple rating categories.',
      },
    },
  },
};
