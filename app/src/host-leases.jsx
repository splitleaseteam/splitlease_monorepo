import React from 'react';
import { createRoot } from 'react-dom/client';
import HostLeasesPage from './islands/pages/HostLeasesPage';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import { ToastProvider } from './islands/shared/Toast';
import './styles/main.css';
import './islands/pages/HostLeasesPage/HostLeasesPage.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <HostLeasesPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
