/**
 * AuthSignupLoginOAuthResetFlowModal
 *
 * Comprehensive authentication modal supporting:
 * - Multi-step signup (user type → identity → password)
 * - Login with email/password
 * - OAuth (LinkedIn, Google) for both signup and login
 * - Password reset and magic link flows
 *
 * Usage:
 *   import SignUpLoginModal from '../shared/AuthSignupLoginOAuthResetFlowModal';
 *
 *   <SignUpLoginModal
 *     isOpen={showModal}
 *     onClose={() => setShowModal(false)}
 *     initialView="initial"
 *     onAuthSuccess={(userData) => handleSuccess(userData)}
 *     defaultUserType="guest"
 *   />
 */

export { default } from './AuthSignupLoginOAuthResetFlowModal.jsx';
