/**
 * SearchModals - All modal components rendered by SearchPage
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * Contains: ContactHostMessaging, InformationalText, AiSignupMarketReport,
 * SignUpLoginModal (general + proposal auth), CreateProposalFlowV2, ProposalSuccessModal.
 */
import { lazy, Suspense } from 'react';
import InformationalText from '../../../shared/InformationalText.jsx';
import ProposalSuccessModal from '../../../modals/ProposalSuccessModal.jsx';
import { ErrorBoundary } from '../../../shared/ErrorBoundary.jsx';
import { transformListingForProposal } from '../../../../lib/proposalService.js';

const SignUpLoginModal = lazy(() => import('../../../shared/AuthSignupLoginOAuthResetFlowModal'));
const AiSignupMarketReport = lazy(() => import('../../../shared/AiSignupMarketReport/AiSignupMarketReport.jsx'));
const CreateProposalFlowV2 = lazy(() => import('../../../shared/CreateProposalFlowV2.jsx'));
const ContactHostMessaging = lazy(() => import('../../../shared/ContactHostMessaging.jsx'));

export default function SearchModals({
  // Contact modal
  isContactModalOpen,
  handleCloseContactModal,
  selectedListing,
  handleRequireAuth,
  // Info modal
  isInfoModalOpen,
  handleCloseInfoModal,
  infoModalTriggerRef,
  informationalTexts,
  // AI Research modal
  isAIResearchModalOpen,
  handleCloseAIResearchModal,
  // Auth modal (general)
  isAuthModalOpen,
  setIsAuthModalOpen,
  authModalView,
  // Create proposal modal
  isCreateProposalModalOpen,
  selectedListingForProposal,
  moveInDateForProposal,
  selectedDayObjectsForProposal,
  reservationSpanForProposal,
  zatConfig,
  loggedInUserData,
  handleCloseCreateProposalModal,
  handleCreateProposalSubmit,
  isSubmittingProposal,
  // Auth for proposal
  showAuthModalForProposal,
  setShowAuthModalForProposal,
  setPendingProposalData,
  handleAuthSuccessForProposal,
  // Success modal
  showSuccessModal,
  setShowSuccessModal,
  successProposalId,
  setSuccessProposalId,
  setSelectedListingForProposal,
  // Logger
  logger,
}) {
  return (
    <>
      {isContactModalOpen && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <ContactHostMessaging
              isOpen={isContactModalOpen}
              onClose={handleCloseContactModal}
              listing={selectedListing}
              onLoginRequired={() => {
                handleCloseContactModal();
                handleRequireAuth();
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <InformationalText
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfoModal}
        listing={selectedListing}
        triggerRef={infoModalTriggerRef}
        title="Pricing Information"
        content={informationalTexts['Price Starts']?.desktop || ''}
        expandedContent={informationalTexts['Price Starts']?.desktopPlus}
        showMoreAvailable={informationalTexts['Price Starts']?.showMore}
      />

      {isAIResearchModalOpen && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <AiSignupMarketReport
              isOpen={isAIResearchModalOpen}
              onClose={handleCloseAIResearchModal}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {isAuthModalOpen && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <SignUpLoginModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              initialView={authModalView}
              onAuthSuccess={() => {
                logger.debug('Auth successful from SearchPage');
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {isCreateProposalModalOpen && selectedListingForProposal && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <CreateProposalFlowV2
              listing={transformListingForProposal(selectedListingForProposal)}
              moveInDate={moveInDateForProposal}
              daysSelected={selectedDayObjectsForProposal}
              nightsSelected={selectedDayObjectsForProposal.length > 0 ? selectedDayObjectsForProposal.length - 1 : 0}
              reservationSpan={reservationSpanForProposal}
              pricingBreakdown={null}
              zatConfig={zatConfig}
              isFirstProposal={!loggedInUserData || loggedInUserData.proposalCount === 0}
              useFullFlow={true}
              existingUserData={loggedInUserData ? {
                needForSpace: loggedInUserData.needForSpace || '',
                aboutYourself: loggedInUserData.aboutMe || '',
                hasUniqueRequirements: !!loggedInUserData.specialNeeds,
                uniqueRequirements: loggedInUserData.specialNeeds || ''
              } : null}
              onClose={handleCloseCreateProposalModal}
              onSubmit={handleCreateProposalSubmit}
              isSubmitting={isSubmittingProposal}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {showAuthModalForProposal && (
        <ErrorBoundary>
          <Suspense fallback={<div className="modal-loading">Loading...</div>}>
            <SignUpLoginModal
              isOpen={showAuthModalForProposal}
              onClose={() => {
                setShowAuthModalForProposal(false);
                setPendingProposalData(null);
              }}
              initialView="signup-step1"
              onAuthSuccess={handleAuthSuccessForProposal}
              defaultUserType="guest"
              skipReload={true}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {showSuccessModal && (
        <ProposalSuccessModal
          proposalId={successProposalId}
          listingName={selectedListingForProposal?.title || selectedListingForProposal?.Name}
          hasSubmittedRentalApp={loggedInUserData?.hasSubmittedRentalApp ?? false}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessProposalId(null);
            setSelectedListingForProposal(null);
          }}
        />
      )}
    </>
  );
}
