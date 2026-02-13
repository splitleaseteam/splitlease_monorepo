import React from 'react';
import { createRoot } from 'react-dom/client';
import CoHostRequestsPage from './islands/pages/CoHostRequestsPage';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <CoHostRequestsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
