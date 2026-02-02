/**
 * Pattern 5: Fee Transparency - Main Export File
 * Entry point for all fee transparency components and utilities
 *
 * @module pattern-5-frontend
 * @version 1.0.0
 * @production
 */

// ============================================================================
// COMPONENTS
// ============================================================================

// Core Components
export { default as PriceDisplay } from './components/PriceDisplay';
export { default as FeeExplainer } from './components/FeeExplainer';
export { default as ValueProposition } from './components/ValueProposition';
export { default as CompetitorComparison } from './components/CompetitorComparison';
export { default as PaymentStep } from './components/PaymentStep';
export { default as DateChangeRequestManager } from './components/DateChangeRequestManager';

// ============================================================================
// UTILITIES
// ============================================================================

// Fee Calculation Utilities
export {
  calculateFeeBreakdown,
  calculateTotalPrice,
  formatFeeBreakdownForDB,
  calculateLandlordNetReceipt,
  calculateTenantPayment,
  validateFeeCalculation,
  compareFeesByType,
  calculateBatchFees,
  formatCurrency,
  formatPercentage,
  formatBreakdownForDisplay,
  FEE_CONSTANTS,
  SUPPORTED_TRANSACTION_TYPES,
  getTransactionConfig
} from './utils/feeCalculations';

// ============================================================================
// HOOKS
// ============================================================================

// Fee Calculation Hooks
export {
  useFeeCalculation,
  useBatchFeeCalculation,
  useFeeComparison,
  useFeeCalculationHistory
} from './hooks/useFeeCalculation';

// Fee Visibility Hooks
export {
  useFeeVisibility,
  useFeeComparisonTracking,
  useFeeMessagingTest,
  useFeeAcceptanceFlow
} from './hooks/useFeeVisibility';

// ============================================================================
// TYPES (for TypeScript projects)
// ============================================================================

/**
 * @typedef {Object} FeeBreakdown
 * @property {number} basePrice - Base price before fees
 * @property {number} adjustedPrice - Price after multipliers
 * @property {number} platformFee - Platform's share (0.75%)
 * @property {number} landlordShare - Landlord's share (0.75%)
 * @property {number} tenantShare - Tenant's payment
 * @property {number} totalFee - Total fee (1.5%)
 * @property {number} totalPrice - Final price including fees
 * @property {number} effectiveRate - Effective rate as percentage
 * @property {number} savingsVsTraditional - Savings vs 17% traditional fee
 * @property {string} transactionType - Type of transaction
 * @property {Object} breakdown - Detailed rate breakdown
 * @property {Object} multipliers - Applied multipliers
 * @property {Array} components - Price components
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} FeeCalculationOptions
 * @property {number} [urgencyMultiplier=1.0] - Urgency premium multiplier
 * @property {number} [buyoutMultiplier=1.0] - Buyout premium multiplier
 * @property {boolean} [applyMinimumFee=true] - Apply minimum fee threshold
 * @property {number} [swapSettlement=0] - Settlement amount for swaps
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<string>} errors - Validation errors
 * @property {Array<string>} warnings - Validation warnings
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Fee structure constants
 * @constant
 */
export const FEE_STRUCTURE = {
  PLATFORM_RATE: 0.0075,      // 0.75%
  LANDLORD_RATE: 0.0075,      // 0.75%
  TOTAL_RATE: 0.015,          // 1.5%
  TRADITIONAL_MARKUP: 0.17,   // 17%
  MIN_FEE_AMOUNT: 5.00,       // $5 minimum
  VERSION: '1.5_split_model_v1'
};

/**
 * Supported transaction types
 * @constant
 */
export const TRANSACTION_TYPES = {
  DATE_CHANGE: 'date_change',
  LEASE_TAKEOVER: 'lease_takeover',
  SUBLET: 'sublet',
  LEASE_RENEWAL: 'lease_renewal',
  BUYOUT: 'buyout',
  SWAP: 'swap'
};

/**
 * User experience levels
 * @constant
 */
export const USER_EXPERIENCE_LEVELS = {
  NEW: 'new',                 // 0 transactions
  BEGINNER: 'beginner',       // 1-4 transactions
  INTERMEDIATE: 'intermediate', // 5-19 transactions
  EXPERT: 'expert'            // 20+ transactions
};

/**
 * Display variants
 * @constant
 */
export const DISPLAY_VARIANTS = {
  MINIMAL: 'minimal',         // Compact display
  DEFAULT: 'default',         // Standard breakdown
  DETAILED: 'detailed'        // Full explanation
};

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-01-28';
export const PATTERN_NAME = 'Fee Transparency (Pattern 5)';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize fee transparency module with configuration
 *
 * @param {Object} config - Configuration options
 * @param {boolean} config.enableAnalytics - Enable analytics tracking
 * @param {string} config.stripePublicKey - Stripe publishable key
 * @param {string} config.apiEndpoint - API endpoint for payment processing
 * @returns {Object} Configured module
 */
export const initializeFeeTransparency = (config = {}) => {
  const {
    enableAnalytics = true,
    stripePublicKey = null,
    apiEndpoint = '/api',
    locale = 'en-US',
    currency = 'USD'
  } = config;

  // Validate configuration
  if (!stripePublicKey) {
    console.warn('Fee Transparency: Stripe public key not provided. Payment processing will be disabled.');
  }

  // Set global configuration
  if (typeof window !== 'undefined') {
    window.__FEE_TRANSPARENCY_CONFIG__ = {
      enableAnalytics,
      stripePublicKey,
      apiEndpoint,
      locale,
      currency,
      version: VERSION,
      initialized: true
    };
  }

  return {
    config: {
      enableAnalytics,
      stripePublicKey,
      apiEndpoint,
      locale,
      currency
    },
    version: VERSION,
    buildDate: BUILD_DATE
  };
};

/**
 * Get current configuration
 *
 * @returns {Object|null} Current configuration or null if not initialized
 */
export const getConfiguration = () => {
  if (typeof window !== 'undefined') {
    return window.__FEE_TRANSPARENCY_CONFIG__ || null;
  }
  return null;
};

/**
 * Check if module is initialized
 *
 * @returns {boolean} True if initialized
 */
export const isInitialized = () => {
  const config = getConfiguration();
  return config && config.initialized === true;
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Components
  PriceDisplay,
  FeeExplainer,
  ValueProposition,
  CompetitorComparison,
  PaymentStep,
  DateChangeRequestManager,

  // Utilities
  calculateFeeBreakdown,
  calculateTotalPrice,
  formatCurrency,
  validateFeeCalculation,

  // Hooks
  useFeeCalculation,
  useFeeVisibility,

  // Constants
  FEE_STRUCTURE,
  TRANSACTION_TYPES,
  VERSION,

  // Initialization
  initialize: initializeFeeTransparency,
  getConfiguration,
  isInitialized
};
