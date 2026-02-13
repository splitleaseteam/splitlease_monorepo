import React from 'react';
import { createRoot } from 'react-dom/client';
import SendMagicLoginLinksPage from './islands/pages/SendMagicLoginLinksPage';
import { ToastProvider } from './islands/shared/Toast';
import { ErrorBoundary } from './islands/shared/ErrorBoundary.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <SendMagicLoginLinksPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
