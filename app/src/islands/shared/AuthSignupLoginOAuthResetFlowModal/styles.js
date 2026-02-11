import { COLORS } from './constants.js';

export const styles = {
  // Modal & Overlay - Protocol Section 1: Core Architecture
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 10000
  },
  modal: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    borderRadius: '16px',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '92vh', // Protocol: 92vh max-height
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  modalContent: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch', // Protocol: smooth mobile scroll
    padding: '16px' // Protocol: standardized spacing
  },
  // Mobile grab handle (hidden by default, shown via CSS)
  grabHandle: {
    display: 'none', // Will be shown via CSS on mobile
    width: '36px',
    height: '4px',
    backgroundColor: COLORS.border,
    borderRadius: '2px',
    margin: '8px auto 0',
    flexShrink: 0
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '44px',
    height: '44px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.primaryPurple, // Protocol: Primary Purple
    borderRadius: '8px',
    transition: 'background 0.2s ease',
    zIndex: 10
  },

  // Logo
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px'
  },
  logo: {
    width: '36px',
    height: '36px',
    objectFit: 'contain'
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.textPrimary,
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: COLORS.textMuted,
    lineHeight: 1.5,
    margin: 0
  },
  subtitleAccent: {
    color: COLORS.primaryPurple, // Protocol: Primary Purple
    fontWeight: '600'
  },

  // User type cards
  userTypeCard: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: COLORS.lightPurpleBg // Protocol: Light Purple Background
  },
  userTypeCardSelected: {
    borderColor: COLORS.positivePurple, // Protocol: Positive Purple
    backgroundColor: COLORS.lightPurpleBg,
    boxShadow: '0 8px 30px rgba(49, 19, 93, 0.15)' // Protocol purple shadow
  },
  userTypeIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: COLORS.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.primaryPurple, // Protocol: Primary Purple
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  userTypeContent: {
    flex: 1
  },
  userTypeTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: '2px'
  },
  userTypeDesc: {
    fontSize: '13px',
    color: COLORS.textMuted,
    margin: 0,
    lineHeight: 1.4
  },

  // OAuth buttons container (side by side)
  oauthButtonsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '4px'
  },

  // LinkedIn button (compact, side by side)
  linkedinBtn: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #0a66c2',
    backgroundColor: '#0a66c2',
    borderRadius: '100px', // Protocol: pill-shaped
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  linkedinIcon: {
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#0a66c2',
    fontSize: '12px',
    flexShrink: 0
  },
  linkedinText: {
    textAlign: 'left'
  },
  linkedinPrimary: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white'
  },
  linkedinSecondary: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    display: 'block',
    marginTop: '2px'
  },

  // Google button (compact, side by side)
  googleBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: COLORS.lightPurpleBg, // Protocol: Light Purple Background
    border: `1px solid ${COLORS.border}`,
    borderRadius: '100px', // Protocol: pill-shaped
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: COLORS.textPrimary
  },

  // LinkedIn connected state - Protocol: NO GREEN, use Positive Purple
  linkedinConnected: {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${COLORS.positivePurple}`, // Protocol: Positive Purple
    backgroundColor: COLORS.lightPurpleBg, // Protocol: Light Purple Background
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px'
  },
  linkedinConnectedCheck: {
    width: '32px',
    height: '32px',
    backgroundColor: COLORS.positivePurple, // Protocol: Positive Purple (NO GREEN)
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },
  linkedinConnectedInfo: {
    flex: 1
  },
  linkedinConnectedName: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  linkedinConnectedEmail: {
    fontSize: '12px',
    color: COLORS.textMuted
  },
  linkedinConnectedChange: {
    fontSize: '13px',
    color: COLORS.primaryPurple, // Protocol: Primary Purple
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    transition: 'opacity 0.2s ease'
  },

  // Divider
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '20px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: COLORS.border
  },
  dividerText: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    fontWeight: '500'
  },

  // Form elements
  formRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  formGroup: {
    flex: 1,
    marginBottom: '16px'
  },
  formGroupInRow: {
    flex: 1,
    marginBottom: 0
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.primaryPurple, // Protocol: Primary Purple for labels
    marginBottom: '6px'
  },
  prefillBadge: {
    fontSize: '11px',
    color: COLORS.positivePurple, // Protocol: Positive Purple (NO GREEN)
    marginLeft: '6px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    color: COLORS.textPrimary,
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: COLORS.lightPurpleBg, // Protocol: Light Purple Background
    fontFamily: 'inherit'
  },
  inputFocused: {
    borderColor: COLORS.primaryPurple, // Protocol: Primary Purple
    backgroundColor: COLORS.white
  },
  inputError: {
    borderColor: COLORS.emergencyRed // Protocol: Emergency Red
  },
  inputSuccess: {
    borderColor: COLORS.positivePurple // Protocol: Positive Purple (NO GREEN)
  },
  inputPrefilled: {
    backgroundColor: COLORS.lightPurpleBg,
    borderColor: COLORS.border
  },
  helperText: {
    fontSize: '12px',
    color: COLORS.textMuted,
    marginTop: '6px',
    lineHeight: 1.4
  },

  // Select
  select: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    color: COLORS.textPrimary,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: COLORS.lightPurpleBg,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit'
  },

  // Password field
  passwordWrapper: {
    position: 'relative'
  },
  inputWithIcon: {
    paddingRight: '44px'
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    transition: 'color 0.2s ease'
  },

  // Password requirements - Protocol: NO GREEN, use Positive Purple
  passwordRequirements: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: COLORS.lightPurpleBg, // Protocol: Light Purple Background
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px'
  },
  requirement: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: COLORS.textMuted,
    marginBottom: '6px'
  },
  requirementLast: {
    marginBottom: 0
  },
  requirementMet: {
    color: COLORS.positivePurple // Protocol: Positive Purple (NO GREEN)
  },
  requirementIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Buttons - Protocol Section 4B: pill-shaped (100px radius)
  buttonPrimary: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: COLORS.primaryPurple, // Protocol: Primary Purple
    color: 'white',
    border: 'none',
    borderRadius: '100px', // Protocol: pill-shaped
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s ease, box-shadow 0.2s ease',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit'
  },
  buttonPrimaryHover: {
    backgroundColor: COLORS.secondaryPurple, // Protocol: Secondary Purple for hover
    boxShadow: '0 4px 12px rgba(49, 19, 93, 0.25)'
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  // Ghost button - Protocol Section 4B
  buttonSecondary: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '100px', // Protocol: pill-shaped
    fontSize: '14px',
    fontWeight: '500',
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Back button - Ghost style
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    background: 'transparent',
    border: `1px solid ${COLORS.border}`, // Protocol: Ghost button
    borderRadius: '100px', // Protocol: pill-shaped
    color: COLORS.textSecondary,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    padding: '12px',
    marginTop: '8px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },

  // Footer link
  footerLink: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.border}`,
    fontSize: '13px',
    color: COLORS.textMuted
  },
  link: {
    color: COLORS.primaryPurple, // Protocol: Primary Purple
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 'inherit',
    fontWeight: '500',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s ease'
  },
  linkText: {
    textAlign: 'center',
    marginTop: '1rem'
  },

  // Legal text
  termsText: {
    fontSize: '12px',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: '16px',
    lineHeight: 1.5
  },

  // Success state - Protocol: NO GREEN, use Positive Purple
  successIcon: {
    width: '80px',
    height: '80px',
    background: `linear-gradient(135deg, ${COLORS.lightPurpleBg} 0%, rgba(91, 95, 207, 0.1) 100%)`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: COLORS.positivePurple // Protocol: Positive Purple (NO GREEN)
  },

  // Error box - Protocol: Emergency Red outlined only
  errorBox: {
    padding: '12px',
    backgroundColor: COLORS.white, // Protocol: white/transparent bg for danger
    border: `1px solid ${COLORS.emergencyRed}`, // Protocol: Emergency Red outlined
    borderRadius: '8px',
    marginBottom: '16px'
  },
  errorText: {
    fontSize: '13px',
    color: COLORS.emergencyRed,
    margin: 0
  },
  inlineError: {
    fontSize: '12px',
    color: COLORS.emergencyRed,
    marginTop: '6px'
  },

  // Date inputs (for birthday)
  dateInputsRow: {
    display: 'flex',
    gap: '8px'
  },
  dateSelect: {
    flex: 1,
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: COLORS.lightPurpleBg,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },

  // Section label
  sectionLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: '12px'
  },

  // Required note
  requiredNote: {
    fontSize: '12px',
    color: COLORS.textMuted,
    marginBottom: '16px'
  }
};
