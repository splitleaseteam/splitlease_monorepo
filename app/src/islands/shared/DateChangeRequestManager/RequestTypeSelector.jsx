/**
 * Request Type Selector Component
 * Toggle buttons for selecting date change request type
 */

/**
 * @param {Object} props
 * @param {'adding' | 'removing' | 'swapping' | null} props.selectedType - Currently selected type
 * @param {Function} props.onTypeSelect - Handler for type selection
 * @param {boolean} [props.disabled=false] - Whether selector is disabled
 * @param {'default' | 'compact'} [props.variant='default'] - Visual variant
 */
export default function RequestTypeSelector({
  selectedType,
  onTypeSelect,
  disabled = false,
  variant = 'default',
}) {
  const requestTypes = [
    {
      id: 'adding',
      label: 'Add Night',
      icon: '➕',
      description: 'Add a new night to your lease',
    },
    {
      id: 'removing',
      label: 'Offer Night',
      icon: '➖',
      description: 'Offer a night back to your roommate',
    },
    {
      id: 'swapping',
      label: 'Swap Nights',
      icon: '🔄',
      description: 'Exchange one night for another',
    },
  ];

  // In compact mode, we might want to hide "Add Night" if it's the default and we only show alternatives?
  // Or just show all 3 but smaller.
  // The spec says: "When expanded: - Offer Night - Swap Nights".
  // This implies "Add" might not even be needed in the secondary menu if it's the main view.
  // However, users might want to switch back to Add.
  // Let's keep all 3 but style them appropriately.

  return (
    <div className={`dcr-type-selector ${variant === 'compact' ? 'dcr-type-selector-compact' : ''}`}>
      {variant === 'default' && (
        <h3 className="dcr-type-selector-title">What would you like to do?</h3>
      )}
      <div className="dcr-type-buttons">
        {requestTypes.map((type) => (
          <button
            key={type.id}
            className={`dcr-type-button ${selectedType === type.id ? 'dcr-type-button-active' : ''}`}
            onClick={() => onTypeSelect(type.id)}
            disabled={disabled}
            aria-pressed={selectedType === type.id}
          >
            <span className="dcr-type-icon">{type.icon}</span>
            <span className="dcr-type-label">{type.label}</span>
          </button>
        ))}
      </div>
      {selectedType && variant === 'default' && (
        <p className="dcr-type-description">
          {requestTypes.find((t) => t.id === selectedType)?.description}
        </p>
      )}
    </div>
  );
}
