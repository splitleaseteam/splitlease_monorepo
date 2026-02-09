/**
 * FeaturesSection - Features section for description and amenities
 *
 * @param {object} props - Component props
 * @param {object} props.listing - Current listing data
 * @param {function} props.onUpdate - Partial update callback
 * @param {Array} props.amenitiesInUnit - Amenities inside unit options
 * @param {Array} props.amenitiesInBuilding - Amenities in building options
 */

import { FormTextArea, FormCheckboxGroup, SectionContainer } from '../shared';

export default function FeaturesSection({
  listing,
  onUpdate,
  amenitiesInUnit = [],
  amenitiesInBuilding = [],
  isSaving,
  onSave,
  lastSaved
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const handleAmenitiesInUnitChange = (selectedValues) => {
    onUpdate({ 'in_unit_amenity_reference_ids_json': selectedValues });
  };

  const handleAmenitiesInBuildingChange = (selectedValues) => {
    onUpdate({ 'in_building_amenity_reference_ids_json': selectedValues });
  };

  // Format amenities for checkbox group
  const formatAmenityOptions = (amenities) => {
    return amenities.map(amenity => ({
      value: amenity._id || amenity.value,
      label: amenity.name || amenity.label
    }));
  };

  return (
    <SectionContainer
      title="Features"
      onSave={onSave}
      isSaving={isSaving}
      lastSaved={lastSaved}
    >
      {/* Description of Lodging */}
      <FormTextArea
        label="Description of Lodging"
        name="Description"
        value={listing['Description']}
        onChange={handleChange}
        rows={6}
        maxLength={2000}
        placeholder="Describe your space in detail. What makes it unique? What can guests expect?"
        helpText="Be specific about what guests will have access to."
      />

      {/* Neighborhood Description */}
      <FormTextArea
        label="Neighborhood Description"
        name="neighborhood_description_by_host"
        value={listing.neighborhood_description_by_host}
        onChange={handleChange}
        rows={4}
        maxLength={1000}
        placeholder="Describe the neighborhood. What's nearby? What makes the location great?"
      />

      {/* Amenities Inside Unit */}
      <div style={styles.amenitiesSection}>
        <h3 style={styles.subheading}>Amenities Inside Unit</h3>
        {amenitiesInUnit.length > 0 ? (
          <FormCheckboxGroup
            name="amenitiesInUnit"
            options={formatAmenityOptions(amenitiesInUnit)}
            selectedValues={listing.in_unit_amenity_reference_ids_json || []}
            onChange={handleAmenitiesInUnitChange}
            columns={3}
          />
        ) : (
          <p style={styles.loadingText}>Loading amenities...</p>
        )}
      </div>

      {/* Amenities In Building / Outside Unit */}
      <div style={styles.amenitiesSection}>
        <h3 style={styles.subheading}>Amenities In Building</h3>
        {amenitiesInBuilding.length > 0 ? (
          <FormCheckboxGroup
            name="amenitiesInBuilding"
            options={formatAmenityOptions(amenitiesInBuilding)}
            selectedValues={listing.in_building_amenity_reference_ids_json || []}
            onChange={handleAmenitiesInBuildingChange}
            columns={3}
          />
        ) : (
          <p style={styles.loadingText}>Loading amenities...</p>
        )}
      </div>

      {/* Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>In-Unit Amenities:</span>
          <span style={styles.summaryValue}>
            {(listing.in_unit_amenity_reference_ids_json || []).length} selected
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Building Amenities:</span>
          <span style={styles.summaryValue}>
            {(listing.in_building_amenity_reference_ids_json || []).length} selected
          </span>
        </div>
      </div>
    </SectionContainer>
  );
}

const styles = {
  amenitiesSection: {
    marginTop: '1.5rem',
    marginBottom: '1.5rem'
  },
  subheading: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '1rem'
  },
  loadingText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  summary: {
    display: 'flex',
    gap: '2rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    marginTop: '1rem'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  summaryLabel: {
    fontSize: '0.8125rem',
    color: '#6b7280'
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  }
};
