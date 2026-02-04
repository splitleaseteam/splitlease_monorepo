export default function PriceInput({ label, value, onChange }) {
  return (
    <div className="price-input">
      <label>{label}</label>
      <div className="price-input__field">
        <span className="price-input__currency">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min="0"
          step="5"
        />
      </div>
    </div>
  );
}
