/**
 * QR Code Landing Page Logic Hook
 *
 * Custom hook implementing the Hollow Components pattern.
 * Handles data fetching, scan recording, and notification triggering.
 *
 * @module useQrCodeLandingPageLogic
 */

import { useState, useEffect } from 'react';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';
import { supabase } from '../../../lib/supabase.js';

/**
 * Custom hook for QR Code Landing Page logic
 *
 * @param {string} qrCodeId - The QR code ID from URL params
 * @returns {Object} Page state and handlers
 */
export function useQrCodeLandingPageLogic(qrCodeId) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const { isLoading: loading, error: fetchError, execute: executeFetchAndRecordScan } = useAsyncOperation(
    async (id) => {
      // Call Edge Function to get QR code data AND record the scan
      // This single call handles both data retrieval and notification triggering
      const { data, error: invokeError } = await supabase.functions.invoke('qr-codes', {
        body: {
          action: 'record_scan',
          payload: { qrCodeId: id },
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to load QR code data');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'QR code not found');
      }

      setQrCodeData(data.data.qrCode);
      setNotificationStatus(data.data.notificationsSent);
    }
  );

  useEffect(() => {
    if (qrCodeId) {
      executeFetchAndRecordScan(qrCodeId).catch((err) => {
        console.error('[QR Code Landing] Fetch error:', err);
      });
    }
  }, [qrCodeId, executeFetchAndRecordScan]);

  /**
   * Handler for viewing full house manual
   * Opens in new tab matching Bubble behavior
   */
  const handleViewHouseManual = () => {
    if (qrCodeData?.visitId) {
      window.open(`/visit-manual?visitId=${qrCodeData.visitId}`, '_blank');
    }
  };

  return {
    qrCodeData,
    loading,
    error: fetchError?.message ?? null,
    notificationStatus,
    handleViewHouseManual,
    hasVisit: Boolean(qrCodeData?.visitId),
  };
}
