/**
 * ScoreBreakdown Component Stories
 *
 * Visual breakdown of match score by criterion with progress bars.
 */

import { ScoreBreakdown } from './ScoreBreakdown';

// Mock breakdown data
const fullBreakdown = {
  borough: {
    label: 'Location Match',
    score: 20,
    max: 20,
    description: 'Same borough as requested',
  },
  price: {
    label: 'Price Match',
    score: 15,
    max: 20,
    description: 'Within budget range',
  },
  schedule: {
    label: 'Schedule Match',
    score: 18,
    max: 20,
    description: '5 of 5 days aligned',
  },
  weeklyStay: {
    label: 'Weekly Stay',
    score: 10,
    max: 10,
    description: 'Matches weekly pattern',
  },
  duration: {
    label: 'Duration Match',
    score: 12,
    max: 15,
    description: '12 of 13 weeks overlap',
  },
  host: {
    label: 'Host Rating',
    score: 8,
    max: 10,
    description: '4.8 star rating',
  },
};

const partialBreakdown = {
  borough: {
    label: 'Location Match',
    score: 10,
    max: 20,
    description: 'Adjacent borough',
  },
  price: {
    label: 'Price Match',
    score: 8,
    max: 20,
    description: '20% over budget',
  },
  schedule: {
    label: 'Schedule Match',
    score: 12,
    max: 20,
    description: '3 of 5 days aligned',
  },
  weeklyStay: {
    label: 'Weekly Stay',
    score: 5,
    max: 10,
    description: 'Partial match',
  },
  duration: {
    label: 'Duration Match',
    score: 8,
    max: 15,
    description: '8 of 13 weeks overlap',
  },
  host: {
    label: 'Host Rating',
    score: 6,
    max: 10,
    description: '4.2 star rating',
  },
};

const lowScoreBreakdown = {
  borough: {
    label: 'Location Match',
    score: 5,
    max: 20,
    description: 'Different borough',
  },
  price: {
    label: 'Price Match',
    score: 4,
    max: 20,
    description: 'Significantly over budget',
  },
  schedule: {
    label: 'Schedule Match',
    score: 6,
    max: 20,
    description: '1 of 5 days aligned',
  },
  weeklyStay: {
    label: 'Weekly Stay',
    score: 2,
    max: 10,
    description: 'Minimal match',
  },
  duration: {
    label: 'Duration Match',
    score: 4,
    max: 15,
    description: '4 of 13 weeks overlap',
  },
  host: {
    label: 'Host Rating',
    score: 4,
    max: 10,
    description: '3.5 star rating',
  },
};

export default {
  title: 'QuickMatch/ScoreBreakdown',
  component: ScoreBreakdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## ScoreBreakdown Component

Visual breakdown of a match score showing individual criteria with progress bars.

### Features
- Overall score display with percentage
- Individual criterion progress bars
- Color-coded based on score percentage:
  - Excellent (80%+): Green
  - Good (60-79%): Blue
  - Fair (40-59%): Yellow
  - Poor (<40%): Red
- Compact mode for minimal display
- Criterion descriptions

### Scoring Criteria
- **Location Match** (20 pts): Borough alignment
- **Price Match** (20 pts): Budget compatibility
- **Schedule Match** (20 pts): Day availability
- **Weekly Stay** (10 pts): Weekly pattern fit
- **Duration Match** (15 pts): Lease overlap
- **Host Rating** (10 pts): Host quality

### Usage
\`\`\`jsx
import { ScoreBreakdown } from 'islands/shared/QuickMatch/ScoreBreakdown';

<ScoreBreakdown
  breakdown={breakdown}
  totalScore={83}
  maxPossibleScore={95}
  compact={false}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    totalScore: {
      control: { type: 'range', min: 0, max: 95, step: 1 },
      description: 'Total match score',
    },
    maxPossibleScore: {
      control: { type: 'range', min: 50, max: 100, step: 5 },
      description: 'Maximum possible score',
    },
    compact: {
      control: 'boolean',
      description: 'Show compact version (overall only)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
        <Story />
      </div>
    ),
  ],
};

// Excellent Match (80%+)
export const ExcellentMatch = {
  args: {
    breakdown: fullBreakdown,
    totalScore: 83,
    maxPossibleScore: 95,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'High match score (87%) with excellent ratings across most criteria.',
      },
    },
  },
};

// Good Match (60-79%)
export const GoodMatch = {
  args: {
    breakdown: partialBreakdown,
    totalScore: 49,
    maxPossibleScore: 95,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Moderate match score (52%) with mixed ratings.',
      },
    },
  },
};

// Poor Match (<40%)
export const PoorMatch = {
  args: {
    breakdown: lowScoreBreakdown,
    totalScore: 25,
    maxPossibleScore: 95,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Low match score (26%) with poor alignment on most criteria.',
      },
    },
  },
};

// Compact Mode
export const CompactMode = {
  args: {
    breakdown: fullBreakdown,
    totalScore: 83,
    maxPossibleScore: 95,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact view showing only the overall score without individual criteria.',
      },
    },
  },
};

// No Breakdown Data
export const NoBreakdown = {
  args: {
    breakdown: null,
    totalScore: 0,
    maxPossibleScore: 95,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When breakdown is null, the component renders nothing.',
      },
    },
  },
};

// All Score Levels
export const AllScoreLevels = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1f2937' }}>
          Excellent (80%+)
        </h4>
        <ScoreBreakdown
          breakdown={fullBreakdown}
          totalScore={83}
          maxPossibleScore={95}
          compact={true}
        />
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1f2937' }}>
          Good (60-79%)
        </h4>
        <ScoreBreakdown
          breakdown={{ ...fullBreakdown, price: { ...fullBreakdown.price, score: 10 } }}
          totalScore={65}
          maxPossibleScore={95}
          compact={true}
        />
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1f2937' }}>
          Fair (40-59%)
        </h4>
        <ScoreBreakdown
          breakdown={partialBreakdown}
          totalScore={49}
          maxPossibleScore={95}
          compact={true}
        />
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1f2937' }}>
          Poor (&lt;40%)
        </h4>
        <ScoreBreakdown
          breakdown={lowScoreBreakdown}
          totalScore={25}
          maxPossibleScore={95}
          compact={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all score level visualizations with their color coding.',
      },
    },
  },
};

// Detailed Breakdown
export const DetailedBreakdown = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1f2937' }}>
        Match Analysis
      </h3>
      <ScoreBreakdown
        breakdown={fullBreakdown}
        totalScore={83}
        maxPossibleScore={95}
        compact={false}
      />
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f5f3ff',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#5b21b6',
      }}>
        <strong>Why this score?</strong>
        <p style={{ margin: '8px 0 0', color: '#6d28d9' }}>
          This listing matches your preferences well. The only minor gaps are
          in price (slightly over budget) and duration (12 of 13 weeks overlap).
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full detailed breakdown with explanation context.',
      },
    },
  },
};
