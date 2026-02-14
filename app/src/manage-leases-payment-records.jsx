/**
 * manage-leases-payment-records.jsx - React Mount Point
 *
 * Entry point for the Manage Leases & Payment Records admin page.
 * This mounts the ManageLeasesPaymentRecordsPage component to the DOM.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import ManageLeasesPaymentRecordsPage from './islands/pages/ManageLeasesPaymentRecordsPage/ManageLeasesPaymentRecordsPage.jsx';
import { ToastProvider } from './islands/shared/Toast.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ManageLeasesPaymentRecordsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
