import React from 'react';
import { createRoot } from 'react-dom/client';
import HostProposalsPage from './islands/pages/HostProposalsPage.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import { ToastProvider } from './islands/shared/Toast';
import './styles/main.css';
import './styles/components/host-proposals.css';
import './styles/components/host-proposals-v7.css';
import './styles/components/protocol-modal.css';
import './styles/components/guest-profile-modal.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <HostProposalsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
