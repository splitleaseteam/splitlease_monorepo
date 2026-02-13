/**
 * PreviewGallery - Photo gallery component for PreviewSplitLeasePage
 */

import { COLORS } from '../../../lib/constants.js';

export function PhotoGallery({ photos, listingName, onPhotoClick, onEdit }) {
  const photoCount = photos.length;

  const getGridStyle = () => {
    if (photoCount === 1) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '400px',
        gap: '10px'
      };
    } else if (photoCount === 2) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '400px',
        gap: '10px'
      };
    } else if (photoCount === 3) {
      return {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '200px 200px',
        gap: '10px'
      };
    } else if (photoCount === 4) {
      return {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '133px 133px 133px',
        gap: '10px'
      };
    } else {
      return {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gridTemplateRows: '200px 200px',
        gap: '10px'
      };
    }
  };

  const imageStyle = {
    cursor: 'pointer',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative'
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Edit Photos Button */}
      {onEdit && (
        <button
          onClick={() => onEdit('photos')}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            color: COLORS.TEXT_DARK
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Photos
        </button>
      )}

      {photoCount === 1 ? (
        <div style={getGridStyle()}>
          <div onClick={() => onPhotoClick(0)} style={imageStyle}>
            <img src={photos[0]?.url || ''} alt={`${listingName} - main`} style={imgStyle} />
          </div>
        </div>
      ) : photoCount === 2 ? (
        <div style={getGridStyle()}>
          {photos.map((photo, idx) => (
            <div key={photo.id} onClick={() => onPhotoClick(idx)} style={imageStyle}>
              <img src={photo?.url || ''} alt={`${listingName} - ${idx + 1}`} style={imgStyle} />
            </div>
          ))}
        </div>
      ) : photoCount === 3 ? (
        <div style={getGridStyle()}>
          <div onClick={() => onPhotoClick(0)} style={{ ...imageStyle, gridRow: '1 / 3' }}>
            <img src={photos[0]?.url || ''} alt={`${listingName} - main`} style={imgStyle} />
          </div>
          {photos.slice(1, 3).map((photo, idx) => (
            <div key={photo.id} onClick={() => onPhotoClick(idx + 1)} style={imageStyle}>
              <img src={photo?.url || ''} alt={`${listingName} - ${idx + 2}`} style={imgStyle} />
            </div>
          ))}
        </div>
      ) : photoCount === 4 ? (
        <div style={getGridStyle()}>
          <div onClick={() => onPhotoClick(0)} style={{ ...imageStyle, gridRow: '1 / 4' }}>
            <img src={photos[0]?.url || ''} alt={`${listingName} - main`} style={imgStyle} />
          </div>
          {photos.slice(1, 4).map((photo, idx) => (
            <div key={photo.id} onClick={() => onPhotoClick(idx + 1)} style={imageStyle}>
              <img src={photo?.url || ''} alt={`${listingName} - ${idx + 2}`} style={imgStyle} />
            </div>
          ))}
        </div>
      ) : (
        <div style={getGridStyle()}>
          <div onClick={() => onPhotoClick(0)} style={{ ...imageStyle, gridRow: '1 / 3' }}>
            <img src={photos[0]?.url || ''} alt={`${listingName} - main`} style={imgStyle} />
          </div>
          {photos.slice(1, 5).map((photo, idx) => (
            <div key={photo.id} onClick={() => onPhotoClick(idx + 1)} style={imageStyle}>
              <img src={photo?.url || ''} alt={`${listingName} - ${idx + 2}`} style={imgStyle} />
              {idx === 3 && photoCount > 5 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoClick(0);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Show All Photos</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
