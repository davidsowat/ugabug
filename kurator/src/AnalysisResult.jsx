import React from "react";
import "./styles/AnalysisResult.css";

const AnalysisResult = ({ tracks, recommendations, onExport, onCreatePlaylist }) => {
  return (
    <div className="results-container">
      <h2>🎶 Resultat från analys</h2>

      <div className="results-summary">
        <p>{tracks.length} låtar matchade dina kriterier.</p>
        <button onClick={onExport}>📁 Exportera som CSV</button>
        <button onClick={onCreatePlaylist}>🎧 Skapa ny spellista</button>
      </div>

      <div className="track-list">
        {tracks.map((track, index) => (
          <div key={track.id} className="track-item">
            <img src={track.album.images[0]?.url} alt="cover" />
            <div>
              <strong>{track.name}</strong> <br />
              {track.artists.map((a) => a.name).join(", ")}<br />
              {track.tempo} BPM – {Math.floor(track.duration_ms / 60000)} min
            </div>
          </div>
        ))}
      </div>

      {recommendations && (
        <div className="gpt-recommendations">
          <h3>🤖 GPT Stilrekommendationer</h3>
          <p>{recommendations}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
