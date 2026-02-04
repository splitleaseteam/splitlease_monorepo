/**
 * SelectableChip Component Stories
 *
 * Interactive tag chips for multi-select options like reasons and preferences.
 * Supports interactive and read-only modes with success variant.
 */
import { useState } from 'react';
import SelectableChip from './SelectableChip';

export default {
  title: 'AccountProfile/SelectableChip',
  component: SelectableChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## SelectableChip Component

A toggle-able chip/tag component for multi-select interfaces.
Used for selecting preferences, reasons, amenities, and similar categorical choices.

### Variants

- **default**: Standard purple selection style
- **success**: Green selection style for confirmed/positive items

### Usage

\`\`\`jsx
import SelectableChip from './SelectableChip';

function Preferences() {
  const [selected, setSelected] = useState(['Near subway']);

  return (
    <div>
      {['Near subway', 'Pet friendly', 'Laundry'].map(pref => (
        <SelectableChip
          key={pref}
          label={pref}
          selected={selected.includes(pref)}
          onChange={(isSelected) => {
            setSelected(prev =>
              isSelected
                ? [...prev, pref]
                : prev.filter(p => p !== pref)
            );
          }}
        />
      ))}
    </div>
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Text content of the chip',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the chip is currently selected',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      action: 'changed',
      description: 'Callback when selection changes (receives new boolean state)',
    },
    readOnly: {
      control: 'boolean',
      description: 'Disables interaction for display-only mode',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    variant: {
      control: 'select',
      options: ['default', 'success'],
      description: 'Color variant when selected',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
  },
};

// Default unselected
export const Default = {
  args: {
    label: 'Near Subway',
    selected: false,
  },
};

// Selected state
export const Selected = {
  args: {
    label: 'Near Subway',
    selected: true,
  },
};

// Success variant
export const SuccessVariant = {
  args: {
    label: 'Verified',
    selected: true,
    variant: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'Green variant for positive/confirmed selections.',
      },
    },
  },
};

// Read-only mode
export const ReadOnly = {
  args: {
    label: 'Pet Friendly',
    selected: true,
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Display-only mode where clicking is disabled.',
      },
    },
  },
};

// Interactive example
export const Interactive = {
  render: () => {
    const InteractiveChips = () => {
      const options = ['Near Subway', 'Pet Friendly', 'Laundry', 'Gym', 'Parking', 'Doorman'];
      const [selected, setSelected] = useState(['Near Subway', 'Laundry']);

      return (
        <div>
          <p style={{ marginBottom: '12px', color: '#6b7280', fontSize: '14px' }}>
            Click chips to toggle selection:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.map((option) => (
              <SelectableChip
                key={option}
                label={option}
                selected={selected.includes(option)}
                onChange={(isSelected) => {
                  setSelected((prev) =>
                    isSelected
                      ? [...prev, option]
                      : prev.filter((o) => o !== option)
                  );
                }}
              />
            ))}
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
            Selected: {selected.join(', ') || 'None'}
          </p>
        </div>
      );
    };

    return <InteractiveChips />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive multi-select demonstration.',
      },
    },
  },
};

// All states comparison
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Unselected</h4>
        <SelectableChip label="Option" selected={false} />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Selected (Default)</h4>
        <SelectableChip label="Option" selected={true} />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Selected (Success)</h4>
        <SelectableChip label="Option" selected={true} variant="success" />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Read-Only Selected</h4>
        <SelectableChip label="Option" selected={true} readOnly />
      </div>
      <div>
        <h4 style={{ marginBottom: '8px', color: '#374151' }}>Read-Only Unselected</h4>
        <SelectableChip label="Option" selected={false} readOnly />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All visual states of the SelectableChip component.',
      },
    },
  },
};

// Amenities example
export const AmenitiesExample = {
  render: () => {
    const AmenitiesSelector = () => {
      const amenities = [
        'WiFi', 'Air Conditioning', 'Heating', 'Washer', 'Dryer',
        'Kitchen', 'Workspace', 'TV', 'Parking', 'Pool', 'Gym',
        'Hot Tub', 'Elevator', 'Doorman', 'Pets Allowed',
      ];
      const [selected, setSelected] = useState(['WiFi', 'Kitchen', 'Workspace']);

      return (
        <div>
          <h3 style={{ marginBottom: '16px', color: '#31135D' }}>Amenities</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {amenities.map((amenity) => (
              <SelectableChip
                key={amenity}
                label={amenity}
                selected={selected.includes(amenity)}
                onChange={(isSelected) => {
                  setSelected((prev) =>
                    isSelected
                      ? [...prev, amenity]
                      : prev.filter((a) => a !== amenity)
                  );
                }}
              />
            ))}
          </div>
        </div>
      );
    };

    return <AmenitiesSelector />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: selecting listing amenities.',
      },
    },
  },
};

// Reasons for Split Lease
export const ReasonsExample = {
  render: () => {
    const reasons = [
      'Work travel',
      'Visiting family',
      'Remote work flexibility',
      'Between leases',
      'Testing neighborhood',
      'Seasonal stay',
      'Student housing',
      'Medical treatment nearby',
    ];

    return (
      <div>
        <h3 style={{ marginBottom: '8px', color: '#31135D' }}>Why Split Lease?</h3>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
          Select the reasons that apply to you:
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {reasons.map((reason, i) => (
            <SelectableChip
              key={reason}
              label={reason}
              selected={i < 3}
              variant="default"
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example use case: selecting reasons for using Split Lease.',
      },
    },
  },
};

// Verification badges
export const VerificationBadges = {
  render: () => {
    const verifications = [
      { label: 'Email Verified', verified: true },
      { label: 'Phone Verified', verified: true },
      { label: 'ID Verified', verified: false },
      { label: 'Background Check', verified: false },
      { label: 'Income Verified', verified: true },
    ];

    return (
      <div>
        <h3 style={{ marginBottom: '16px', color: '#31135D' }}>Verification Status</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {verifications.map(({ label, verified }) => (
            <SelectableChip
              key={label}
              label={label}
              selected={verified}
              variant="success"
              readOnly
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only success chips showing verification status.',
      },
    },
  },
};
