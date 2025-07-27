import React, { useEffect, useRef, useState } from "react";
import "./ResultPage.css"; // Se till att sökvägen är rätt
import axios from "axios";
import ReactMarkdown from 'react-markdown';

const ResultPage = ({ resultData, onRestart, accessToken }) => {
  const embedRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState("");

  const sourcePlaylistUri = resultData?.sourcePlaylistUri;

  // --- NY, MER ROBUST LOGIK FÖR SPOTIFY-SPELAREN ---
  useEffect(() => {
    // Gör ingenting om vi inte har en URI eller en plats att rendera spelaren på
    if (!sourcePlaylistUri || !embedRef.current) {
      return;
    }

    const scriptId = 'spotify-iframe-api';
    
    const createPlayer = () => {
      // Säkerställ att API:et finns på window-objektet
      if (window.SpotifyIframeApi) {
        embedRef.current.innerHTML = ''; // Rensa eventuell gammal spelare
        const options = {
          width: '100%',
          height: '380',
          uri: sourcePlaylistUri
        };
        const callback = (controller) => {}; // Tom callback
        window.SpotifyIframeApi.createController(embedRef.current, options, callback);
      }
    };

    // Om skriptet inte redan finns på sidan, lägg till det
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);

      // När skriptet har laddats, definiera vad som ska hända
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        createPlayer();
      };
    } else {
      // Om skriptet redan finns, kör funktionen direkt
      createPlayer();
    }

  }, [sourcePlaylistUri]);

  // Skyddsnät ifall datan inte har kommit än
  if (!resultData || !resultData.foundTracks) {
    return (
      <div className="result-container placeholder">
        <h2>Laddar resultat...</h2>
        <p>Om detta tar tid, gå tillbaka och försök igen.</p>
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

      <div className="embed-player-container">
        <h3>Lyssna på originalspellistan</h3>
        <div ref={embedRef} className="embed-player"></div>
      </div>
      
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