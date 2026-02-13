/**
 * Reviews Overview Entry Point
 *
 * Islands Architecture: Each page is an independent React root.
 * This file mounts the ReviewsOverviewPage component.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ReviewsOverviewPage from './islands/pages/ReviewsOverviewPage';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary.jsx';
import './styles/main.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ReviewsOverviewPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
