/**
 * PreviewSplitLeasePage - Shared Helper Components
 * EditSectionButton, SectionHeader, LoadingState, ErrorState, SchedulePatternHighlight
 */

import { COLORS } from '../../../lib/constants.js';

// ============================================================================
// EDIT BUTTON COMPONENT
// ============================================================================

/**
 * Reusable edit button that appears next to section headers
 */
export function EditSectionButton({ onClick, label = 'Edit' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        background: 'transparent',
        border: `1px solid ${COLORS.PRIMARY}`,
        borderRadius: '6px',
        color: COLORS.PRIMARY,
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: '10px'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = COLORS.PRIMARY;
        e.target.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
        e.target.style.color = COLORS.PRIMARY;
      }}
    >
      <svg
        width="12"
        height="12"
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
      {label}
    </button>
  );
}

// ============================================================================
// SECTION HEADER WITH EDIT BUTTON
// ============================================================================

export function SectionHeader({ title, onEdit, editSection, focusField }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0.75rem'
    }}>
      <h2 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: COLORS.TEXT_DARK,
        margin: 0
      }}>
        {title}
      </h2>
      {onEdit && (
        <EditSectionButton onClick={() => onEdit(editSection, focusField)} />
      )}
    </div>
  );
}

// ============================================================================
// SCHEDULE PATTERN HELPERS
// ============================================================================

function calculateActualWeeks(reservationSpan, weeksOffered) {
  const pattern = (weeksOffered || 'Every week').toLowerCase().trim();

  if (pattern === 'every week' || pattern === '') {
    return {
      actualWeeks: reservationSpan,
      cycleDescription: null,
      showHighlight: false
    };
  }

  if (pattern.includes('one week on') && pattern.includes('one week off')) {
    const cycles = reservationSpan / 2;
    const actualWeeks = Math.floor(cycles);
    return {
      actualWeeks,
      cycleDescription: '1 week on, 1 week off',
      showHighlight: true,
      weeksOn: 1,
      weeksOff: 1
    };
  }

  if (pattern.includes('two weeks on') && pattern.includes('two weeks off')) {
    const cycles = reservationSpan / 4;
    const actualWeeks = Math.floor(cycles * 2);
    return {
      actualWeeks,
      cycleDescription: '2 weeks on, 2 weeks off',
      showHighlight: true,
      weeksOn: 2,
      weeksOff: 2
    };
  }

  if (pattern.includes('one week on') && pattern.includes('three weeks off')) {
    const cycles = reservationSpan / 4;
    const actualWeeks = Math.floor(cycles);
    return {
      actualWeeks,
      cycleDescription: '1 week on, 3 weeks off',
      showHighlight: true,
      weeksOn: 1,
      weeksOff: 3
    };
  }

  return {
    actualWeeks: reservationSpan,
    cycleDescription: null,
    showHighlight: false
  };
}

export function SchedulePatternHighlight({ reservationSpan, weeksOffered }) {
  const patternInfo = calculateActualWeeks(reservationSpan, weeksOffered);

  if (!patternInfo.showHighlight) {
    return null;
  }

  return (
    <div style={{
      marginTop: '8px',
      padding: '10px 12px',
      background: 'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 100%)',
      borderRadius: '8px',
      border: '1px solid #C4B5FD',
      fontSize: '13px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px'
      }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2"
        >
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
        <span style={{
          fontWeight: '600',
          color: '#5B21B6',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          fontSize: '11px'
        }}>
          {patternInfo.cycleDescription}
        </span>
      </div>
      <div style={{ color: '#6B21A8' }}>
        <span style={{ fontWeight: '700' }}>{patternInfo.actualWeeks} actual weeks</span>
        <span style={{ color: '#7C3AED' }}> of stay within {reservationSpan}-week span</span>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING AND ERROR STATES
// ============================================================================

export function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      padding: '2rem'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: `4px solid ${COLORS.BG_LIGHT}`,
        borderTop: `4px solid ${COLORS.PRIMARY}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#x26A0;&#xFE0F;</div>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: COLORS.TEXT_DARK
      }}>
        Property Not Found
      </h2>
      <p style={{
        fontSize: '1.125rem',
        color: COLORS.TEXT_LIGHT,
        marginBottom: '2rem'
      }}>
        {message || 'The property you are looking for does not exist or has been removed.'}
      </p>
      <a
        href="/listing-dashboard"
        style={{
          display: 'inline-block',
          padding: '1rem 2rem',
          background: COLORS.PRIMARY,
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = COLORS.PRIMARY_HOVER}
        onMouseLeave={(e) => e.target.style.background = COLORS.PRIMARY}
      >
        Back to Dashboard
      </a>
    </div>
  );
}

// ============================================================================
// HOST PREVIEW BANNER
// ============================================================================

export function HostPreviewBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #EDE9FE 0%, #FDF4FF 100%)',
      border: '1px solid #C4B5FD',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <div>
        <div style={{ fontWeight: '600', color: '#5B21B6', marginBottom: '2px' }}>
          Host Preview Mode
        </div>
        <div style={{ fontSize: '13px', color: '#7C3AED' }}>
          This is how guests will see your listing. Click the edit buttons to make changes.
        </div>
      </div>
    </div>
  );
}
