import React, { useEffect, useRef, useState } from "react";
import "./styles/ResultPage.css"; // Se till att sökvägen är korrekt
import axios from "axios";
import ReactMarkdown from 'react-markdown';

const ResultPage = ({ resultData, onRestart, accessToken }) => {
  const embedRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("");
  const sourcePlaylistUri = resultData?.sourcePlaylistUri;

  useEffect(() => {
    // Din befintliga logik för spelaren är bra och kan vara kvar här
    if (sourcePlaylistUri && embedRef.current) {
        // ... (logik för att ladda spelaren)
    }
  }, [sourcePlaylistUri]);

  if (!resultData || !resultData.foundTracks) {
    return (
      <div className="result-container placeholder">
        <h2>Laddar resultat...</h2>
        <button onClick={onRestart} className="restart-button">Börja om</button>
      </div>
    );
  }

  const {
    personalityAnalysis,
    dominantGenres,
    funFacts,
    matchingReasoning,
    foundTracks,
  } = resultData;

  const savePlaylistToLibrary = async () => {
    // Din befintliga spara-funktion
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>Din nya mix är klar!</h1>
      </div>
      
      {/* --- KORREKT ORDNING HÄR --- */}
      <div className="ai-analysis-section">
        <h2>🤖 AI-kuratorns analys</h2>
        <div className="analysis-grid">
          <div className="analysis-card">
            <h3>Personlighetsprofil</h3>
            <p>{personalityAnalysis}</p>
          </div>
          <div className="analysis-card">
            <h3>Dominerande Genrer</h3>
            <p>{dominantGenres?.join(", ")}</p>
          </div>
          <div className="analysis-card">
            <h3>Visste du att...</h3>
            <p>{funFacts}</p>
          </div>
        </div>
      </div>

      <div className="reasoning-section">
        <h2>🧠 Så här tänkte AI:n</h2>
        <div className="reasoning-card">
          <ReactMarkdown>{matchingReasoning}</ReactMarkdown>
        </div>
      </div>

      <div className="playlist-section">
        <h2>🎧 Rekommenderade låtar ({foundTracks.length} st)</h2>
        <div className="track-list">
          {foundTracks.map((track, index) => (
            <div className="track-item" key={track.id}>
              <span className="track-number">{index + 1}</span>
              <img src={track.album.images[2]?.url || ''} alt={track.album.name} />
              <div className="track-info">
                <strong className="track-title">{track.name}</strong>
                <span className="track-artist">{track.artists.map(a => a.name).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions-section">
        <button onClick={savePlaylistToLibrary} className="save-button">Spara till Spotify</button>
        <button onClick={onRestart} className="restart-button">Skapa en till</button>
        {saveStatus && <p className="save-status">{saveStatus}</p>}
      </div>
    </div>
  );
};

export default ResultPage;