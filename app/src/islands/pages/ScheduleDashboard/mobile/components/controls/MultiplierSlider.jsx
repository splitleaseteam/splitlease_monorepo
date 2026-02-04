export default function MultiplierSlider({ label, value, onChange, min = 1, max = 3 }) {
  return (
    <div className="multiplier-slider">
      <div className="multiplier-slider__header">
        <label>{label}</label>
        <span className="multiplier-slider__value">{value.toFixed(2)}x</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
