/**
 * ListingDetailsSection Component
 *
 * Renders the listing details: features grid, description, storage, neighborhood,
 * commute, amenities, house rules, map, and cancellation policy.
 *
 * @component
 * @architecture Presentational Component - receives all data via props
 */

import { COLORS } from '../../../../lib/constants.js';
import GoogleMap from '../../../shared/GoogleMap.jsx';

interface ListingDetailsSectionProps {
  listing: any;
  isMobile: boolean;
  expandedSections: { description: boolean; neighborhood: boolean; blockedDates: boolean };
  toggleSection: (section: string) => void;
  // Map-related
  mapSectionRef: React.RefObject<any>;
  mapRef: React.RefObject<any>;
  shouldLoadMap: boolean;
  mapListings: any[];
  // Section refs
  commuteSectionRef: React.RefObject<any>;
  amenitiesSectionRef: React.RefObject<any>;
  houseRulesSectionRef: React.RefObject<any>;
}

export function ListingDetailsSection({
  listing,
  isMobile,
  expandedSections,
  toggleSection,
  mapSectionRef,
  mapRef,
  shouldLoadMap,
  mapListings,
  commuteSectionRef,
  amenitiesSectionRef,
  houseRulesSectionRef,
}: ListingDetailsSectionProps) {
  return (
    <>
      {/* Features Grid */}
      <section style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: isMobile ? '0.5rem' : '1rem'
      }}>
        {listing.kitchen_type && (
          <div style={{ textAlign: 'center', padding: isMobile ? '0.75rem' : '1rem', background: COLORS.BG_LIGHT, borderRadius: isMobile ? '6px' : '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? '1.5rem' : '2rem' }}>
              <img src="/assets/images/fridge.svg" alt="Kitchen" style={{ width: isMobile ? '1.5rem' : '2rem', height: isMobile ? '1.5rem' : '2rem' }} />
            </div>
            <div style={{ fontSize: isMobile ? '0.8125rem' : '1rem' }}>{listing.kitchen_type}</div>
          </div>
        )}
        {listing.bathroom_count !== null && (
          <div style={{ textAlign: 'center', padding: isMobile ? '0.75rem' : '1rem', background: COLORS.BG_LIGHT, borderRadius: isMobile ? '6px' : '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? '1.5rem' : '2rem' }}>
              <img src="/assets/images/bath.svg" alt="Bathroom" style={{ width: isMobile ? '1.5rem' : '2rem', height: isMobile ? '1.5rem' : '2rem' }} />
            </div>
            <div style={{ fontSize: isMobile ? '0.8125rem' : '1rem' }}>{listing.bathroom_count} Bathroom(s)</div>
          </div>
        )}
        {listing.bedroom_count !== null && (
          <div style={{ textAlign: 'center', padding: isMobile ? '0.75rem' : '1rem', background: COLORS.BG_LIGHT, borderRadius: isMobile ? '6px' : '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? '1.5rem' : '2rem' }}>
              <img src="/assets/images/sleeping.svg" alt="Bedroom" style={{ width: isMobile ? '1.5rem' : '2rem', height: isMobile ? '1.5rem' : '2rem' }} />
            </div>
            <div style={{ fontSize: isMobile ? '0.8125rem' : '1rem' }}>{listing.bedroom_count === 0 ? 'Studio' : `${listing.bedroom_count} Bedroom${listing.bedroom_count === 1 ? '' : 's'}`}</div>
          </div>
        )}
        {listing.bed_count !== null && (
          <div style={{ textAlign: 'center', padding: isMobile ? '0.75rem' : '1rem', background: COLORS.BG_LIGHT, borderRadius: isMobile ? '6px' : '8px' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? '1.5rem' : '2rem' }}>
              <img src="/assets/images/bed.svg" alt="Bed" style={{ width: isMobile ? '1.5rem' : '2rem', height: isMobile ? '1.5rem' : '2rem' }} />
            </div>
            <div style={{ fontSize: isMobile ? '0.8125rem' : '1rem' }}>{listing.bed_count} Bed(s)</div>
          </div>
        )}
      </section>

      {/* Description */}
      <section style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          marginBottom: isMobile ? '0.5rem' : '0.75rem',
          color: COLORS.TEXT_DARK
        }}>
          Description of Lodging
        </h2>
        <p style={{
          lineHeight: '1.6',
          color: COLORS.TEXT_LIGHT,
          whiteSpace: 'pre-wrap'
        }}>
          {expandedSections.description
            ? listing.listing_description
            : listing.listing_description?.slice(0, 360)}
          {listing.listing_description?.length > 360 && !expandedSections.description && '...'}
        </p>
        {listing.listing_description?.length > 360 && (
          <button
            onClick={() => toggleSection('description')}
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: COLORS.PRIMARY,
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            {expandedSections.description ? 'Read Less' : 'Read More'}
          </button>
        )}
      </section>

      {/* Storage Section */}
      {listing.storageOption && (
        <section style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            Storage
          </h2>
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            background: COLORS.BG_LIGHT,
            borderRadius: isMobile ? '8px' : '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'start',
              gap: '1rem'
            }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ minWidth: '24px', minHeight: '24px', color: COLORS.PRIMARY }}
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  {listing.storageOption.title}
                </div>
                <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.9375rem' }}>
                  {listing.storageOption.summaryGuest ||
                   'Store your things between stays, ready when you return.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Neighborhood Description */}
      {listing.neighborhood_description_by_host && (
        <section style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            Neighborhood
          </h2>
          <p style={{
            lineHeight: '1.6',
            color: COLORS.TEXT_LIGHT,
            whiteSpace: 'pre-wrap'
          }}>
            {expandedSections.neighborhood
              ? listing.neighborhood_description_by_host
              : listing.neighborhood_description_by_host?.slice(0, 500)}
            {listing.neighborhood_description_by_host?.length > 500 &&
             !expandedSections.neighborhood && '...'}
          </p>
          {listing.neighborhood_description_by_host?.length > 500 && (
            <button
              onClick={() => toggleSection('neighborhood')}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: COLORS.PRIMARY,
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
            >
              {expandedSections.neighborhood ? 'Read Less' : 'Read More'}
            </button>
          )}
        </section>
      )}

      {/* Commute Section */}
      {(listing.parkingOption || listing.commute_time_to_nearest_transit) && (
        <section ref={commuteSectionRef} style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            Commute
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {listing.parkingOption && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ minWidth: '24px', minHeight: '24px', color: COLORS.PRIMARY }}
                >
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path>
                  <circle cx="6.5" cy="16.5" r="2.5"></circle>
                  <circle cx="16.5" cy="16.5" r="2.5"></circle>
                </svg>
                <div>
                  <div style={{ fontWeight: '600' }}>{listing.parkingOption.label}</div>
                  <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.875rem' }}>
                    Convenient parking for your car
                  </div>
                </div>
              </div>
            )}
            {listing.commute_time_to_nearest_transit && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ minWidth: '24px', minHeight: '24px', color: COLORS.PRIMARY }}
                >
                  <rect x="3" y="6" width="18" height="11" rx="2"></rect>
                  <path d="M7 15h.01M17 15h.01M8 6v5M16 6v5"></path>
                  <path d="M3 12h18"></path>
                </svg>
                <div>
                  <div style={{ fontWeight: '600' }}>{listing.commute_time_to_nearest_transit} to Metro</div>
                  <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.875rem' }}>
                    Quick walk to nearest station
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Amenities Section */}
      {(listing.amenitiesInUnit?.length > 0 || listing.safetyFeatures?.length > 0) && (
        <section ref={amenitiesSectionRef} style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            Amenities
          </h2>

          {listing.amenitiesInUnit?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: COLORS.TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In-Unit</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: isMobile ? '0.5rem' : '0.75rem'
              }}>
                {listing.amenitiesInUnit.map(amenity => (
                  <div
                    key={amenity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: isMobile ? '0.375rem' : '0.5rem'
                    }}
                  >
                    {amenity.icon && (
                      <img src={amenity.icon} alt="" style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
                    )}
                    <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {listing.safetyFeatures?.length > 0 && (
            <div>
              <h3 style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: COLORS.TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Safety Features</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: isMobile ? '0.5rem' : '0.75rem'
              }}>
                {listing.safetyFeatures.map(feature => (
                  <div
                    key={feature.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: isMobile ? '0.375rem' : '0.5rem'
                    }}
                  >
                    {feature.icon && (
                      <img src={feature.icon} alt="" style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
                    )}
                    <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* House Rules */}
      {listing.houseRules?.length > 0 && (
        <section ref={houseRulesSectionRef} style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            House Rules
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {listing.houseRules.map(rule => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.375rem' : '0.5rem'
                }}
              >
                {rule.icon && (
                  <img src={rule.icon} alt="" style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
                )}
                <span style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>{rule.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map Section */}
      <section ref={mapSectionRef} style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '600',
          marginBottom: isMobile ? '0.5rem' : '0.75rem',
          color: COLORS.TEXT_DARK
        }}>
          Map
        </h2>
        <div style={{
          height: isMobile ? '300px' : '400px',
          borderRadius: isMobile ? '8px' : '12px',
          overflow: 'hidden',
          border: `1px solid ${COLORS.BG_LIGHT}`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.BG_LIGHT
        }}>
          {shouldLoadMap ? (
            <GoogleMap
              ref={mapRef}
              listings={mapListings}
              filteredListings={mapListings}
              selectedBorough={listing.resolvedBorough}
              simpleMode={true}
              initialZoom={17}
              disableAutoZoom={false}
            />
          ) : (
            <div style={{
              color: COLORS.TEXT_LIGHT,
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              Loading map...
            </div>
          )}
        </div>
      </section>

      {/* Cancellation Policy */}
      {listing.cancellationPolicy && (
        <section style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            color: COLORS.TEXT_DARK
          }}>
            Cancellation Policy
          </h2>
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            background: COLORS.BG_LIGHT,
            borderRadius: isMobile ? '8px' : '12px',
            border: `1px solid ${COLORS.BG_LIGHT}`
          }}>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '600',
              marginBottom: isMobile ? '0.75rem' : '1rem',
              color: COLORS.PRIMARY
            }}>
              {listing.cancellationPolicy.display}
            </div>

            {/* Best Case */}
            {listing.cancellationPolicy.bestCaseText && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: '600', color: '#16a34a', marginBottom: '0.25rem' }}>
                  {'\u2714'} Best Case
                </div>
                <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.9375rem', lineHeight: '1.6' }}>
                  {listing.cancellationPolicy.bestCaseText}
                </div>
              </div>
            )}

            {/* Medium Case */}
            {listing.cancellationPolicy.mediumCaseText && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: '600', color: '#ea580c', marginBottom: '0.25rem' }}>
                  {'\u26a0'} Medium Case
                </div>
                <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.9375rem', lineHeight: '1.6' }}>
                  {listing.cancellationPolicy.mediumCaseText}
                </div>
              </div>
            )}

            {/* Worst Case */}
            {listing.cancellationPolicy.worstCaseText && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem' }}>
                  {'\u2715'} Worst Case
                </div>
                <div style={{ color: COLORS.TEXT_LIGHT, fontSize: '0.9375rem', lineHeight: '1.6' }}>
                  {listing.cancellationPolicy.worstCaseText}
                </div>
              </div>
            )}

            {/* Summary Texts */}
            {listing.cancellationPolicy.summaryTexts && Array.isArray(listing.cancellationPolicy.summaryTexts) && listing.cancellationPolicy.summaryTexts.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid #e5e7eb` }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Summary:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: COLORS.TEXT_LIGHT, fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {listing.cancellationPolicy.summaryTexts.map((text, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{text}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Link to full policy page */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid #e5e7eb` }}>
              <a
                href="/policies#cancellation-and-refund-policy"
                style={{
                  color: COLORS.PRIMARY,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
              >
                View full cancellation policy {'\u2192'}
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
