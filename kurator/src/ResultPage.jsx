import React, { useEffect, useRef, useState } from "react";
import "./styles/ResultPage.css";
import axios from "axios";

const ResultPage = ({
  accessToken,
  playlistUri,
  genresInfo,
  recommendedTracks,
  userName = "Kurator-användare",
}) => {
  const embedRef = useRef(null);
  const [showFact, setShowFact] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [saveStatus, setSaveStatus] = useState("");

  // Hantera responsivitet
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Spotify Embed Player
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      IFrameAPI.createController(
        embedRef.current,
        {
          width: "100%",
          height: "152",
          uri: playlistUri,
        },
        (controller) => controller.play()
      );
    };
  }, [playlistUri]);

  const handleFactClick = (genre) => {
    setShowFact(showFact === genre ? null : genre);
  };

  const exportCSV = () => {
    const rows = genresInfo.map((g) => [
      `"${g.genre}"`,
      `"${g.personality}"`,
      `"${g.funFact}"`,
    ]);
    const csv = ["Genre,Personlighet,Fun Fact", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "genre_fakta.csv";
    a.click();
  };

  const exportHTML = () => {
    const html = `
      <html>
      <head><title>AI-genererad Rapport</title></head>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1>🎧 AI-genererad Musikrapport för ${userName}</h1>
        <p><strong>Ansvarsfriskrivning:</strong> Detta innehåll är AI-genererat av OpenAI baserat på din Spotify-data. Det är inte associerat med Spotify eller OpenAI.</p>
        <h2>Genrefakta</h2>
        <ul>
          ${genresInfo
            .map(
              (g) =>
                `<li><strong>${g.genre}</strong>: ${g.personality}. Fun fact: ${g.funFact}</li>`
            )
            .join("")}
        </ul>
      </body>
      </html>
    `;
    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
  };

  const savePlaylistToLibrary = async () => {
    try {
      setSaveStatus("🕐 Skapar spellista...");

      // 1. Hämta användar-id
      const userRes = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userId = userRes.data.id;

      // 2. Skapa ny spellista
      const createRes = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: "🎧 Kurator-rekommendationer",
          description: "Genererad av Spotify Kurator med hjälp av OpenAI ✨",
          public: false,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const newPlaylistId = createRes.data.id;

      // 3. Lägg till låtar
      await axios.post(
        `https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`,
        {
          uris: recommendedTracks,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setSaveStatus("✅ Spellistan sparades!");
    } catch (err) {
      console.error(err);
      setSaveStatus("❌ Kunde inte spara spellistan.");
    }
  };

  return (
    <div className="result-container">
      <h2 className="result-title">🎉 Din rekommenderade spellista</h2>

      <div className="embed-player" ref={embedRef}></div>

      <p className="hint">
        Tryck på hjärtat i spelaren för att spara — eller klicka nedan för att skapa spellistan
        direkt:
      </p>

      <button
        onClick={savePlaylistToLibrary}
        className="px-4 py-2 mb-4 bg-green-600 rounded hover:bg-green-700"
      >
        Spara spellista till mitt Spotify-konto
      </button>
      {saveStatus && <p className="text-sm text-gray-400">{saveStatus}</p>}

      <div className="flex gap-3 mt-4 mb-8">
        <button onClick={exportCSV} className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">
          Exportera till CSV
        </button>
        <button
          onClick={exportHTML}
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
        >
          Visa HTML-rapport
        </button>
      </div>

      <div className="genre-facts-section">
        <h3>🎵 Genrefakta</h3>
        <div className="facts-grid">
          {genresInfo.map((genreData) => (
            <div
              key={genreData.genre}
              className="genre-fact-card"
              onClick={() => handleFactClick(genreData.genre)}
            >
              <h4>{genreData.genre}</h4>
              {isMobile || showFact === genreData.genre ? (
                <div className="fact-details">
                  <p>
                    <strong>Personlighet:</strong> {genreData.personality}
                  </p>
                  <p>
                    <strong>Fun fact:</strong> {genreData.funFact}
                  </p>
                </div>
              ) : (
                <p className="click-to-expand">Klicka för att visa</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
