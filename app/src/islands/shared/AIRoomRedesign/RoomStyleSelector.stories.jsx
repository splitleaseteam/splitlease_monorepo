/**
 * RoomStyleSelector Component Stories
 *
 * Grid display of interior design style options for AI room redesign.
 */

import { useState } from 'react';
import { RoomStyleSelector } from './RoomStyleSelector';

// Sample room styles data
const sampleStyles = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean lines, neutral colors',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    prompt: 'modern minimalist interior design',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light, airy, natural',
    imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400',
    prompt: 'scandinavian interior design',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Exposed brick, metal accents',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    prompt: 'industrial interior design',
  },
  {
    id: 'mid-century',
    name: 'Mid-Century Modern',
    description: 'Retro charm, organic shapes',
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400',
    prompt: 'mid-century modern interior design',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Eclectic, colorful, layered',
    imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400',
    prompt: 'bohemian interior design',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Beach vibes, blue tones',
    imageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400',
    prompt: 'coastal interior design',
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    description: 'Rustic, cozy, natural',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    prompt: 'farmhouse interior design',
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    description: 'Glamorous, geometric patterns',
    imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400',
    prompt: 'art deco interior design',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Japanese + Scandinavian fusion',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    prompt: 'japandi interior design',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'High-end finishes, elegant',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
    prompt: 'luxury interior design',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic, timeless elegance',
    imageUrl: 'https://images.unsplash.com/photo-1600566752421-d6e85f70e45a?w=400',
    prompt: 'traditional interior design',
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    description: 'Current trends, sophisticated',
    imageUrl: 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=400',
    prompt: 'contemporary interior design',
  },
];

export default {
  title: 'AIRoomRedesign/RoomStyleSelector',
  component: RoomStyleSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RoomStyleSelector Component

A grid selector for choosing interior design styles for AI room redesign.

### Features
- 4-column responsive grid (2 on mobile)
- Style thumbnail images
- Selection indicator with checkmark
- Selected style name display
- Scrollable container for many styles
- Disabled state support

### Usage
\`\`\`jsx
import { RoomStyleSelector } from 'islands/shared/AIRoomRedesign/RoomStyleSelector';

<RoomStyleSelector
  styles={availableStyles}
  selectedStyle={selectedStyle}
  onSelectStyle={(style) => setSelectedStyle(style)}
  disabled={isProcessing}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables style selection',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onSelectStyle: {
      action: 'selected',
      description: 'Called when a style is selected',
    },
  },
};

// Interactive wrapper
const RoomStyleSelectorDemo = ({ disabled = false, initialSelected = null }) => {
  const [selectedStyle, setSelectedStyle] = useState(
    initialSelected ? sampleStyles.find(s => s.id === initialSelected) : null
  );

  return (
    <div style={{ maxWidth: '800px', padding: '16px', backgroundColor: 'white', borderRadius: '12px' }}>
      <RoomStyleSelector
        styles={sampleStyles}
        selectedStyle={selectedStyle}
        onSelectStyle={(style) => {
          setSelectedStyle(style);
          console.log('Selected:', style.name);
        }}
        disabled={disabled}
      />

      {selectedStyle && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f5f3ff',
          borderRadius: '8px',
        }}>
          <h4 style={{ margin: '0 0 8px', color: '#5b21b6', fontSize: '14px' }}>
            Selected Style Details
          </h4>
          <p style={{ margin: 0, color: '#6d28d9', fontSize: '14px' }}>
            <strong>Name:</strong> {selectedStyle.name}<br />
            <strong>Description:</strong> {selectedStyle.description}<br />
            <strong>AI Prompt:</strong> {selectedStyle.prompt}
          </p>
        </div>
      )}
    </div>
  );
};

// Default - No Selection
export const Default = {
  render: () => <RoomStyleSelectorDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Default state with no style selected. Click any style to select it.',
      },
    },
  },
};

// With Pre-selected Style
export const WithSelection = {
  render: () => <RoomStyleSelectorDemo initialSelected="scandinavian" />,
  parameters: {
    docs: {
      description: {
        story: 'Style selector with Scandinavian pre-selected.',
      },
    },
  },
};

// Disabled State
export const Disabled = {
  render: () => <RoomStyleSelectorDemo disabled initialSelected="modern-minimalist" />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled state while AI is processing. Styles cannot be changed.',
      },
    },
  },
};

// Few Styles
const FewStylesWrapper = () => {
  const [selected, setSelected] = useState(null);
  const fewStyles = sampleStyles.slice(0, 4);

  return (
    <div style={{ maxWidth: '600px', padding: '16px', backgroundColor: 'white', borderRadius: '12px' }}>
      <RoomStyleSelector
        styles={fewStyles}
        selectedStyle={selected}
        onSelectStyle={setSelected}
      />
    </div>
  );
};

export const FewStyles = {
  render: () => <FewStylesWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Selector with only 4 style options.',
      },
    },
  },
};

// All Styles Grid
export const AllStylesGrid = {
  render: () => (
    <div style={{ maxWidth: '900px' }}>
      <h3 style={{ margin: '0 0 20px', color: '#1f2937' }}>Available Design Styles</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {sampleStyles.map((style) => (
          <div
            key={style.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={style.imageUrl}
              alt={style.name}
              style={{ width: '100%', height: '120px', objectFit: 'cover' }}
            />
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#1f2937' }}>
                {style.name}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                {style.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Static grid showing all available interior design styles.',
      },
    },
  },
};
