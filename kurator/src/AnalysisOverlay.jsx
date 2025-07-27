import React from 'react';
import './styles/AnalysisOverlay.css';

const AnalysisOverlay = ({ steps }) => {
  return (
    <div className="overlay">
      <div className="popup">
        <div className="spinner" />
        <h3>🔍 Analyserar...</h3>
        <ul>
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisOverlay;
