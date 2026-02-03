export default function PercentageSlider({ label, value, onChange }) {
  return (
    <div className="percentage-slider">
      <div className="percentage-slider__header">
        <label>{label}</label>
        <span className="percentage-slider__value">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="percentage-slider__labels">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
