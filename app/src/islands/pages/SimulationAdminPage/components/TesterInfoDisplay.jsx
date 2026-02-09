import './TesterInfoDisplay.css';

export default function TesterInfoDisplay({
  tester,
  onResetToDay1,
  onAdvanceToDay2,
  isProcessing,
}) {
  const aiCredits = tester.aiCredits ?? tester['AI Credits'] ?? tester.ai_credits ?? 'N/A';
  const firstName = tester.firstName || tester.first_name || tester.nameFirst || '';
  const testerType = tester.typeDisplay || tester.userType || tester['Type'] || 'N/A';
  const usabilityStep = tester.usabilityStep ?? tester.usability_step ?? 'N/A';

  return (
    <div className="tester-info-display">
      <p className="tester-info-display__line">
        {aiCredits}
      </p>
      <p className="tester-info-display__line">
        Name: {firstName || 'Unknown'}
      </p>
      <p className="tester-info-display__line">
        Tester Type: {testerType}
      </p>
      <p className="tester-info-display__line">
        Usability Step: {usabilityStep}
      </p>

      <div className="tester-info-display__actions">
        <button
          type="button"
          className="tester-info-display__button"
          onClick={onResetToDay1}
          disabled={!tester || isProcessing}
        >
          Reset Usability
        </button>
        <button
          type="button"
          className="tester-info-display__button"
          onClick={onAdvanceToDay2}
          disabled={!tester || isProcessing}
        >
          Start Day 2
        </button>
      </div>
    </div>
  );
}
