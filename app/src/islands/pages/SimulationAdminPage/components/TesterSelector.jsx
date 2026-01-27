import './TesterSelector.css';

export default function TesterSelector({
  testers,
  selectedTester,
  isLoading,
  onSelect,
  getTesterDisplayName,
}) {
  return (
    <div className="tester-selector">
      <label className="tester-selector__label" htmlFor="tester-select">
        Select Usability Account
      </label>
      <select
        id="tester-select"
        className="tester-selector__select"
        value={selectedTester?.id || ''}
        onChange={(event) => {
          const testerId = event.target.value;
          const tester = testers.find((item) => item.id === testerId) || null;
          onSelect(tester);
        }}
        disabled={isLoading}
        required
      >
        <option value="">Select Usability Account</option>
        {testers.map((tester) => {
          const displayName = getTesterDisplayName(tester);
          const email = tester.email ? ` (${tester.email})` : '';
          return (
            <option key={tester.id} value={tester.id}>
              {displayName || tester.id}{email}
            </option>
          );
        })}
      </select>
    </div>
  );
}
