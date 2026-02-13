import { memo } from 'react';
import { COLORS } from '../../../lib/constants.js';

/**
 * MapLegend - Shows marker color meanings and toggle
 * Memoized to prevent unnecessary re-renders
 */
const MapLegend = memo(({ showAllListings, onToggle }) => (
  <div className="map-legend">
    <div className="legend-header">
      <h4>Map Legend</h4>
    </div>
    <div className="legend-items">
      <div className="legend-item">
        <span
          className="legend-marker"
          style={{ backgroundColor: COLORS.SECONDARY }}
        ></span>
        <span>Search Results</span>
      </div>
      <div className="legend-item">
        <span
          className="legend-marker"
          style={{ backgroundColor: COLORS.MUTED }}
        ></span>
        <span>All Active Listings</span>
      </div>
    </div>
    <label className="legend-toggle">
      <input
        type="checkbox"
        checked={showAllListings}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label="Show all listings"
        aria-expanded={showAllListings}
      />
      <span>Show all listings</span>
    </label>
  </div>
));

MapLegend.displayName = 'MapLegend';

export default MapLegend;
