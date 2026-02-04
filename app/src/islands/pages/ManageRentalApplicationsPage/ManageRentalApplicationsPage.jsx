/**
 * ManageRentalApplicationsPage - Admin dashboard for managing rental applications
 *
 * This is a HOLLOW COMPONENT - all logic lives in useManageRentalApplicationsPageLogic.js
 *
 * Features:
 * - List view with search, filters, sorting, pagination
 * - Detail view for individual applications
 * - Edit modal for updating application data
 * - Status management (approve, deny, etc.)
 * - Deep linking support via URL parameter (?id=xxx)
 */

import React from 'react';
import { useManageRentalApplicationsPageLogic } from './useManageRentalApplicationsPageLogic.js';
import SearchFilters from './components/SearchFilters.jsx';
import ApplicationsTable from './components/ApplicationsTable.jsx';
import ApplicationDetailView from './components/ApplicationDetailView.jsx';
import EditApplicationModal from './modals/EditApplicationModal.jsx';
import { useToast } from '../../shared/Toast.jsx';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';
import '../../../styles/pages/manage-rental-applications.css';


export default function ManageRentalApplicationsPage() {
  const { showToast } = useToast();
  const logic = useManageRentalApplicationsPageLogic({ showToast });

  // Loading state
  if (logic.isLoading && !logic.applications.length && logic.viewMode === 'list') {
    return (
      <div className="manage-rental-apps">
        <AdminHeader />
        <div className="manage-rental-apps__loading">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-rental-apps">
      <AdminHeader />
      {/* Header */}
      <header className="manage-rental-apps__header">
        <div className="manage-rental-apps__header-content">
          <h1>Manage Rental Applications</h1>
          <p className="manage-rental-apps__subtitle">
            {logic.pagination.total} total application{logic.pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="manage-rental-apps__stats">
          <div className="stat-card stat-card--draft">
            <span className="stat-card__value">{logic.stats.draft}</span>
            <span className="stat-card__label">Draft</span>
          </div>
          <div className="stat-card stat-card--submitted">
            <span className="stat-card__value">{logic.stats.submitted}</span>
            <span className="stat-card__label">Submitted</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="manage-rental-apps__main">
        {/* Error Banner */}
        {logic.error && (
          <div className="manage-rental-apps__error-banner">
            <span>{logic.error}</span>
            <button onClick={logic.handleRetry} className="btn btn--small">
              Retry
            </button>
          </div>
        )}

        {/* View Toggle: List or Detail */}
        {logic.viewMode === 'list' ? (
          <>
            <SearchFilters
              filters={logic.filters}
              statusOptions={logic.statusOptions}
              onUpdateFilters={logic.handleUpdateFilters}
              onClearFilters={logic.handleClearFilters}
            />

            <ApplicationsTable
              applications={logic.applications}
              isLoading={logic.isLoading}
              pagination={logic.pagination}
              sort={logic.sort}
              onSelectApplication={logic.handleSelectApplication}
              onUpdateSort={logic.handleUpdateSort}
              onChangePage={logic.handleChangePage}
              onChangePageSize={logic.handleChangePageSize}
            />
          </>
        ) : (
          <ApplicationDetailView
            application={logic.selectedApplication}
            isLoading={logic.isLoadingDetail}
            onBack={logic.handleBackToList}
            onEdit={logic.handleOpenEditModal}
            onUpdateStatus={logic.handleUpdateStatus}
            statusOptions={logic.statusOptions}
          />
        )}
      </main>

      {/* Edit Modal */}
      {logic.isEditModalOpen && (
        <EditApplicationModal
          application={logic.selectedApplication}
          editSection={logic.editSection}
          onClose={logic.handleCloseEditModal}
          onSave={logic.handleSaveEdit}
          isSaving={logic.isSaving}
        />
      )}
    </div>
  );
}
