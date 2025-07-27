import React from 'react';
// FEL: import './styles/AnalysisOverlay.css';
// RÄTT:
import './styles/AnalysisOverlay.css'; // Förutsatt att filen ligger i src/

const AnalysisOverlay = ({ steps }) => { // 'steps' är prop från din ursprungliga kod
    // I den nya App.jsx använder vi 'message', men vi kan anpassa oss här.
    // Låt oss förutsätta att `steps` är meddelandet som ska visas.
    const message = Array.isArray(steps) ? steps.join(' ') : steps;

    return (
        <div className="overlay">
            <div className="popup">
                <p>{message || 'Arbetar...'}</p>
                {/* Du kan lägga till en spinner eller annan grafik här om du vill */}
            </div>
        </div>
    );
};

export default AnalysisOverlay;