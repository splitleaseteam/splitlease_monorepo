import React from 'react';
import { createRoot } from 'react-dom/client';
import ModifyListingsPage from './islands/pages/ModifyListingsPage';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ModifyListingsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
