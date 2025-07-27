import React, { useState } from 'react';
import './styles/CriteriaSelection.css';
import AnalysisOverlay from './AnalysisOverlay';

const CriteriaSelection = ({ playlist, onConfirm }) => {
  const [minBPM, setMinBPM] = useState(120);
  const [maxBPM, setMaxBPM] = useState(160);
  const [lengthLimit, setLengthLimit] = useState(60);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);

  const genreOptions = [
    "acoustic", "ambient", "breakbeat", "chill", "classical", "dance",
    "deep house", "disco", "drum and bass", "dub", "edm", "electro",
    "electronic", "folk", "funk", "garage", "hardcore", "hardstyle", "house",
    "idm", "indie", "jazz", "melodic house", "minimal", "pop", "progressive house",
    "psytrance", "punk", "reggae", "rock", "soul", "tech house", "techno", "trance"
  ];

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = () => {
    setLoading(true);
    setAnalysisSteps(["🔍 Startar analys..."]);

    const simulateSteps = [
      "📦 Hämtar spellistans metadata",
      "🎚️ Analyserar BPM för alla låtar",
      "🎵 Identifierar genre per spår",
      "🧠 Genererar AI-rekommendationer",
      "📊 Sammanställer rapport..."
    ];

    // Simulerad analys med delay för varje steg
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < simulateSteps.length) {
        setAnalysisSteps((prev) => [...prev, simulateSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          onConfirm({
            minBPM,
            maxBPM,
            lengthLimit,
            selectedGenres,
            includeRecommendations
          });
        }, 1000);
      }
    }, 1000);
  };

  const createdAt = playlist?.tracks?.items?.[0]?.added_at
    ? new Date(playlist.tracks.items[0].added_at)
    : null;

  return (
    <div className="criteria-container">
      {loading && <AnalysisOverlay steps={analysisSteps} />}
      
      <h2>🎧 Välj analyskriterier</h2>

      {playlist && (
        <div className="playlist-info">
          <img src={playlist.images?.[0]?.url} alt="cover" className="cover" />
          <div className="meta">
            <h3>{playlist.name}</h3>
            <p>{playlist.tracks.total} låtar</p>
            {createdAt && <p>Skapad: {createdAt.toISOString().split("T")[0]}</p>}
          </div>
        </div>
      )}

      <div className="criteria-group">
        <label>BPM-intervall:</label>
        <div className="bpm-range">
          <input type="number" value={minBPM} onChange={(e) => setMinBPM(Number(e.target.value))} />
          <span>till</span>
          <input type="number" value={maxBPM} onChange={(e) => setMaxBPM(Number(e.target.value))} />
        </div>
      </div>

      <div className="criteria-group">
        <label>Längd på spellista (minuter):</label>
        <input type="number" value={lengthLimit} onChange={(e) => setLengthLimit(Number(e.target.value))} />
      </div>

      <div className="criteria-group">
        <label>Välj genrer:</label>
        <div className="genre-grid">
          {genreOptions.map((genre) => (
            <button
              key={genre}
              className={`genre-btn ${selectedGenres.includes(genre) ? 'active' : ''}`}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="criteria-group toggle">
        <label>
          <input
            type="checkbox"
            checked={includeRecommendations}
            onChange={(e) => setIncludeRecommendations(e.target.checked)}
          />
          Inkludera stilrekommendationer från AI (OpenAI)
        </label>
      </div>

      <button className="next-button" onClick={handleSubmit}>
        🚀 Kör analys
      </button>
    </div>
  );
};

export default CriteriaSelection;
