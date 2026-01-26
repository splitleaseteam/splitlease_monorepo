import React from 'react';
import { createRoot } from 'react-dom/client';
import GuestLeasesPage from './islands/pages/GuestLeasesPage.jsx';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';
import './styles/components/guest-leases.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <GuestLeasesPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
