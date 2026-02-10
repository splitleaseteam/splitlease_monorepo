/**
 * AuthenticatedPageShell - Shared wrapper for all authenticated pages
 *
 * Handles the auth check -> loading -> error -> content lifecycle that
 * is duplicated across every protected page (HostProposalsPage,
 * GuestProposalsPage, GuestLeasesPage, HostOverviewPage, etc.).
 *
 * Uses a render-prop pattern so child content receives the authenticated
 * user object without needing additional context or prop-drilling.
 *
 * @example Guest-only page
 * ```jsx
 * <AuthenticatedPageShell requiredRole="guest" title="Your Proposals">
 *   {({ user }) => <ProposalsList user={user} />}
 * </AuthenticatedPageShell>
 * ```
 *
 * @example Host-only page with custom loading message
 * ```jsx
 * <AuthenticatedPageShell
 *   requiredRole="host"
 *   title="Host Dashboard"
 *   loadingMessage="Loading your dashboard..."
 * >
 *   {({ user }) => <HostDashboard user={user} />}
 * </AuthenticatedPageShell>
 * ```
 */

import React from 'react';
import Header from '../Header.jsx';
import Footer from '../Footer.jsx';
import { PageLoadingState } from '../primitives/PageLoadingState.jsx';
import { useAuthenticatedPage } from '../../../hooks/useAuthenticatedPage.js';

/**
 * @param {Object} props
 * @param {'guest'|'host'|'any'} [props.requiredRole='any'] - Role gate
 * @param {string} [props.title='Page'] - Screen-reader page title (sr-only h1)
 * @param {string} [props.loadingMessage='Loading...'] - Message shown during auth check
 * @param {string} [props.redirectUrl='/'] - Where to redirect on auth failure
 * @param {string} [props.className] - Optional CSS class for the page wrapper div
 * @param {Function} props.children - Render prop: ({ user, authState }) => JSX
 * @returns {JSX.Element}
 */
export function AuthenticatedPageShell({
  requiredRole = 'any',
  title = 'Page',
  loadingMessage = 'Loading...',
  redirectUrl = '/',
  className,
  children,
}) {
  const { authState, user } = useAuthenticatedPage({
    requiredRole,
    redirectUrl,
  });

  // Auth still checking or redirect in progress -- show loading shell
  if (authState.isChecking || authState.shouldRedirect) {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className={className}>
            <PageLoadingState message={loadingMessage} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Auth passed -- render child content via render prop
  return (
    <>
      <Header />
      <main className="main-content" role="main" id="main-content">
        <h1 className="sr-only">{title}</h1>
        <div className={className}>
          {typeof children === 'function'
            ? children({ user, authState })
            : children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default AuthenticatedPageShell;
