/**
 * CompetitorComparison Component
 * Visual comparison chart showing fee advantages
 *
 * @component CompetitorComparison
 * @version 1.0.0
 * @production
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Stack,
  Paper,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../utils/feeCalculations';

/**
 * Competitor fee data
 */
const COMPETITORS = [
  {
    name: 'Airbnb',
    fee: 17, // Average of 14-20%
    feeRange: '14-20%',
    color: '#FF5A5F',
    type: 'Short-term rental',
    marketPosition: 'Industry leader'
  },
  {
    name: 'VRBO',
    fee: 9, // Average of 6-12%
    feeRange: '6-12%',
    color: '#0066CC',
    type: 'Vacation rental',
    marketPosition: 'Major competitor'
  },
  {
    name: 'Traditional Agent',
    fee: 17,
    feeRange: '15-20%',
    color: '#8B4513',
    type: 'Real estate',
    marketPosition: 'Traditional model'
  },
  {
    name: 'Zillow Rental',
    fee: 5,
    feeRange: '3-7%',
    color: '#0074E4',
    type: 'Rental listing',
    marketPosition: 'Listing service'
  },
  {
    name: 'Split Lease',
    fee: 1.5,
    feeRange: '1.5%',
    color: '#4CAF50',
    type: 'Lease management',
    marketPosition: 'You are here',
    isUs: true
  }
];

/**
 * CompetitorComparison Component
 */
export const CompetitorComparison = ({ ourFee = 1.5, savings = 0, detailed = false, sx }) => {
  // Calculate max fee for scaling
  const maxFee = Math.max(...COMPETITORS.map(c => c.fee));

  // Calculate comparison metrics
  const avgCompetitorFee =
    COMPETITORS.filter(c => !c.isUs).reduce((sum, c) => sum + c.fee, 0) /
    COMPETITORS.filter(c => !c.isUs).length;

  const savingsPercentage = ((avgCompetitorFee - ourFee) / avgCompetitorFee) * 100;

  return (
    <Box sx={{ ...sx }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Industry Fee Comparison
        </Typography>
        <Chip
          icon={<TrendingDownIcon />}
          label={`${savingsPercentage.toFixed(0)}% lower`}
          color="success"
          size="small"
        />
      </Stack>

      {/* Comparison Bars */}
      <Stack spacing={2}>
        {COMPETITORS.map((competitor, index) => (
          <Box
            key={competitor.name}
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: competitor.isUs ? 'success.50' : 'grey.50',
              border: '1px solid',
              borderColor: competitor.isUs ? 'success.main' : 'grey.200',
              ...(competitor.isUs && {
                boxShadow: 2
              })
            }}
          >
            {/* Competitor Name and Fee */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body2"
                  fontWeight={competitor.isUs ? 700 : 500}
                  color={competitor.isUs ? 'success.dark' : 'text.primary'}
                >
                  {competitor.name}
                </Typography>
                {competitor.isUs && (
                  <CheckCircleIcon color="success" fontSize="small" />
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body2"
                  fontWeight={competitor.isUs ? 700 : 600}
                  color={competitor.isUs ? 'success.dark' : 'text.primary'}
                >
                  {competitor.feeRange}
                </Typography>
                {!competitor.isUs && competitor.fee > ourFee * 2 && (
                  <ErrorIcon color="error" fontSize="small" />
                )}
              </Stack>
            </Stack>

            {/* Progress Bar */}
            <Box sx={{ position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={(competitor.fee / maxFee) * 100}
                sx={{
                  height: competitor.isUs ? 12 : 8,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: competitor.isUs ? 'success.main' : competitor.color,
                    borderRadius: 1
                  }
                }}
              />
              {competitor.isUs && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -2,
                    left: `${(competitor.fee / maxFee) * 100}%`,
                    transform: 'translateX(-50%)',
                    color: 'success.dark',
                    fontWeight: 700,
                    fontSize: '10px'
                  }}
                >
                  Best Value
                </Typography>
              )}
            </Box>

            {/* Additional Info (Detailed View) */}
            {detailed && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {competitor.type}
                </Typography>
                {!competitor.isUs && (
                  <Typography variant="caption" color="error.main" fontWeight={600}>
                    +{formatCurrency((competitor.fee - ourFee) * 100)} more on $10k
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        ))}
      </Stack>

      {/* Savings Summary */}
      {savings > 0 && (
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <TrendingDownIcon color="success" />
            <Typography variant="body2" color="success.dark" fontWeight={600}>
              You save {formatCurrency(savings)} vs. industry average
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Detailed Metrics Grid */}
      {detailed && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" color="success.main" fontWeight={700}>
                  {ourFee}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Our Fee
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" color="error.main" fontWeight={700}>
                  {avgCompetitorFee.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Competitor
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" color="success.dark" fontWeight={700}>
                  {savingsPercentage.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="success.dark">
                  You Save
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Methodology Note */}
      {detailed && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Methodology:</strong> Competitor fees based on published rates as of 2026.
            Actual fees may vary by location, transaction type, and timing. Our 1.5% fee is
            fixed and transparent.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

CompetitorComparison.propTypes = {
  ourFee: PropTypes.number,
  savings: PropTypes.number,
  detailed: PropTypes.bool,
  sx: PropTypes.object
};

CompetitorComparison.defaultProps = {
  ourFee: 1.5,
  savings: 0,
  detailed: false,
  sx: {}
};

export default CompetitorComparison;
