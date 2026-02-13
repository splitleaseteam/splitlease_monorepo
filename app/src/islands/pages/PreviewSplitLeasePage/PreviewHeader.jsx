/**
 * PreviewHeader - Listing title, location, features grid for PreviewSplitLeasePage
 */

import { COLORS } from '../../../lib/constants.js';
import { EditSectionButton } from './PreviewHelpers.jsx';

export function PreviewHeader({ listing, handleOpenEditModal, handleLocationClick }) {
  return (
    <>
      {/* Listing Header */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: COLORS.TEXT_DARK,
            margin: 0
          }}>
            {listing.listing_title}
          </h1>
          <EditSectionButton onClick={() => handleOpenEditModal('name')} />
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          color: COLORS.TEXT_LIGHT
        }}>
          {listing.resolvedNeighborhood && listing.resolvedBorough && (
            <span
              onClick={handleLocationClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = COLORS.PRIMARY}
              onMouseLeave={(e) => e.target.style.color = COLORS.TEXT_LIGHT}
            >
              Located in {listing.resolvedNeighborhood}, {listing.resolvedBorough}
            </span>
          )}
          {listing.resolvedTypeOfSpace && (
            <span>
              {listing.resolvedTypeOfSpace} - {listing.max_guest_count} guests max
            </span>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '0' }}>
          <EditSectionButton onClick={() => handleOpenEditModal('details')} label="Edit Details" />
        </div>
        {listing.kitchen_type && (
          <div style={{ textAlign: 'center', padding: '1rem', background: COLORS.BG_LIGHT, borderRadius: '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '2rem' }}>
              <img src="/assets/images/fridge.svg" alt="Kitchen" style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>{listing.kitchen_type}</div>
          </div>
        )}
        {listing.bathroom_count !== null && (
          <div style={{ textAlign: 'center', padding: '1rem', background: COLORS.BG_LIGHT, borderRadius: '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '2rem' }}>
              <img src="/assets/images/bath.svg" alt="Bathroom" style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>{listing.bathroom_count} Bathroom(s)</div>
          </div>
        )}
        {listing.bedroom_count !== null && (
          <div style={{ textAlign: 'center', padding: '1rem', background: COLORS.BG_LIGHT, borderRadius: '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '2rem' }}>
              <img src="/assets/images/sleeping.svg" alt="Bedroom" style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>{listing.bedroom_count === 0 ? 'Studio' : `${listing.bedroom_count} Bedroom${listing.bedroom_count === 1 ? '' : 's'}`}</div>
          </div>
        )}
        {listing.bed_count !== null && (
          <div style={{ textAlign: 'center', padding: '1rem', background: COLORS.BG_LIGHT, borderRadius: '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '2rem' }}>
              <img src="/assets/images/bed.svg" alt="Bed" style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>{listing.bed_count} Bed(s)</div>
          </div>
        )}
      </section>
    </>
  );
}
