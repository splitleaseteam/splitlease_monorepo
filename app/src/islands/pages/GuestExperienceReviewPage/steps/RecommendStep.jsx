/**
 * RecommendStep - Step 9: NPS score (1-10 slider)
 */

import React from 'react';

export default function RecommendStep({ formData, updateField }) {
  const score = formData.recommend;

  // Get color based on score (NPS colors)
  const getScoreColor = (value) => {
    if (value <= 6) return '#EF4444'; // Detractor (red)
    if (value <= 8) return '#F59E0B'; // Passive (amber)
    return '#22C55E'; // Promoter (green)
  };

  // Get label based on score
  const getScoreLabel = (value) => {
    if (value <= 6) return 'Not likely';
    if (value <= 8) return 'Likely';
    return 'Very likely';
  };

  return (
    <div className="step recommend-step">
      <h2 className="step-question">
        How likely are you to recommend Split Lease to a friend?
      </h2>

      <p className="step-helper">
        On a scale of 1 to 10, where 10 means extremely likely.
      </p>

      <div className="nps-slider-container">
        <div className="nps-labels">
          <span>Not likely</span>
          <span>Extremely likely</span>
        </div>

        <div className="nps-slider-wrapper">
          <input
            type="range"
            className="nps-slider"
            min="1"
            max="10"
            value={score}
            onChange={(e) => updateField('recommend', parseInt(e.target.value, 10))}
            style={{
              '--slider-color': getScoreColor(score),
              '--slider-percent': `${((score - 1) / 9) * 100}%`
            }}
          />
        </div>

        <div className="nps-score-display" style={{ color: getScoreColor(score) }}>
          <span className="score-number">{score}</span>
          <span className="score-label">{getScoreLabel(score)}</span>
        </div>

        <div className="nps-scale">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              className={`nps-scale-button ${score === num ? 'active' : ''}`}
              onClick={() => updateField('recommend', num)}
              style={{
                '--button-color': num === score ? getScoreColor(num) : undefined
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
