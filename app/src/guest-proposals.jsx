import React from 'react';
import { createRoot } from 'react-dom/client';
import GuestProposalsPage from './islands/pages/GuestProposalsPage.jsx';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';
import './styles/components/guest-proposals/index.css';
import './styles/components/protocol-modal.css';
import './styles/components/host-profile-modal.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <GuestProposalsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
