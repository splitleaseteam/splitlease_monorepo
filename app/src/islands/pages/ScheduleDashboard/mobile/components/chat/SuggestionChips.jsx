export default function SuggestionChips({ chips, onSelect }) {
  return (
    <div className="suggestion-chips">
      {chips.map((chip, i) => (
        <button
          key={`${chip}-${i}`}
          className="suggestion-chips__chip"
          onClick={() => onSelect(chip)}
          type="button"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
