import React, { Suspense, lazy } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary.jsx';

describe('ErrorBoundary', () => {
  let originalLocation;
  let reloadMock;

  beforeEach(() => {
    originalLocation = window.location;
    reloadMock = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('shows fallback UI and reload action when a lazy import fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const BrokenLazyComponent = lazy(() => Promise.reject(new Error('Failed to load lazy chunk')));

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <BrokenLazyComponent />
        </Suspense>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    });

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    await userEvent.click(reloadButton);

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
