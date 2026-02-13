/**
 * Schedule Dashboard Entry Point
 *
 * Islands Architecture: Independent React root for schedule management.
 * Route: /schedule/:leaseId
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ScheduleDashboard from './islands/pages/ScheduleDashboard/index.jsx';
import { ToastProvider } from './islands/shared/Toast.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary.jsx';
import './styles/main.css';
import './styles/components/schedule-dashboard/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ScheduleDashboard />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
