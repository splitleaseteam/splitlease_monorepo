/**
 * ValueProposition Component
 * Displays the value provided by platform services
 *
 * @component ValueProposition
 * @version 1.0.0
 * @production
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Speed as SpeedIcon,
  Gavel as GavelIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  Verified as VerifiedIcon,
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * Service categories with detailed information
 */
const SERVICE_CATEGORIES = [
  {
    category: 'Payment Processing',
    icon: <MoneyIcon color="primary" />,
    color: 'primary',
    estimatedValue: '$15-25',
    services: [
      {
        title: 'Instant Stripe Integration',
        description: 'Secure payment processing through industry-leading Stripe infrastructure',
        features: [
          'PCI-DSS Level 1 compliance',
          'Instant fund transfer',
          'Multi-currency support',
          'Automatic fraud detection'
        ]
      },
      {
        title: 'Payment Protection',
        description: 'Full transaction protection for both parties',
        features: [
          'Escrow service',
          'Chargeback protection',
          'Payment verification',
          'Refund management'
        ]
      }
    ]
  },
  {
    category: 'Legal & Compliance',
    icon: <GavelIcon color="primary" />,
    color: 'secondary',
    estimatedValue: '$50-100',
    services: [
      {
        title: 'Automated Contract Updates',
        description: 'Smart contract amendments without lawyer fees',
        features: [
          'State-compliant templates',
          'Digital signature collection',
          'Version control',
          'Legal review available'
        ]
      },
      {
        title: 'Document Management',
        description: 'Secure storage and retrieval of all transaction documents',
        features: [
          'Encrypted storage',
          'Instant access',
          'Audit trail',
          'Export capabilities'
        ]
      }
    ]
  },
  {
    category: 'Platform Services',
    icon: <SpeedIcon color="primary" />,
    color: 'info',
    estimatedValue: '$20-40',
    services: [
      {
        title: 'Calendar Synchronization',
        description: 'Real-time updates across all parties',
        features: [
          'Google/Apple Calendar sync',
          'Automatic notifications',
          'Conflict detection',
          'Shared availability'
        ]
      },
      {
        title: 'Transaction Dashboard',
        description: 'Comprehensive tracking and management interface',
        features: [
          'Real-time status updates',
          'Communication hub',
          'Document repository',
          'Analytics & insights'
        ]
      }
    ]
  },
  {
    category: 'Support & Protection',
    icon: <SupportIcon color="primary" />,
    color: 'warning',
    estimatedValue: '$25-50',
    services: [
      {
        title: '24/7 Customer Support',
        description: 'Human support team available anytime',
        features: [
          'Average 2-hour response',
          'Live chat support',
          'Phone support available',
          'Dedicated account manager'
        ]
      },
      {
        title: 'Dispute Resolution',
        description: 'Professional mediation for transaction issues',
        features: [
          'Neutral third-party review',
          'Evidence collection',
          'Fair resolution process',
          'Binding arbitration option'
        ]
      }
    ]
  },
  {
    category: 'Record Keeping',
    icon: <ReceiptIcon color="primary" />,
    color: 'success',
    estimatedValue: '$10-20',
    services: [
      {
        title: 'Transaction History',
        description: 'Complete records for tax and reporting purposes',
        features: [
          'Automatic categorization',
          'Tax-ready exports',
          'Receipt generation',
          'Year-end summaries'
        ]
      },
      {
        title: 'Analytics & Reporting',
        description: 'Insights into your rental activity',
        features: [
          'Spending trends',
          'Savings calculator',
          'Custom reports',
          'Data visualization'
        ]
      }
    ]
  }
];

/**
 * ServiceCategoryCard Component
 */
const ServiceCategoryCard = ({ category, icon, color, estimatedValue, services }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        '&:hover': {
          boxShadow: 4,
          borderColor: `${color}.main`
        },
        transition: 'all 0.3s'
      }}
    >
      <CardContent>
        {/* Category Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1,
                bgcolor: `${color}.50`,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {category}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Value: {estimatedValue}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<CheckCircleIcon />}
            label="Included"
            size="small"
            color="success"
            variant="outlined"
          />
        </Stack>

        {/* Services List */}
        <Stack spacing={2}>
          {services.map((service, index) => (
            <Box key={index}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {service.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" paragraph>
                {service.description}
              </Typography>
              <List dense disablePadding>
                {service.features.map((feature, fIndex) => (
                  <ListItem key={fIndex} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircleIcon fontSize="small" color="success" sx={{ fontSize: 14 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

ServiceCategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  estimatedValue: PropTypes.string.isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      features: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired
};

/**
 * ValueProposition Component
 */
export const ValueProposition = ({ variant = 'detailed', showEstimatedValue = true, sx }) => {
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // Calculate total estimated value
  const totalValueRange = SERVICE_CATEGORIES.reduce(
    (acc, cat) => {
      const [min, max] = cat.estimatedValue.replace('$', '').split('-').map(Number);
      return {
        min: acc.min + min,
        max: acc.max + max
      };
    },
    { min: 0, max: 0 }
  );

  // ========================================
  // DETAILED VARIANT (Grid Layout)
  // ========================================
  if (variant === 'detailed') {
    return (
      <Box sx={{ ...sx }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            What's Included in Your Fee
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Premium services worth ${totalValueRange.min}-${totalValueRange.max} per transaction
          </Typography>
          <Chip
            icon={<VerifiedIcon />}
            label="All services included • No additional charges"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Service Categories Grid */}
        <Grid container spacing={3}>
          {SERVICE_CATEGORIES.map((category, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <ServiceCategoryCard {...category} />
            </Grid>
          ))}
        </Grid>

        {/* Total Value Summary */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: 'primary.50',
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <VerifiedIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Total Service Value: ${totalValueRange.min}-${totalValueRange.max}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're getting comprehensive rental management services worth hundreds of dollars
                for just 1.5% of your transaction. That's extraordinary value.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  // ========================================
  // COMPACT VARIANT (Accordion Layout)
  // ========================================
  if (variant === 'compact') {
    return (
      <Box sx={{ ...sx }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Platform Services Included
          </Typography>
          {showEstimatedValue && (
            <Chip
              label={`$${totalValueRange.min}-${totalValueRange.max} value`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Accordions */}
        {SERVICE_CATEGORIES.map((category, index) => (
          <Accordion
            key={index}
            expanded={expandedAccordion === index}
            onChange={handleAccordionChange(index)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                {category.icon}
                <Typography variant="body2" fontWeight={600}>
                  {category.category}
                </Typography>
                {showEstimatedValue && (
                  <Typography variant="caption" color="text.secondary">
                    ({category.estimatedValue})
                  </Typography>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {category.services.map((service, sIndex) => (
                  <Box key={sIndex}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      {service.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" paragraph>
                      {service.description}
                    </Typography>
                    <List dense disablePadding>
                      {service.features.map((feature, fIndex) => (
                        <ListItem key={fIndex} disableGutters sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CheckCircleIcon fontSize="small" color="success" sx={{ fontSize: 14 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'caption',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }

  // ========================================
  // MINIMAL VARIANT (Simple List)
  // ========================================
  return (
    <Box sx={{ ...sx }}>
      <Stack spacing={1.5}>
        {SERVICE_CATEGORIES.map((category, index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            {category.icon}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {category.category}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {category.services.length} services included
              </Typography>
            </Box>
            {showEstimatedValue && (
              <Typography variant="caption" color="text.secondary">
                {category.estimatedValue}
              </Typography>
            )}
            <Tooltip title="View details" arrow>
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
      </Stack>

      {showEstimatedValue && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
          <Typography variant="body2" color="success.dark" fontWeight={600}>
            Total value: ${totalValueRange.min}-${totalValueRange.max} • All included in 1.5% fee
          </Typography>
        </Box>
      )}
    </Box>
  );
};

ValueProposition.propTypes = {
  variant: PropTypes.oneOf(['detailed', 'compact', 'minimal']),
  showEstimatedValue: PropTypes.bool,
  sx: PropTypes.object
};

ValueProposition.defaultProps = {
  variant: 'detailed',
  showEstimatedValue: true,
  sx: {}
};

export default ValueProposition;
