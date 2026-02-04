import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './islands/shared/Toast';
import GuestExperienceReviewPage from './islands/pages/GuestExperienceReviewPage';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';

// Import CSS so Vite bundles it (required for production build)
import './styles/main.css';

// Import config to set window.ENV before any other code runs
import './lib/config.js';
import { checkAuthStatus } from './lib/auth.js';

// Check authentication status (async)
(async () => {
  const isLoggedIn = await checkAuthStatus();

  console.log('[GuestExperienceReview] Auth Check:', { isLoggedIn });

  if (!isLoggedIn) {
    console.log('[GuestExperienceReview] User not authenticated - will show auth modal');
  } else {
    console.log('[GuestExperienceReview] User authenticated - rendering page');
  }

  // Always render the page - Header will show auth modal if not logged in
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <GuestExperienceReviewPage requireAuth={true} isAuthenticated={isLoggedIn} />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
})();
