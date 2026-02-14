/**
 * ProposalsPageShell - Shared layout for host and guest proposals pages
 *
 * Encapsulates the common structure both pages share:
 *   auth gate -> loading -> error -> empty -> proposal content
 *
 * Props control host/guest differences:
 *   - role: auth gate ('host' | 'guest')
 *   - emptyStateProps: empty-state messaging
 *   - headerContent: slot for listing selector, page title bar, etc.
 *   - renderContent: render-prop ({ user }) => JSX for page-specific content
 */

import Header from '../Header.jsx';
import Footer from '../Footer.jsx';
import { PageLoadingState } from '../primitives/PageLoadingState.jsx';
import { PageErrorState } from '../primitives/PageErrorState.jsx';
import { PageEmptyState } from '../primitives/PageEmptyState.jsx';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';

/**
 * @param {Object} props
 * @param {'host'|'guest'} props.role - Determines auth gate
 * @param {string} [props.title='Proposals'] - Screen-reader page title
 * @param {string} [props.className] - CSS class for the page wrapper div
 * @param {boolean} props.isLoading - Data loading state (separate from auth loading)
 * @param {string|null} props.error - Error message, or null
 * @param {number} props.itemCount - Number of proposals (0 triggers empty state)
 * @param {Function} [props.onRetry] - Retry handler for error state
 * @param {Object} [props.emptyStateProps] - Props forwarded to PageEmptyState
 * @param {React.ReactNode} [props.headerContent] - Optional slot rendered above the
 *   loading/error/content area (e.g. listing selector, page title bar)
 * @param {Function} props.renderContent - Render prop: ({ user }) => JSX
 *   Only called when auth passed, not loading, no error, and itemCount > 0
 * @returns {JSX.Element}
 */
export function ProposalsPageShell({
  role,
  title = 'Proposals',
  className,
  isLoading,
  error,
  itemCount,
  onRetry,
  emptyStateProps = {},
  headerContent,
  renderContent,
}) {
  const { user: rawUser, isLoading, isAuthenticated } = useAuthenticatedUser({
    requiredRole: role,
    redirectOnFail: '/',
  });

  // Map to the user shape consumers expect
  const user = rawUser
    ? {
        id: rawUser.id,
        firstName: rawUser.firstName || '',
        email: rawUser.email || '',
        userType: rawUser.userType || '',
        avatarUrl: rawUser.profilePhoto || null,
      }
    : null;

  // Auth checking or not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className={className}>
            <PageLoadingState message="Loading your proposals..." />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Auth passed -- render the page layout with state-driven content
  return (
    <>
      <Header />
      <main className="main-content" role="main" id="main-content">
        <h1 className="sr-only">{title}</h1>
        <div className={className}>
          {/* Optional header slot (page title bar, listing selector, etc.) */}
          {headerContent}

          {/* Loading state */}
          {isLoading && (
            <PageLoadingState message="Loading your proposals..." />
          )}

          {/* Error state */}
          {!isLoading && error && (
            <PageErrorState message={error} onRetry={onRetry} />
          )}

          {/* Empty state */}
          {!isLoading && !error && itemCount === 0 && (
            <PageEmptyState {...emptyStateProps} />
          )}

          {/* Content -- delegate to page-specific render prop */}
          {!isLoading && !error && itemCount > 0 && renderContent({ user })}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ProposalsPageShell;
