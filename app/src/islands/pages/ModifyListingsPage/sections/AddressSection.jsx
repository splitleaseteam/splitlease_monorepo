/**
 * AddressSection - Space Snapshot section for address and property basics
 *
 * @param {object} props - Component props
 * @param {object} props.listing - Current listing data
 * @param {function} props.onUpdate - Partial update callback
 * @param {function} [props.onVerifyAddress] - Address verification callback
 */

import { useState, useEffect } from 'react';
import { FormInput, FormDropdown, SectionContainer } from '../shared';
import {
  spaceTypes,
  bedrooms,
  beds,
  bathrooms,
  kitchenTypes,
  parkingTypes
} from '../data';

export default function AddressSection({
  listing,
  onUpdate,
  onVerifyAddress,
  isSaving,
  onSave,
  lastSaved
}) {
  const [showManualInputs, setShowManualInputs] = useState(false);

  // Reset manual inputs state when listing changes or address is validated
  useEffect(() => {
    const address = listing.address_with_lat_lng_json || {};
    if (address.validated) {
      setShowManualInputs(false);
    }
  }, [listing._id, listing.address_with_lat_lng_json?.validated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const currentAddress = listing.address_with_lat_lng_json || {};
    onUpdate({
      'address_with_lat_lng_json': {
        ...currentAddress,
        [name]: value
      }
    });
  };

  const handleVerifyClick = () => {
    if (onVerifyAddress) {
      const address = listing.address_with_lat_lng_json?.address || '';
      onVerifyAddress(address);
    }
  };

  const address = listing.address_with_lat_lng_json || {};

  // Debug logging to understand validated state
  console.log('[AddressSection] Current address state:', {
    listingId: listing._id,
    address: address,
    validated: address.validated,
    hasCoordinates: !!(address.lat && address.lng),
    showManualInputs: showManualInputs
  });

  // Prefill values for manual inputs
  const cityValue = listing.city || '';
  const boroughValue = listing.boroughName || listing.borough || '';
  const stateValue = listing.state || '';
  const zipValue = listing.zip_code || '';
  const neighborhoodValue = listing.neighborhoodName || listing.primary_neighborhood_reference_id || '';

  return (
    <SectionContainer
      title="Space Snapshot"
      onSave={onSave}
      isSaving={isSaving}
      lastSaved={lastSaved}
    >
      <div style={styles.grid}>
        {/* Listing Name */}
        <div style={styles.fullWidth}>
          <FormInput
            label="Listing Name"
            name="listing_title"
            value={listing.listing_title}
            onChange={handleChange}
            maxLength={35}
            placeholder="e.g., Cozy Studio in Brooklyn"
            helpText="Maximum 35 characters"
          />
        </div>

        {/* Full Address */}
        <div style={styles.fullWidth}>
          <FormInput
            label="Full Address"
            name="address"
            value={address.address}
            onChange={handleAddressChange}
            placeholder="123 Main St, Brooklyn, NY 11201"
          />
          {onVerifyAddress && (
            <button
              type="button"
              onClick={handleVerifyClick}
              style={styles.verifyButton}
            >
              Verify Address
            </button>
          )}
        </div>

        {/* Toggle for manual inputs - only show if address is NOT validated */}
        {!address.validated && (
          <div style={styles.fullWidth}>
            <button
              type="button"
              onClick={() => setShowManualInputs(!showManualInputs)}
              style={styles.toggleButton}
            >
              {showManualInputs ? 'âˆ’ Hide manual inputs' : '+ Show manual inputs'}
            </button>
          </div>
        )}

        {/* Manual inputs - conditionally rendered */}
        {showManualInputs && !address.validated && (
          <>
            {/* Street Number and Street Name */}
            <FormInput
              label="Street Number"
              name="number"
              value={address.number}
              onChange={handleAddressChange}
              placeholder="123"
            />
            <FormInput
              label="Street Name"
              name="street"
              value={address.street}
              onChange={handleAddressChange}
              placeholder="Main St"
            />

            {/* City and Borough */}
            <FormInput
              label="City"
              name="city"
              value={cityValue}
              onChange={handleChange}
              placeholder="New York"
            />
            <FormInput
              label="Borough"
              name="boroughName"
              value={boroughValue}
              onChange={handleChange}
              placeholder="Brooklyn"
            />

            {/* State and Zip */}
            <FormInput
              label="State"
              name="state"
              value={stateValue}
              onChange={handleChange}
              placeholder="New York"
            />
            <FormInput
              label="Zip Code"
              name="zip_code"
              value={zipValue}
              onChange={handleChange}
              placeholder="11201"
            />

            {/* Neighborhood */}
            <div style={styles.fullWidth}>
              <FormInput
                label="Neighborhood (manual input)"
                name="neighborhood_name_entered_by_host"
                value={neighborhoodValue}
                onChange={handleChange}
                placeholder="Park Slope"
              />
            </div>
          </>
        )}

        {/* Type of Space */}
        <FormDropdown
          label="Type of Space"
          name="space_type"
          value={listing.space_type}
          onChange={handleChange}
          options={spaceTypes}
          placeholder="Select type..."
        />

        {/* Bedrooms */}
        <FormDropdown
          label="Bedrooms"
          name="bedroom_count"
          value={listing.bedroom_count}
          onChange={handleChange}
          options={bedrooms}
          placeholder="Select..."
        />

        {/* Beds */}
        <FormDropdown
          label="Beds"
          name="bed_count"
          value={listing.bed_count}
          onChange={handleChange}
          options={beds}
          placeholder="Select..."
        />

        {/* Bathrooms */}
        <FormDropdown
          label="Bathrooms"
          name="bathroom_count"
          value={listing.bathroom_count}
          onChange={handleChange}
          options={bathrooms}
          placeholder="Select..."
        />

        {/* Kitchen Type */}
        <FormDropdown
          label="Kitchen Type"
          name="kitchen_type"
          value={listing.kitchen_type}
          onChange={handleChange}
          options={kitchenTypes}
          placeholder="Select..."
        />

        {/* Parking Type */}
        <FormDropdown
          label="Parking Type"
          name="parking_type"
          value={listing.parking_type}
          onChange={handleChange}
          options={parkingTypes}
          placeholder="Select..."
        />
      </div>

      {/* Coordinates display (read-only) */}
      {(address.lat || address.lng) && (
        <div style={styles.coordinatesDisplay}>
          <span style={styles.coordinatesLabel}>Coordinates:</span>
          <span style={styles.coordinatesValue}>
            {address.lat?.toFixed(6)}, {address.lng?.toFixed(6)}
          </span>
          {address.validated && (
            <span style={styles.validatedBadge}>Verified</span>
          )}
        </div>
      )}
    </SectionContainer>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
  },
  fullWidth: {
    gridColumn: '1 / -1'
  },
  verifyButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#52ABEC',
    backgroundColor: 'transparent',
    border: '1px solid #52ABEC',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  coordinatesDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem'
  },
  coordinatesLabel: {
    color: '#6b7280',
    fontWeight: '500'
  },
  coordinatesValue: {
    color: '#374151',
    fontFamily: 'monospace'
  },
  validatedBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: '0.75rem',
    fontWeight: '500',
    borderRadius: '9999px'
  },
  toggleButton: {
    width: '100%',
    padding: '0.5rem 1rem',
    marginTop: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    '&:hover': {
      backgroundColor: '#e5e7eb',
      borderColor: '#9ca3af'
    }
  }
};
