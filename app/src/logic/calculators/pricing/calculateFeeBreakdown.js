/**
 * Fee transparency calculations (Pattern 5)
 * Implements 1.5% split fee model (0.75% platform + 0.75% landlord)
 */

export const FEE_RATES = {
  PLATFORM_RATE: 0.0075,
  LANDLORD_RATE: 0.0075,
  TOTAL_RATE: 0.015,
  TRADITIONAL_MARKUP: 0.17,
  MIN_FEE_AMOUNT: 5,
};

export const TRANSACTION_CONFIGS = {
  date_change: {
    label: 'Date Change',
    splitModel: true,
    allowUrgency: true,
    allowBuyout: false,
  },
  lease_takeover: {
    label: 'Lease Takeover',
    splitModel: true,
    allowUrgency: false,
    allowBuyout: false,
  },
  sublet: {
    label: 'Sublet',
    splitModel: false,
    allowUrgency: false,
    allowBuyout: false,
  },
  lease_renewal: {
    label: 'Lease Renewal',
    splitModel: true,
    allowUrgency: false,
    allowBuyout: false,
  },
  buyout: {
    label: 'Buyout',
    splitModel: true,
    allowUrgency: true,
    allowBuyout: true,
  },
  swap: {
    label: 'Swap',
    splitModel: false,
    allowUrgency: false,
    allowBuyout: false,
  },
};

export const formatCurrency = (amount, locale = 'en-US', currency = 'USD') => {
  const numericAmount = Number(amount ?? 0);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(numericAmount);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${Number(value ?? 0).toFixed(decimals)}%`;
};

export const validateFeeCalculation = (basePrice, transactionType = 'date_change') => {
  const errors = [];
  const warnings = [];

  if (typeof basePrice !== 'number' || Number.isNaN(basePrice)) {
    errors.push('Base price must be a valid number.');
  }

  if (basePrice <= 0) {
    errors.push('Base price must be greater than 0.');
  }

  if (!TRANSACTION_CONFIGS[transactionType]) {
    warnings.push('Unknown transaction type. Defaulting to date change.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

export const calculateFeeBreakdown = (
  basePrice,
  transactionType = 'date_change',
  options = {}
) => {
  const validation = validateFeeCalculation(basePrice, transactionType);
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  const config = TRANSACTION_CONFIGS[transactionType] || TRANSACTION_CONFIGS.date_change;
  const {
    urgencyMultiplier = 1,
    buyoutMultiplier = 1,
    applyMinimumFee = true,
  } = options;

  const adjustedPrice = roundCurrency(basePrice * urgencyMultiplier * buyoutMultiplier);
  const baseFee = roundCurrency(adjustedPrice * FEE_RATES.TOTAL_RATE);
  const totalFee = applyMinimumFee
    ? Math.max(FEE_RATES.MIN_FEE_AMOUNT, baseFee)
    : baseFee;

  const platformFee = roundCurrency(
    config.splitModel
      ? totalFee * (FEE_RATES.PLATFORM_RATE / FEE_RATES.TOTAL_RATE)
      : totalFee
  );
  const landlordShare = config.splitModel
    ? roundCurrency(totalFee * (FEE_RATES.LANDLORD_RATE / FEE_RATES.TOTAL_RATE))
    : 0;

  const totalPrice = roundCurrency(adjustedPrice + totalFee);
  const effectiveRate = adjustedPrice > 0 ? roundCurrency((totalFee / adjustedPrice) * 100) : 0;
  const savingsVsTraditional = roundCurrency(adjustedPrice * FEE_RATES.TRADITIONAL_MARKUP - totalFee);

  const components = [
    {
      label: 'Base price',
      amount: basePrice,
      type: 'base',
      description: 'Original transaction amount',
    },
  ];

  if (urgencyMultiplier > 1 && config.allowUrgency) {
    components.push({
      label: `Urgency premium (${formatPercentage((urgencyMultiplier - 1) * 100, 0)})`,
      amount: roundCurrency(basePrice * (urgencyMultiplier - 1)),
      type: 'urgency',
      description: 'Demand-based urgency adjustment',
    });
  }

  if (buyoutMultiplier > 1 && config.allowBuyout) {
    components.push({
      label: `Buyout premium (${formatPercentage((buyoutMultiplier - 1) * 100, 0)})`,
      amount: roundCurrency(basePrice * (buyoutMultiplier - 1)),
      type: 'premium',
      description: 'Additional premium for buyout transactions',
    });
  }

  components.push({
    label: 'Split Lease fee (1.5%)',
    amount: totalFee,
    type: 'fee',
    description: 'Platform operations and transaction support',
  });

  components.push({
    label: 'Total you pay',
    amount: totalPrice,
    type: 'total',
  });

  return {
    basePrice,
    adjustedPrice,
    platformFee,
    landlordShare,
    tenantShare: totalFee,
    totalFee,
    totalPrice,
    effectiveRate,
    savingsVsTraditional,
    transactionType: config.label,
    splitModel: config.splitModel,
    components,
    metadata: {
      calculatedAt: new Date().toISOString(),
      minimumFeeApplied: applyMinimumFee && totalFee === FEE_RATES.MIN_FEE_AMOUNT,
    },
  };
};

export const formatFeeBreakdownForDB = (basePrice, transactionType, options = {}) => {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType, options);

  return {
    base_price: breakdown.basePrice,
    adjusted_price: breakdown.adjustedPrice,
    platform_fee: breakdown.platformFee,
    landlord_share: breakdown.landlordShare,
    total_fee: breakdown.totalFee,
    total_price: breakdown.totalPrice,
    effective_rate: breakdown.effectiveRate,
    transaction_type: breakdown.transactionType,
    calculated_at: breakdown.metadata.calculatedAt,
  };
};
