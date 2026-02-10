/**
 * Barrel export for shared page shell components
 *
 * Shells encapsulate the common page lifecycle (auth -> loading -> error ->
 * empty -> content) so that host and guest page variants can share 80%+ of
 * their structure and only differ in the content they render.
 *
 * Usage:
 * ```js
 * import { AuthenticatedPageShell, ProposalsPageShell } from 'islands/shared/shells';
 * ```
 */

export { AuthenticatedPageShell } from './AuthenticatedPageShell.jsx';
export { ProposalsPageShell } from './ProposalsPageShell.jsx';
