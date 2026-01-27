/**
 * CreateDocumentPage - Admin page for creating and assigning documents to hosts
 *
 * This is a HOLLOW COMPONENT - all logic lives in useCreateDocumentPageLogic.js
 *
 * Features:
 * - Select a policy document template from Bubble
 * - Customize the document title
 * - Assign to a host user
 * - Creates a record in the documentssent table
 */

import { useCreateDocumentPageLogic } from './useCreateDocumentPageLogic.js';
import DocumentForm from './components/DocumentForm.jsx';
import { useToast } from '../../shared/Toast.jsx';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';
import './CreateDocumentPage.css';

export default function CreateDocumentPage() {
  const { showToast } = useToast();
  const logic = useCreateDocumentPageLogic({ showToast });

  // Loading state during initialization
  if (logic.isLoading && !logic.policyDocuments.length && !logic.hostUsers.length) {
    return (
      <div className="create-document-page">
        <AdminHeader />
        <div className="create-document-page__loading">
          <div className="create-document-page__spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-document-page">
      <AdminHeader />
      {/* Header */}
      <header className="create-document-page__header">
        <h1 className="create-document-page__title">Create Document</h1>
        <p className="create-document-page__subtitle">
          Select a policy document and assign it to a host user
        </p>
      </header>

      {/* Main Content */}
      <main className="create-document-page__main">
        {/* Error Banner */}
        {logic.error && (
          <div className="create-document-page__error">
            <span>{logic.error}</span>
            <button onClick={logic.handleRetry} className="create-document-page__retry">
              Retry
            </button>
          </div>
        )}

        {/* Document Form */}
        <DocumentForm
          policyDocuments={logic.policyDocuments}
          hostUsers={logic.hostUsers}
          formState={logic.formState}
          formErrors={logic.formErrors}
          isLoading={logic.isLoading}
          isSubmitting={logic.isSubmitting}
          onFieldChange={logic.handleFieldChange}
          onSubmit={logic.handleSubmit}
        />

        {/* Success Message */}
        {logic.lastCreatedDocument && (
          <div className="create-document-page__success">
            <span className="create-document-page__success-icon">✓</span>
            <span>Document successfully created and assigned!</span>
          </div>
        )}
      </main>
    </div>
  );
}
