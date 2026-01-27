/**
 * Z-Emails Unit Page Entry Point
 *
 * Internal test page for email template validation.
 * Route: /_internal/z-emails-unit
 * Auth: None (internal test page)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZEmailsUnitPage from './islands/pages/ZEmailsUnitPage/ZEmailsUnitPage.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';

import './styles/main.css';
import './lib/config.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ZEmailsUnitPage />
    </ErrorBoundary>
  </React.StrictMode>
);
