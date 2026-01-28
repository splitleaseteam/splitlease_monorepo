/**
 * SimulationAdminPage - Admin tool for managing usability testing simulation testers
 *
 * Hollow component pattern: All logic is in useSimulationAdminPageLogic.js
 * This component only handles rendering.
 *
 * Features:
 * - Usability account dropdown
 * - Selected tester info display
 * - Reset usability action
 * - Start Day 2 action
 * - URL parameter support (?tester=id)
 */

import useSimulationAdminPageLogic from './useSimulationAdminPageLogic.js';
import TesterSelector from './components/TesterSelector.jsx';
import TesterInfoDisplay from './components/TesterInfoDisplay.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import './SimulationAdminPage.css';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';

export default function SimulationAdminPage() {
  const {
    testers,
    selectedTester,
    isLoading,
    error,
    isResetModalOpen,
    isAdvanceModalOpen,
    isProcessing,
    fetchTesters,
    resetToDay1,
    advanceToDay2,
    handleTesterSelect,
    openResetModal,
    closeResetModal,
    openAdvanceModal,
    closeAdvanceModal,
    getTesterDisplayName,
  } = useSimulationAdminPageLogic();

  return (
    <div className="simulation-admin-page">
      <AdminHeader />

      <main className="simulation-admin-main">
        <div className="simulation-admin-container">
          <h1 className="simulation-admin-title">Simulation Admin</h1>

          {error && (
            <div className="simulation-admin-error">
              <span>{error}</span>
              <button onClick={fetchTesters} className="simulation-admin-retry">
                Retry
              </button>
            </div>
          )}

          <TesterSelector
            testers={testers}
            selectedTester={selectedTester}
            isLoading={isLoading}
            onSelect={handleTesterSelect}
            getTesterDisplayName={getTesterDisplayName}
          />

          {selectedTester && (
            <TesterInfoDisplay
              tester={selectedTester}
              onResetToDay1={openResetModal}
              onAdvanceToDay2={openAdvanceModal}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && selectedTester && (
        <ConfirmationModal
          title="Reset to Day 1"
          message={`Are you sure you want to reset ${getTesterDisplayName(selectedTester)} to Day 1? This will set their usability step back to "Not Started".`}
          confirmLabel="Reset to Day 1"
          onConfirm={resetToDay1}
          onCancel={closeResetModal}
          isProcessing={isProcessing}
        />
      )}

      {/* Advance Confirmation Modal */}
      {isAdvanceModalOpen && selectedTester && (
        <ConfirmationModal
          title="Advance to Day 2"
          message={`Are you sure you want to advance ${getTesterDisplayName(selectedTester)} to Day 2? This will set their usability step to "Day 2 - Introduction".`}
          confirmLabel="Advance to Day 2"
          onConfirm={advanceToDay2}
          onCancel={closeAdvanceModal}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
