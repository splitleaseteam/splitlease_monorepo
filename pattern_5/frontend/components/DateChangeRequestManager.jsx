/**
 * DateChangeRequestManager Component with Fee Transparency
 * Integrates Pattern 5 fee breakdown into date change workflow
 *
 * @component DateChangeRequestManager
 * @version 1.0.0
 * @production
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { supabase } from '../config/supabaseClient';
import PriceDisplay from './PriceDisplay';
import PaymentStep from './PaymentStep';
import {
  calculateFeeBreakdown,
  formatFeeBreakdownForDB,
  formatCurrency
} from '../utils/feeCalculations';
import { useFeeCalculation } from '../hooks/useFeeCalculation';

/**
 * Request workflow steps
 */
const REQUEST_STEPS = ['Select Date', 'Review Fee', 'Payment', 'Confirmation'];

/**
 * DateChangeRequestManager Component
 */
const DateChangeRequestManager = ({ leaseId, userId, landlordId, onRequestComplete }) => {
  // ========================================
  // State Management
  // ========================================
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaseData, setLeaseData] = useState(null);

  // Request data
  const [requestId, setRequestId] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Fee calculation hook
  const {
    feeBreakdown,
    isCalculating,
    calculationError
  } = useFeeCalculation(leaseData?.monthly_rent || 0, 'date_change');

  // ========================================
  // Data Fetching
  // ========================================
  useEffect(() => {
    fetchLeaseData();
  }, [leaseId]);

  const fetchLeaseData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .single();

      if (fetchError) throw fetchError;
      setLeaseData(data);
    } catch (err) {
      console.error('Error fetching lease:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Date Validation
  // ========================================
  const validateNewDate = useCallback(() => {
    if (!newDate) {
      setError('Please select a new move-out date');
      return false;
    }

    const selectedDate = new Date(newDate);
    const currentDate = new Date();
    const originalDate = leaseData?.end_date ? new Date(leaseData.end_date) : null;

    // Check if date is in the past
    if (selectedDate < currentDate) {
      setError('Cannot select a date in the past');
      return false;
    }

    // Check if date is the same as current
    if (originalDate && selectedDate.getTime() === originalDate.getTime()) {
      setError('New date must be different from current move-out date');
      return false;
    }

    // Check if date is too far in the future (optional business rule)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
    if (selectedDate > maxFutureDate) {
      setError('Cannot select a date more than 2 years in the future');
      return false;
    }

    return true;
  }, [newDate, leaseData]);

  // ========================================
  // Request Creation
  // ========================================
  const createDateChangeRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare fee breakdown for database
      const feeBreakdownDB = formatFeeBreakdownForDB(
        leaseData.monthly_rent,
        'date_change'
      );

      // Create request in database
      const { data: requestData, error: createError } = await supabase
        .from('datechangerequest')
        .insert([
          {
            lease_id: leaseId,
            user_id: userId,
            requested_date: newDate,
            original_date: leaseData.end_date,
            reason: reason || null,
            status: 'pending',
            transaction_type: 'date_change',
            fee_breakdown: feeBreakdownDB,
            base_price: leaseData.monthly_rent,
            total_price: feeBreakdown.totalPrice,
            payment_status: 'unpaid',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      setRequestId(requestData.id);
      return requestData;
    } catch (err) {
      console.error('Error creating request:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Payment Handlers
  // ========================================
  const handlePaymentSuccess = async (paymentData) => {
    try {
      setLoading(true);

      // Update request with payment information
      const { error: updateError } = await supabase
        .from('datechangerequest')
        .update({
          payment_status: 'paid',
          payment_processed_at: new Date().toISOString(),
          payment_intent_id: paymentData.paymentIntent.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      setPaymentIntentId(paymentData.paymentIntent.id);
      setSuccess(true);
      setActiveStep(3);

      // Notify landlord (send notification)
      await sendLandlordNotification();

      if (onRequestComplete) {
        onRequestComplete({
          requestId,
          paymentIntent: paymentData.paymentIntent,
          feeBreakdown: paymentData.feeBreakdown
        });
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Payment succeeded but failed to update request. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    setError(`Payment failed: ${error.message}`);
  };

  // ========================================
  // Notification
  // ========================================
  const sendLandlordNotification = async () => {
    try {
      // Send email/notification to landlord
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: 'date_change_request',
          recipientId: landlordId,
          requestId,
          newDate,
          reason
        })
      });
    } catch (err) {
      console.error('Error sending notification:', err);
      // Don't fail the whole process if notification fails
    }
  };

  // ========================================
  // Step Navigation
  // ========================================
  const handleNext = async () => {
    setError(null);

    if (activeStep === 0) {
      // Validate date selection
      if (!validateNewDate()) return;
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Create request and proceed to payment
      try {
        await createDateChangeRequest();
        setActiveStep(2);
      } catch (err) {
        // Error already handled in createDateChangeRequest
      }
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  // ========================================
  // Render Step Content
  // ========================================
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Select Date
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Request New Move-Out Date
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select your desired new move-out date. Your landlord will review and approve the request.
            </Typography>

            {/* Current Lease Info */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Lease Details
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Monthly Rent:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(leaseData?.monthly_rent || 0)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Current Move-Out Date:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {leaseData?.end_date
                      ? new Date(leaseData.end_date).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Date Selection */}
            <TextField
              label="New Move-Out Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              helperText="Select your desired new move-out date"
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />

            {/* Reason (Optional) */}
            <TextField
              label="Reason for Change (Optional)"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              placeholder="Briefly explain why you need to change your move-out date..."
              helperText="Providing a reason may help your landlord make a decision faster"
            />

            {/* Info Alert */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
              You'll only be charged if your landlord approves the request. The fee covers
              administrative costs and contract updates.
            </Alert>
          </Box>
        );

      case 1:
        // Step 2: Review Fee
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Review Fee Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Here's the complete breakdown of fees for your date change request.
            </Typography>

            {/* Price Display */}
            {feeBreakdown && (
              <PriceDisplay
                basePrice={leaseData?.monthly_rent || 0}
                totalPrice={feeBreakdown.totalPrice}
                priceType="monthly"
                transactionType="date_change"
                defaultExpanded={true}
                showValueProposition={true}
                showComparison={true}
                elevation={0}
              />
            )}

            {/* Request Summary */}
            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Request Summary
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Current Move-Out:
                  </Typography>
                  <Typography variant="body2">
                    {leaseData?.end_date
                      ? new Date(leaseData.end_date).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Requested Move-Out:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {new Date(newDate).toLocaleDateString()}
                  </Typography>
                </Stack>
                {reason && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {reason}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Warning */}
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> By proceeding, you authorize a charge of{' '}
                {formatCurrency(feeBreakdown?.totalPrice || 0)} if your landlord approves
                this request.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        // Step 3: Payment
        return (
          <Box>
            <PaymentStep
              basePrice={leaseData?.monthly_rent || 0}
              transactionType="date_change"
              leaseId={leaseId}
              userId={userId}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              metadata={{
                requestId,
                newDate,
                originalDate: leaseData?.end_date,
                reason
              }}
            />
          </Box>
        );

      case 3:
        // Step 4: Confirmation
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Request Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your date change request has been submitted and payment processed.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, mt: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Request Details
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Request ID:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {requestId}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Payment ID:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {paymentIntentId}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    New Move-Out Date:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(newDate).toLocaleDateString()}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(feeBreakdown?.totalPrice || 0)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
              <Typography variant="body2">
                Your landlord has been notified and will review your request. You'll receive
                an email notification when they respond. This typically takes 1-3 business days.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              onClick={() => {
                // Reset form or navigate away
                window.location.href = '/dashboard';
              }}
              sx={{ mt: 3 }}
            >
              Return to Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  // ========================================
  // Loading State
  // ========================================
  if (!leaseData && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ========================================
  // Main Render
  // ========================================
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Request Date Change
        </Typography>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Calculation Error */}
      {calculationError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {calculationError}
        </Alert>
      )}

      {/* Stepper */}
      {!success && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {REQUEST_STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

      {/* Navigation Buttons */}
      {!success && activeStep < 2 && (
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            variant="outlined"
            size="large"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || isCalculating || !newDate}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : activeStep === 1 ? (
                <SendIcon />
              ) : null
            }
            size="large"
          >
            {loading
              ? 'Processing...'
              : activeStep === 1
              ? 'Proceed to Payment'
              : 'Continue'}
          </Button>
        </Stack>
      )}

      {/* Footer Note */}
      {!success && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 3, textAlign: 'center' }}
        >
          You'll only be charged if your landlord approves the request
        </Typography>
      )}
    </Box>
  );
};

// ========================================
// PROP TYPES
// ========================================
DateChangeRequestManager.propTypes = {
  leaseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  landlordId: PropTypes.string.isRequired,
  onRequestComplete: PropTypes.func
};

export default DateChangeRequestManager;
