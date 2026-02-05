/**
 * ManageLeasesPaymentRecordsPage - Comprehensive Admin Interface
 *
 * HOLLOW COMPONENT PATTERN: ALL logic delegated to useManageLeasesPageLogic
 * This component is purely presentational - it receives data and callbacks
 * from the hook and renders the UI accordingly.
 *
 * Features:
 * - Lease search and selection
 * - Lease details display
 * - Calendar with booked dates visualization
 * - Document management (upload, generate, send)
 * - Identity verification display
 * - Payment records CRUD
 * - Stays management
 * - Document change requests
 *
 * @see useManageLeasesPageLogic.js for all business logic
 */
import { useToast } from '../../shared/Toast.jsx';
import { useManageLeasesPageLogic } from './useManageLeasesPageLogic.js';
import AdminHeader from '../../shared/AdminHeader/AdminHeader.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import LeaseSearchSection from './components/LeaseSearchSection/LeaseSearchSection.jsx';
import LeaseDetailsSection from './components/LeaseDetailsSection/LeaseDetailsSection.jsx';
import CalendarSection from './components/CalendarSection/CalendarSection.jsx';
import DocumentsSection from './components/DocumentsSection/DocumentsSection.jsx';
import IdentitySection from './components/IdentitySection/IdentitySection.jsx';
import PaymentRecordsSection from './components/PaymentRecordsSection/PaymentRecordsSection.jsx';
import StaysSection from './components/StaysSection/StaysSection.jsx';
import DocumentChangeSection from './components/DocumentChangeSection/DocumentChangeSection.jsx';
import CancellationSection from './components/CancellationSection/CancellationSection.jsx';
import LeaseReadinessModal from '../../shared/LeaseReadinessModal.jsx';
import './manage-leases.css';

export default function ManageLeasesPaymentRecordsPage() {
  const { showToast } = useToast();
  const logic = useManageLeasesPageLogic({ showToast });

  // Loading state - only show full-page loading when no lease selected yet
  if (logic.isLoading && !logic.selectedLease) {
    return (
      <div className="mlpr-page">
        <AdminHeader />
        <LoadingState message="Loading leases..." />
      </div>
    );
  }

  // Error state - only show full-page error when no lease selected yet
  if (logic.error && !logic.selectedLease) {
    return (
      <div className="mlpr-page">
        <AdminHeader />
        <ErrorState error={logic.error} onRetry={logic.handleRetry} />
      </div>
    );
  }

  return (
    <div className="mlpr-page">
      <AdminHeader />

      {/* Page Header */}
      <header className="mlpr-header">
        <div className="mlpr-header-content">
          <h1 className="mlpr-title">Manage Leases & Payment Records</h1>
          {logic.selectedLease && (
            <p className="mlpr-subtitle">
              Selected: {logic.selectedLease.agreementNumber || logic.selectedLease.id}
              {logic.selectedLease.guest?.fullName && (
                <span className="mlpr-guest-indicator">
                  ({logic.selectedLease.guest.fullName})
                </span>
              )}
            </p>
          )}
        </div>
      </header>

      <main className="mlpr-content">
        {/* Lease Search & Selection */}
        <LeaseSearchSection
          searchQuery={logic.searchQuery}
          onSearchChange={logic.setSearchQuery}
          leases={logic.filteredLeases}
          selectedLease={logic.selectedLease}
          onLeaseSelect={logic.handleLeaseSelect}
          isLoading={logic.isLoading}
        />

        {logic.selectedLease && (
          <>
            {/* Lease Details */}
            <LeaseDetailsSection lease={logic.selectedLease} />

            {/* Calendar & Date Management */}
            <CalendarSection
              lease={logic.selectedLease}
              onUpdateBookedDates={logic.handleUpdateBookedDates}
              onClearDates={logic.handleClearDates}
              isLoading={logic.isLoading}
            />

            {/* Document Management */}
            <DocumentsSection
              lease={logic.selectedLease}
              onUploadDocument={logic.handleUploadDocument}
              onGenerateDocs={logic.handleGenerateDocs}
              onGenerateAllDocs={logic.handleGenerateAllDocs}
              onSendDocuments={logic.handleSendDocuments}
              isGeneratingDocs={logic.isGeneratingDocs}
            />

            {/* Identity Verification */}
            <IdentitySection
              guest={logic.selectedLease.guest}
              host={logic.selectedLease.host}
            />

            {/* Cancellation Section */}
            <CancellationSection
              lease={logic.selectedLease}
              onCancel={logic.handleCancelLease}
              isLoading={logic.isLoading}
            />

            {/* Payment Records Management */}
            <PaymentRecordsSection
              lease={logic.selectedLease}
              guestPayments={logic.guestPayments}
              hostPayments={logic.hostPayments}
              onCreatePayment={logic.handleCreatePaymentRecord}
              onEditPayment={logic.handleEditPaymentRecord}
              onDeletePayment={logic.handleDeletePaymentRecord}
              onRegenerateGuest={logic.handleRegenerateGuestPayments}
              onRegenerateHost={logic.handleRegenerateHostPayments}
              onRegenerateAll={logic.handleRegenerateAllPayments}
              isLoading={logic.isLoading}
            />

            {/* Stays Management */}
            <StaysSection
              stays={logic.selectedLease.stays}
              onCreateStays={logic.handleCreateStays}
              onClearStays={logic.handleClearStays}
              isLoading={logic.isLoading}
            />

            {/* Document Change Requests */}
            <DocumentChangeSection
              guestRequests={logic.guestChangeRequests}
              hostRequests={logic.hostChangeRequests}
              onOpenPdf={logic.handleOpenPdf}
            />
          </>
        )}
      </main>

      {/* Loading Overlay for operations */}
      {logic.isLoading && logic.selectedLease && (
        <div className="mlpr-loading-overlay">
          <div className="mlpr-loading-spinner" />
        </div>
      )}

      {/* Lease Readiness Modal - Pre-flight check before document generation */}
      <LeaseReadinessModal
        isOpen={logic.showReadinessModal}
        onClose={() => logic.setShowReadinessModal(false)}
        readinessReport={logic.readinessReport}
        lease={logic.selectedLease}
        onGenerate={logic.handleGenerateSelectedDocs}
        isGenerating={logic.isGeneratingDocs}
      />
    </div>
  );
}
