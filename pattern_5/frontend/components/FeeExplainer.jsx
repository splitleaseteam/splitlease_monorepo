/**
 * FeeExplainer Modal Component
 * Provides comprehensive information about platform fees
 *
 * @component FeeExplainer
 * @version 1.0.0
 * @production
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Update as UpdateIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../utils/feeCalculations';
import { CompetitorComparison } from './CompetitorComparison';

/**
 * Platform services included in the fee
 */
const PLATFORM_SERVICES = [
  {
    icon: <MoneyIcon color="primary" />,
    title: 'Instant Money Transfer',
    description: 'Secure Stripe payment processing. Money moves instantly between parties with full transaction protection.',
    includedInFee: true,
    estimatedValue: '$15-25'
  },
  {
    icon: <ReceiptIcon color="primary" />,
    title: 'Contract Amendment',
    description: 'Automated legal updates to your lease agreement, reviewed and validated to ensure compliance.',
    includedInFee: true,
    estimatedValue: '$50-100'
  },
  {
    icon: <CalendarIcon color="primary" />,
    title: 'Calendar Sync',
    description: 'Both calendars updated automatically in real-time. No manual coordination needed.',
    includedInFee: true,
    estimatedValue: '$10-15'
  },
  {
    icon: <SecurityIcon color="primary" />,
    title: 'Transaction Protection',
    description: 'Dispute resolution and payment guarantees. We protect both parties throughout the process.',
    includedInFee: true,
    estimatedValue: '$20-40'
  },
  {
    icon: <SupportIcon color="primary" />,
    title: '24/7 Support',
    description: 'Human support team available for any issues. Average response time under 2 hours.',
    includedInFee: true,
    estimatedValue: '$15-30'
  },
  {
    icon: <UpdateIcon color="primary" />,
    title: 'Transaction History',
    description: 'Complete records for taxes and expense reports. Export anytime, keep forever.',
    includedInFee: true,
    estimatedValue: '$5-10'
  }
];

/**
 * Tab Panel Component
 */
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fee-tabpanel-${index}`}
      aria-labelledby={`fee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

/**
 * FeeExplainer Component
 */
export const FeeExplainer = ({ open, onClose, feeBreakdown }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Default values if no breakdown provided
  const exampleBreakdown = feeBreakdown || {
    basePrice: 2000,
    platformFee: 15,
    landlordShare: 15,
    totalFee: 30,
    totalPrice: 2030,
    effectiveRate: 1.5,
    savingsVsTraditional: 310
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      {/* ========================================
          DIALOG HEADER
          ======================================== */}
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Our Platform Fee: 1.5%
            </Typography>
          </Stack>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* ========================================
          DIALOG CONTENT
          ======================================== */}
      <DialogContent dividers>
        {/* Philosophy Statement */}
        <Box sx={{ mb: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="body1" paragraph>
            We charge a small percentage to keep the platform running and ensure every
            transaction is smooth, secure, and supported. Our fee is{' '}
            <strong>10x lower than traditional alternatives</strong> while providing premium service.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label="No hidden fees"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label="Full transparency"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label="Industry-low rates"
              color="success"
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="fee information tabs"
            variant="fullWidth"
          >
            <Tab label="What's Included" id="fee-tab-0" />
            <Tab label="Example Calculation" id="fee-tab-1" />
            <Tab label="Industry Comparison" id="fee-tab-2" />
            <Tab label="Our Philosophy" id="fee-tab-3" />
          </Tabs>
        </Box>

        {/* ========================================
            TAB 1: WHAT'S INCLUDED
            ======================================== */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Platform Services Included in Your Fee
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Every transaction includes these premium services at no additional cost:
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {PLATFORM_SERVICES.map((service, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: 'primary.main'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: 'primary.50',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {service.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          {service.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {service.description}
                        </Typography>
                        <Chip
                          label={`Value: ${service.estimatedValue}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Total Value Calculation */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} color="success.dark" gutterBottom>
              Total Service Value: $115-$220 per transaction
            </Typography>
            <Typography variant="body2" color="success.dark">
              You're getting premium services worth hundreds of dollars for just 1.5% of your
              transaction. That's incredible value.
            </Typography>
          </Box>
        </TabPanel>

        {/* ========================================
            TAB 2: EXAMPLE CALCULATION
            ======================================== */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            How We Calculate Your Fee
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Our fee structure is simple and transparent. Here's exactly how it works:
          </Typography>

          {/* Example Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Item
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Amount
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Transaction amount</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {formatCurrency(exampleBreakdown.basePrice)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    Platform share (0.75%)
                    <Typography variant="caption" color="text.secondary" display="block">
                      Processing, support, and infrastructure
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(exampleBreakdown.platformFee)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    Landlord share (0.75%)
                    <Typography variant="caption" color="text.secondary" display="block">
                      Landlord's portion of transaction fee
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(exampleBreakdown.landlordShare)}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'primary.50' }}>
                  <TableCell>
                    <Typography fontWeight={600}>Total platform fee (1.5%)</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="primary">
                      {formatCurrency(exampleBreakdown.totalFee)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'grey.900' }}>
                  <TableCell>
                    <Typography fontWeight={700} color="white">
                      You pay (total)
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="white" variant="h6">
                      {formatCurrency(exampleBreakdown.totalPrice)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'success.50' }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TrendingDownIcon fontSize="small" color="success" />
                      <Typography fontWeight={600} color="success.dark">
                        Savings vs. traditional 17% fee
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="success.dark">
                      {formatCurrency(exampleBreakdown.savingsVsTraditional)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fee Breakdown Visual */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Fee Distribution
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Platform (0.75%)</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(exampleBreakdown.platformFee)}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: '50%',
                    height: 8,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    mt: 0.5
                  }}
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Landlord (0.75%)</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(exampleBreakdown.landlordShare)}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: '50%',
                    height: 8,
                    bgcolor: 'secondary.main',
                    borderRadius: 1,
                    mt: 0.5
                  }}
                />
              </Box>
            </Stack>
          </Box>
        </TabPanel>

        {/* ========================================
            TAB 3: INDUSTRY COMPARISON
            ======================================== */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            How We Compare to Competitors
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            At 1.5%, we're among the lowest fees in the rental and accommodation industry
            while providing premium service.
          </Typography>

          <CompetitorComparison
            ourFee={exampleBreakdown.effectiveRate}
            savings={exampleBreakdown.savingsVsTraditional}
            detailed
          />

          {/* Value Statement */}
          <Box sx={{ mt: 3, p: 3, bgcolor: 'success.50', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" fontWeight={600} color="success.dark" gutterBottom>
                  We're 10x Cheaper Than Airbnb
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Our 1.5% fee is a fraction of what traditional platforms charge, yet we
                  provide the same level of service, security, and support. You keep more of
                  your money where it belongs.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Detailed Comparison Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Platform</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">On $2,000</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { name: 'Airbnb', fee: '14-20%', amount: 340, diff: -310 },
                  { name: 'VRBO', fee: '6-12%', amount: 180, diff: -150 },
                  { name: 'Traditional Agent', fee: '17%', amount: 340, diff: -310 },
                  { name: 'Split Lease', fee: '1.5%', amount: 30, diff: 0, highlight: true }
                ].map((platform) => (
                  <TableRow
                    key={platform.name}
                    sx={{
                      ...(platform.highlight && {
                        bgcolor: 'success.50',
                        fontWeight: 700
                      })
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={platform.highlight ? 700 : 400}>
                        {platform.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={platform.highlight ? 700 : 400}>
                        {platform.fee}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={platform.highlight ? 700 : 400}>
                        ${platform.amount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={platform.highlight ? 700 : 400}
                        color={platform.diff < 0 ? 'error' : 'success.dark'}
                      >
                        {platform.diff === 0 ? '—' : `+$${Math.abs(platform.diff)}`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* ========================================
            TAB 4: OUR PHILOSOPHY
            ======================================== */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Our Commitment to Transparency
          </Typography>

          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Principle 1 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                1. No Hidden Fees, Ever
              </Typography>
              <Typography variant="body2" color="text.secondary">
                What you see is what you pay. We believe in honest pricing. You'll always see
                exactly what you pay, what the other person receives, and what we keep. No
                surprises, no fine print.
              </Typography>
            </Box>

            <Divider />

            {/* Principle 2 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                2. Fair to Everyone
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our split fee model ensures both tenants and landlords share the cost fairly.
                Unlike traditional platforms that charge one party heavily, we distribute the
                fee equitably (0.75% each).
              </Typography>
            </Box>

            <Divider />

            {/* Principle 3 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3. Value Over Volume
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We keep our fees low because we want you to succeed. We'd rather have happy
                users who come back than maximize profit on a single transaction. Your success
                is our success.
              </Typography>
            </Box>

            <Divider />

            {/* Principle 4 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                4. Continuous Improvement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Every dollar we collect goes back into making the platform better: faster
                payments, better support, more features, improved security. You're not just
                paying for a service—you're investing in a better rental experience.
              </Typography>
            </Box>
          </Stack>

          {/* Guarantee Box */}
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: 'primary.50',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.main'
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" fontWeight={600} color="primary.dark" gutterBottom>
                  Our Guarantee
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If you're not satisfied with our service, we'll refund the platform fee. No
                  questions asked. That's how confident we are in our value.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </TabPanel>
      </DialogContent>

      {/* ========================================
          DIALOG ACTIONS
          ======================================== */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Close
        </Button>
        <Button onClick={onClose} variant="contained" size="large" autoFocus>
          Got it, thanks!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FeeExplainer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feeBreakdown: PropTypes.shape({
    basePrice: PropTypes.number,
    platformFee: PropTypes.number,
    landlordShare: PropTypes.number,
    totalFee: PropTypes.number,
    totalPrice: PropTypes.number,
    effectiveRate: PropTypes.number,
    savingsVsTraditional: PropTypes.number
  })
};

export default FeeExplainer;
