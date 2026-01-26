/**
 * ManageInformationalTextsPage - Admin tool for managing informational text content
 *
 * Hollow component pattern: All logic is in useManageInformationalTextsPageLogic.js
 * This component only handles rendering.
 */

import useManageInformationalTextsPageLogic from './useManageInformationalTextsPageLogic.js';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';
import { ListPanel } from './components/ListPanel.jsx';
import { FormPanel } from './components/FormPanel.jsx';
import { PreviewPanel } from './components/PreviewPanel.jsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.jsx';
import './ManageInformationalTextsPage.css';

export default function ManageInformationalTextsPage() {
  const {
    // Entries state
    filteredEntries,
    loading,
    error,

    // Form state
    mode,
    formData,
    isSubmitting,
    formErrors,
    canSubmit,

    // UI state
    searchQuery,
    setSearchQuery,
    previewDevice,
    setPreviewDevice,
    deleteConfirmId,

    // Handlers
    loadEntries,
    handleFieldChange,
    startCreate,
    startEdit,
    cancelForm,
    handleSubmit,
    confirmDelete,
    cancelDelete,
    executeDelete,
    getPreviewContent,
  } = useManageInformationalTextsPageLogic();

  return (
    <div className="mit-container">
      <AdminHeader />
      {/* Header */}
      <header className="mit-header">
        <h1 className="mit-title">Manage Informational Texts</h1>
        <p className="mit-subtitle">
          Create and edit informational text content displayed across the application
        </p>
      </header>

      {/* Main Content Area */}
      <div className="mit-main-content">
        {/* Left Panel - List or Form */}
        <div className="mit-left-panel">
          {mode === 'list' ? (
            <ListPanel
              entries={filteredEntries}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onRefresh={loadEntries}
              onCreate={startCreate}
              onEdit={startEdit}
              onDelete={confirmDelete}
              deleteConfirmId={deleteConfirmId}
              onCancelDelete={cancelDelete}
              onConfirmDelete={executeDelete}
              isDeleting={isSubmitting}
            />
          ) : (
            <FormPanel
              mode={mode}
              formData={formData}
              formErrors={formErrors}
              isSubmitting={isSubmitting}
              canSubmit={canSubmit}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              onCancel={cancelForm}
            />
          )}
        </div>

        {/* Right Panel - Preview (only shown when editing/creating) */}
        {mode !== 'list' && (
          <div className="mit-right-panel">
            <PreviewPanel
              formData={formData}
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
              getPreviewContent={getPreviewContent}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          onCancel={cancelDelete}
          onConfirm={executeDelete}
          isDeleting={isSubmitting}
        />
      )}
    </div>
  );
}
