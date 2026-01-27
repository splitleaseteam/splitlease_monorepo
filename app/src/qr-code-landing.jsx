/**
 * QR Code Landing Entry Point
 *
 * Mounts the QrCodeLandingPage component for users who scan QR codes at properties.
 * Extracts qrCodeId from URL parameters.
 *
 * URL Pattern: /qr-code-landing?qrCodeId=xxx
 *
 * @module qr-code-landing
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import QrCodeLandingPage from './islands/pages/QrCodeLandingPage/QrCodeLandingPage.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';
import './lib/config.js';

/**
 * Extract QR code ID from URL parameters.
 * @returns {{ qrCodeId: string|null }}
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    qrCodeId: params.get('qrCodeId'),
  };
}

/**
 * QrCodeLandingPageWrapper Component
 *
 * Wrapper component that extracts URL params and renders the QR code landing page.
 * Handles the case where qrCodeId is missing by showing an error message.
 */
function QrCodeLandingPageWrapper() {
  const { qrCodeId } = getUrlParams();

  // Missing qrCodeId - show error
  if (!qrCodeId) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: '#FAFAFA',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '48px', marginBottom: '16px' }}>
          ⚠️
        </span>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#DC2626',
          marginBottom: '8px',
        }}>
          Invalid QR Code Link
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          maxWidth: '300px',
          marginBottom: '24px',
        }}>
          This QR code link is invalid or incomplete. Please scan the QR code again.
        </p>
        <img
          src="/assets/images/split-lease-purple-logo.png"
          alt="Split Lease"
          style={{ width: '140px', marginTop: '24px' }}
        />
      </div>
    );
  }

  return <QrCodeLandingPage qrCodeId={qrCodeId} />;
}

// Mount the React application
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QrCodeLandingPageWrapper />
    </ErrorBoundary>
  </React.StrictMode>
);
