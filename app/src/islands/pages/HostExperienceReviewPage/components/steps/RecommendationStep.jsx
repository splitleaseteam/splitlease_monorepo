import React from 'react';
import './steps.css';

/**
 * Step 9: NPS Recommendation Score (1-10 Slider)
 */
export default function RecommendationStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const score = formData.recommendationScore || 5;

  // NPS category based on score
  const getScoreLabel = (value) => {
    if (value >= 9) return 'Promoter';
    if (value >= 7) return 'Passive';
    return 'Detractor';
  };

  const getScoreColor = (value) => {
    if (value >= 9) return '#22c55e'; // green
    if (value >= 7) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__slider-container">
        {/* Score Display */}
        <div
          className="survey-step__score-display"
          style={{ color: getScoreColor(score) }}
        >
          <span className="survey-step__score-number">{score}</span>
          <span className="survey-step__score-label">{getScoreLabel(score)}</span>
        </div>

        {/* Slider */}
        <input
          type="range"
          id="recommendationScore"
          className="survey-step__slider"
          min="1"
          max="10"
          step="1"
          value={score}
          onChange={(e) => onFieldChange('recommendationScore', parseInt(e.target.value, 10))}
        />

        {/* Scale Labels */}
        <div className="survey-step__slider-labels">
          <span>1 - Not likely</span>
          <span>10 - Very likely</span>
        </div>
      </div>
    </div>
  );
}
