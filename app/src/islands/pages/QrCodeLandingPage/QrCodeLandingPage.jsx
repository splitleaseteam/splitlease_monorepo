/**
 * QR Code Landing Page Component
 *
 * Displays contextual information based on QR code use case.
 * Automatically triggers SMS notifications on page load via record_scan action.
 *
 * Use Cases:
 * - check_in: Guest arriving at property
 * - check_out: Guest departing property
 * - emergency: Emergency contact/info
 * - general_info: General property information
 *
 * @module QrCodeLandingPage
 */

import { useState } from 'react';
import { useQrCodeLandingPageLogic } from './useQrCodeLandingPageLogic.js';
import { styles, useCaseConfig, spinnerKeyframes } from './qrCodeLandingStyles.js';

/**
 * Get default message based on use case
 *
 * @param {string} useCase - The QR code use case
 * @param {Object} qrCodeData - The QR code data object
 * @returns {string} The default message for the use case
 */
function getDefaultMessage(useCase, qrCodeData) {
  const propertyName = qrCodeData?.propertyName || 'the property';

  const messages = {
    check_in: `Welcome to ${propertyName}! Your check-in has been recorded and the host has been notified. We hope you have a wonderful stay.`,
    check_out: `Thank you for staying at ${propertyName}! Your check-out has been recorded. We hope to see you again soon. Safe travels!`,
    emergency: `Emergency assistance has been requested. The property host has been notified immediately. If this is a life-threatening emergency, please also call 911.`,
    general_info: `Welcome to ${propertyName}! Use the button below to access the full house manual with WiFi details, appliance instructions, and local recommendations.`,
  };

  return messages[useCase] || messages.general_info;
}

/**
 * QrCodeLandingPage Component
 *
 * @param {Object} props
 * @param {string} props.qrCodeId - The QR code ID from URL params
 */
export default function QrCodeLandingPage({ qrCodeId }) {
  const {
    qrCodeData,
    loading,
    error,
    handleViewHouseManual,
    hasVisit,
  } = useQrCodeLandingPageLogic(qrCodeId);

  const [buttonHovered, setButtonHovered] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <style>{spinnerKeyframes}</style>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading property information...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <h2 style={styles.errorTitle}>Unable to Load</h2>
        <p style={styles.errorMessage}>{error}</p>
        <img
          src="/assets/images/split-lease-purple-logo.png"
          alt="Split Lease"
          style={{ ...styles.logo, marginTop: '48px' }}
        />
      </div>
    );
  }

  const useCase = qrCodeData?.useCase || 'general_info';
  const config = useCaseConfig[useCase] || useCaseConfig.general_info;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <h1 style={styles.welcomeText}>Welcome!</h1>
        <p style={styles.useCaseText}>
          <span style={{ marginRight: '6px' }}>{config.icon}</span>
          {qrCodeData?.displayText || config.displayText}
        </p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Information Box */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            {qrCodeData?.informationContent || getDefaultMessage(useCase, qrCodeData)}
          </p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* View House Manual Button - only show if visit exists */}
        {hasVisit && (
          <button
            style={{
              ...styles.button,
              ...(buttonHovered ? styles.buttonHover : {}),
            }}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            onClick={handleViewHouseManual}
          >
            View Full House Manual
          </button>
        )}

        {/* Logo */}
        <img
          src="/assets/images/split-lease-purple-logo.png"
          alt="Split Lease"
          style={styles.logo}
        />
      </div>
    </div>
  );
}
