/**
 * DayButton Component Stories
 *
 * Individual day selection button used in schedule selectors.
 * Displays a single letter representation of a weekday with selection state.
 */
import { DayButton } from './DayButton';

export default {
  title: 'Shared/DayButton',
  component: DayButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## DayButton Component

A compact button representing a single day of the week in schedule selectors.
Uses single-letter abbreviation (S, M, T, W, T, F, S) for space efficiency.

### Day Indexing Convention

This project uses JavaScript's 0-based day indexing (matching \`Date.getDay()\`):

| Day | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|-----|-----|-----|-----|-----|-----|-----|-----|
| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 |

### Usage

\`\`\`jsx
import { DayButton } from 'islands/shared/DayButton';

const day = { dayIndex: 1, name: 'Monday', singleLetter: 'M', isAvailable: true };
<DayButton
  day={day}
  isSelected={selectedDays.includes(1)}
  isClickable={true}
  onClick={handleDayClick}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    day: {
      description: 'Day object with dayIndex, name, singleLetter, and isAvailable properties',
      table: {
        type: { summary: 'object' },
      },
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether this day is currently selected',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isClickable: {
      control: 'boolean',
      description: 'Whether clicking is enabled for this day',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Handler called when day is clicked (receives day object)',
    },
  },
};

// Helper to create day objects
const createDay = (dayIndex, name, singleLetter, isAvailable = true) => ({
  dayIndex,
  name,
  singleLetter,
  isAvailable,
});

// All days of the week
const DAYS = [
  createDay(0, 'Sunday', 'S'),
  createDay(1, 'Monday', 'M'),
  createDay(2, 'Tuesday', 'T'),
  createDay(3, 'Wednesday', 'W'),
  createDay(4, 'Thursday', 'T'),
  createDay(5, 'Friday', 'F'),
  createDay(6, 'Saturday', 'S'),
];

// Default story
export const Default = {
  args: {
    day: createDay(1, 'Monday', 'M'),
    isSelected: false,
    isClickable: true,
  },
};

// Selected state
export const Selected = {
  args: {
    day: createDay(2, 'Tuesday', 'T'),
    isSelected: true,
    isClickable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Day button in selected state, showing visual distinction.',
      },
    },
  },
};

// Disabled/Unavailable state
export const Disabled = {
  args: {
    day: createDay(3, 'Wednesday', 'W', false),
    isSelected: false,
    isClickable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Day marked as unavailable (e.g., host is not offering this day).',
      },
    },
  },
};

// Not clickable (read-only)
export const NotClickable = {
  args: {
    day: createDay(4, 'Thursday', 'T'),
    isSelected: true,
    isClickable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only display mode where interaction is disabled.',
      },
    },
  },
};

// Full Week Display
export const FullWeek = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      {DAYS.map((day) => (
        <DayButton
          key={day.dayIndex}
          day={day}
          isSelected={false}
          isClickable={true}
          onClick={() => console.log(`Clicked ${day.name}`)}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete week of day buttons - typical display in schedule selector.',
      },
    },
  },
};

// Weekdays Selected
export const WeekdaysSelected = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      {DAYS.map((day) => (
        <DayButton
          key={day.dayIndex}
          day={day}
          isSelected={[1, 2, 3, 4, 5].includes(day.dayIndex)}
          isClickable={true}
          onClick={() => console.log(`Clicked ${day.name}`)}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common pattern: Monday through Friday selected.',
      },
    },
  },
};

// Weekends Selected
export const WeekendsSelected = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      {DAYS.map((day) => (
        <DayButton
          key={day.dayIndex}
          day={day}
          isSelected={[0, 6].includes(day.dayIndex)}
          isClickable={true}
          onClick={() => console.log(`Clicked ${day.name}`)}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Weekend pattern: Saturday and Sunday selected.',
      },
    },
  },
};

// Mixed Availability
export const MixedAvailability = {
  render: () => {
    const daysWithAvailability = [
      createDay(0, 'Sunday', 'S', false),
      createDay(1, 'Monday', 'M', true),
      createDay(2, 'Tuesday', 'T', true),
      createDay(3, 'Wednesday', 'W', true),
      createDay(4, 'Thursday', 'T', true),
      createDay(5, 'Friday', 'F', true),
      createDay(6, 'Saturday', 'S', false),
    ];

    return (
      <div>
        <p style={{ marginBottom: '12px', color: '#6b7280', fontSize: '14px' }}>
          Host only offers weekdays (Mon-Fri):
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {daysWithAvailability.map((day) => (
            <DayButton
              key={day.dayIndex}
              day={day}
              isSelected={[1, 2, 3].includes(day.dayIndex)}
              isClickable={true}
              onClick={() => console.log(`Clicked ${day.name}`)}
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Scenario where host has limited availability - weekends unavailable.',
      },
    },
  },
};

// All States Grid
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Available + Not Selected</h4>
        <DayButton
          day={createDay(1, 'Monday', 'M')}
          isSelected={false}
          isClickable={true}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Available + Selected</h4>
        <DayButton
          day={createDay(1, 'Monday', 'M')}
          isSelected={true}
          isClickable={true}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Unavailable (Disabled)</h4>
        <DayButton
          day={createDay(1, 'Monday', 'M', false)}
          isSelected={false}
          isClickable={true}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Read-Only (Not Clickable)</h4>
        <DayButton
          day={createDay(1, 'Monday', 'M')}
          isSelected={true}
          isClickable={false}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All possible state combinations for the DayButton component.',
      },
    },
  },
};
