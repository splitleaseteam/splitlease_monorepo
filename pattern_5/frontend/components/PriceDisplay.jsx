/**
 * Enhanced PriceDisplay Component with Fee Transparency
 * Implements Pattern 5: Transparent Fee Breakdown
 *
 * @component PriceDisplay
 * @version 1.0.0
 * @production
 */

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Collapse,
  IconButton,
  Divider,
  Stack,
  Chip,
  Tooltip,
  Button,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
  HelpOutline as HelpIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { calculateFeeBreakdown, formatCurrency, formatPercentage } from '../utils/feeCalculations';
import { FeeExplainer } from './FeeExplainer';
import { ValueProposition } from './ValueProposition';
import { CompetitorComparison } from './CompetitorComparison';

/**
 * PriceDisplay Component
 * Displays comprehensive fee breakdown with expandable details
 */
const PriceDisplay = ({
  basePrice,
  totalPrice,
  priceType = 'monthly',
  showValueProposition = true,
  transactionType = 'date_change',
  roommateName = 'Roommate',
  variant = 'default',
  expandable = true,
  defaultExpanded = false,
  showComparison = true,
  onFeeAccepted,
  urgencyMultiplier = 1.0,
  buyoutMultiplier = 1.0,
  className,
  elevation = 3
}) => {
  // ========================================
  // State Management
  // ========================================
  const [expanded, setExpanded] = useState(defaultExpanded || variant === 'detailed');
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [acceptedFee, setAcceptedFee] = useState(false);

  // ========================================
  // Fee Calculation
  // ========================================
  const feeBreakdown = useMemo(() => {
    try {
      return calculateFeeBreakdown(basePrice, transactionType, {
        urgencyMultiplier,
        buyoutMultiplier
      });
    } catch (error) {
      console.error('Error calculating fee breakdown:', error);
      return null;
    }
  }, [basePrice, transactionType, urgencyMultiplier, buyoutMultiplier]);

  // ========================================
  // Event Handlers
  // ========================================
  const handleExpandClick = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleExplainerOpen = useCallback(() => {
    setExplainerOpen(true);
  }, []);

  const handleExplainerClose = useCallback(() => {
    setExplainerOpen(false);
  }, []);

  const handleFeeAccept = useCallback(() => {
    setAcceptedFee(true);
    if (onFeeAccepted) {
      onFeeAccepted(feeBreakdown);
    }
  }, [feeBreakdown, onFeeAccepted]);

  // ========================================
  // Error Handling
  // ========================================
  if (!feeBreakdown) {
    return (
      <Card sx={{ maxWidth: 500, margin: 2, boxShadow: elevation }} className={className}>
        <CardContent>
          <Alert severity="error">
            Unable to calculate fee breakdown. Please check the base price and try again.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const {
    platformFee,
    landlordShare,
    tenantShare,
    totalFee,
    effectiveRate,
    savingsVsTraditional,
    components,
    metadata
  } = feeBreakdown;

  // ========================================
  // Render Helpers
  // ========================================
  const renderSummaryRow = (label, value, options = {}) => {
    const { bold = false, color = 'text.primary', size = 'body2', tooltip = null } = options;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Typography variant={size} color={color} fontWeight={bold ? 600 : 400}>
          {label}
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
        <Typography variant={size} color={color} fontWeight={bold ? 700 : 600}>
          {value}
        </Typography>
      </Box>
    );
  };

  const renderBreakdownItem = (component) => {
    const getTypeColor = (type) => {
      switch (type) {
        case 'base':
          return 'text.primary';
        case 'urgency':
          return 'warning.main';
        case 'premium':
          return 'secondary.main';
        case 'fee':
          return 'primary.main';
        case 'total':
          return 'text.primary';
        default:
          return 'text.secondary';
      }
    };

    const getTypeIcon = (type) => {
      switch (type) {
        case 'urgency':
          return '⚡';
        case 'premium':
          return '⭐';
        case 'fee':
          return '💳';
        case 'total':
          return '💰';
        default:
          return null;
      }
    };

    const icon = getTypeIcon(component.type);

    return (
      <Box
        key={component.label}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          py: 1.5,
          borderBottom: component.type === 'total' ? 'none' : '1px solid',
          borderColor: 'grey.200',
          ...(component.type === 'fee' && {
            bgcolor: 'primary.50',
            px: 2,
            py: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.200',
            my: 1
          }),
          ...(component.type === 'total' && {
            pt: 2,
            mt: 1,
            borderTop: '2px solid',
            borderColor: 'grey.900'
          })
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
            <Typography
              variant={component.type === 'total' ? 'h6' : 'body2'}
              color={getTypeColor(component.type)}
              fontWeight={component.type === 'total' ? 700 : 500}
            >
              {component.label}
            </Typography>
          </Stack>
          {component.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {component.description}
            </Typography>
          )}
        </Box>
        <Typography
          variant={component.type === 'total' ? 'h5' : 'body1'}
          color={getTypeColor(component.type)}
          fontWeight={component.type === 'total' ? 700 : 600}
          sx={{ ml: 2, whiteSpace: 'nowrap' }}
        >
          {component.type === 'urgency' || component.type === 'premium' ? '+' : ''}
          {formatCurrency(component.amount)}
        </Typography>
      </Box>
    );
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <>
      <Card
        sx={{
          maxWidth: variant === 'minimal' ? 400 : 550,
          margin: 2,
          boxShadow: elevation,
          border: '1px solid',
          borderColor: 'grey.300',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: elevation + 2
          }
        }}
        className={className}
      >
        <CardContent>
          {/* ========================================
              HEADER SECTION
              ======================================== */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              💰 Price Summary
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`${effectiveRate}% fee`}
                color="success"
                size="small"
                icon={<CheckCircleIcon />}
                sx={{ fontWeight: 600 }}
              />
              {metadata.minimumFeeApplied && (
                <Tooltip title="Minimum fee applied" arrow>
                  <Chip
                    label="Min"
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* ========================================
              BASE PRICE SECTION
              ======================================== */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Base {priceType} rent:
            </Typography>
            <Typography variant="h5" color="text.primary" fontWeight={600}>
              {formatCurrency(basePrice)}
            </Typography>
          </Box>

          {/* ========================================
              FEE SECTION
              ======================================== */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Split Lease fee ({effectiveRate}%):
              </Typography>
              <Tooltip
                title="We charge 1.5% to cover money transfer, contract updates, and support"
                arrow
                placement="top"
              >
                <IconButton size="small" onClick={handleExplainerOpen}>
                  <InfoIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="h6" color="primary.main" fontWeight={600}>
              {formatCurrency(totalFee)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ========================================
              TOTAL SECTION
              ======================================== */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total you pay:
            </Typography>
            <Typography variant="h4" color="primary.dark" fontWeight={700}>
              {formatCurrency(totalPrice || feeBreakdown.totalPrice)}
            </Typography>
          </Box>

          {/* ========================================
              SAVINGS BADGE
              ======================================== */}
          {savingsVsTraditional > 0 && showValueProposition && (
            <Alert
              severity="success"
              icon={<TrendingDownIcon />}
              sx={{ mb: 2, bgcolor: 'success.50' }}
            >
              <Typography variant="body2" fontWeight={600}>
                You save {formatCurrency(savingsVsTraditional)} vs traditional 17% markup
              </Typography>
            </Alert>
          )}

          {/* ========================================
              EXPANDABLE BREAKDOWN SECTION
              ======================================== */}
          {expandable && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  bgcolor: 'grey.50',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  },
                  transition: 'background-color 0.2s'
                }}
                onClick={handleExpandClick}
              >
                <InfoIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2" color="primary" fontWeight={500} sx={{ flex: 1 }}>
                  How is the fee calculated?
                </Typography>
                <IconButton
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                  size="small"
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {/* Component Breakdown */}
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Fee Breakdown ({effectiveRate}% split model)
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    {components.map(renderBreakdownItem)}
                  </Box>

                  {/* Platform + Landlord Split */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="info.dark" gutterBottom>
                      Fee Distribution:
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Platform share (0.75%):
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(platformFee)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Landlord share (0.75%):
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(landlordShare)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={700}>
                          Total fee:
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(totalFee)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Value Proposition */}
                  {showValueProposition && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'success.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'success.200'
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} color="success.dark" gutterBottom>
                        Platform fee includes:
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {[
                          'Instant money transfer (Stripe)',
                          'Automated contract update',
                          'Calendar sync for both parties',
                          'Transaction protection',
                          '24/7 customer support'
                        ].map((item, index) => (
                          <Typography
                            key={index}
                            variant="caption"
                            color="success.dark"
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: '14px' }} />
                            {item}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Competitor Comparison */}
                  {showComparison && (
                    <CompetitorComparison
                      ourFee={effectiveRate}
                      savings={savingsVsTraditional}
                      sx={{ mt: 2 }}
                    />
                  )}

                  {/* Learn More Button */}
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={handleExplainerOpen}
                    sx={{ mt: 2, width: '100%' }}
                  >
                    Learn more about our fees
                  </Button>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* ========================================
              TENANT SHARE NOTICE
              ======================================== */}
          {tenantShare > 0 && !expanded && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'info.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.200'
              }}
            >
              <Typography variant="caption" color="info.dark">
                Note: Your share of the fee is {formatCurrency(tenantShare)} (already included above)
              </Typography>
            </Box>
          )}

          {/* ========================================
              ROOMMATE RECEIVES
              ======================================== */}
          {roommateName && landlordShare > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {roommateName} receives:
              </Typography>
              <Typography variant="body1" fontWeight={600} color="success.dark">
                {formatCurrency(basePrice - landlordShare)}
              </Typography>
            </Box>
          )}

          {/* ========================================
              ACCEPTANCE CONFIRMATION
              ======================================== */}
          {onFeeAccepted && !acceptedFee && (
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<VerifiedIcon />}
              onClick={handleFeeAccept}
              sx={{ mt: 2 }}
            >
              I understand the fee breakdown
            </Button>
          )}

          {acceptedFee && (
            <Alert severity="success" icon={<VerifiedIcon />} sx={{ mt: 2 }}>
              Fee breakdown acknowledged
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ========================================
          FEE EXPLAINER MODAL
          ======================================== */}
      <FeeExplainer
        open={explainerOpen}
        onClose={handleExplainerClose}
        feeBreakdown={feeBreakdown}
      />
    </>
  );
};

// ========================================
// PROP TYPES
// ========================================
PriceDisplay.propTypes = {
  basePrice: PropTypes.number.isRequired,
  totalPrice: PropTypes.number,
  priceType: PropTypes.oneOf(['monthly', 'daily', 'total', 'settlement']),
  showValueProposition: PropTypes.bool,
  transactionType: PropTypes.oneOf([
    'date_change',
    'lease_takeover',
    'sublet',
    'lease_renewal',
    'buyout',
    'swap'
  ]),
  roommateName: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'detailed', 'minimal']),
  expandable: PropTypes.bool,
  defaultExpanded: PropTypes.bool,
  showComparison: PropTypes.bool,
  onFeeAccepted: PropTypes.func,
  urgencyMultiplier: PropTypes.number,
  buyoutMultiplier: PropTypes.number,
  className: PropTypes.string,
  elevation: PropTypes.number
};

PriceDisplay.defaultProps = {
  priceType: 'monthly',
  showValueProposition: true,
  transactionType: 'date_change',
  roommateName: 'Roommate',
  variant: 'default',
  expandable: true,
  defaultExpanded: false,
  showComparison: true,
  urgencyMultiplier: 1.0,
  buyoutMultiplier: 1.0,
  elevation: 3
};

export default PriceDisplay;
