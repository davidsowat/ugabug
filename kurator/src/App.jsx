import { useEffect, useState } from "react";
import { postAnalyze, postBatch } from "./services/api.js";
import PlaylistSelector from "./PlaylistSelector.jsx";
import CriteriaSelection from "./CriteriaSelection.jsx";
import ResultPage from "./ResultPage.jsx";

const StatusBanner = ({ ok, message }) => (
  <div
    style={{
      background: ok ? "#0f2d17" : "#2b0f12",
      color: ok ? "#b6f3c6" : "#ffb5c0",
      border: `1px solid ${ok ? "#1d7c43" : "#7c1d2b"}`,
      borderRadius: 12,
      padding: "14px 16px",
      margin: "12px 0 18px",
      boxShadow: "0 2px 12px rgba(0,0,0,.35)",
      fontWeight: 600,
    }}
  >
    {ok ? "Spotify-status: inloggad ✅" : "Spotify-status: ej inloggad ❌"}
    <div style={{ marginTop: 6, fontWeight: 400, opacity: 0.9 }}>{message}</div>
  </div>
);

export default function App() {
  const [token, setToken] = useState(null);
  const [tokenErr, setTokenErr] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const [criteria, setCriteria] = useState({
    useGenre: false, useMood: false, useTempo: false, useDuration: true,
    genres: [], moods: [], bpmMin: 100, bpmMax: 140, lengthMin: 60,
  });

  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const t = sessionStorage.getItem("spotify_access_token");
    if (t) setToken(t); else setTokenErr("Ingen Spotify-token hittades. Logga in först.");
  }, []);

  const handleGenerate = async () => {
    if (!token) return setAiErr("Saknar Spotify-token");
    if (!selectedPlaylist?.id) return setAiErr("Välj en spellista");
    setBusy(true); setAiErr(""); setResult(null);

    try {
      // (valfritt) batch-steg
      await postBatch({ userId: "me", tracks: [], batchNumber: 1, totalBatches: 1 });

      const payload = {
        token,
        playlistId: selectedPlaylist.id,
        createNew: true,
        llmLimit: 300,
        criteria: {
          mood:  criteria.useMood  ? criteria.moods.join(", ")  : "",
          genre: criteria.useGenre ? criteria.genres.join(", ") : "",
          bpmRange:
            criteria.useTempo && criteria.bpmMin && criteria.bpmMax && criteria.bpmMax >= criteria.bpmMin
              ? `${criteria.bpmMin}-${criteria.bpmMax}` : "",
          length: criteria.useDuration ? criteria.lengthMin : "",
        }
      };
      const { data } = await postAnalyze(payload);
      if (!data?.ok) throw new Error(data?.error || "Okänt fel");
      setResult(data);
    } catch (e) {
      setAiErr(e.message || "Kunde inte generera");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="playlist-container">
      <div className="sidebar">
        <div className="sidebar-header"><h2>Dina Spellistor</h2></div>
        <PlaylistSelector token={token} onSelect={setSelectedPlaylist}/>
        <button className="logout-button" onClick={() => { sessionStorage.clear(); location.href="/"; }}>
          Logga ut
        </button>
      </div>

      <div className="main-content">
        <div style={{ padding: 16 }}>
          <StatusBanner
            ok={Boolean(token)}
            message={token ? "Redo att kurera." : (tokenErr || "Logga in först.")}
          />
        </div>

        {selectedPlaylist && (
          <div className="main-content-header">
            <img
              alt="cover"
              className="main-content-cover-art"
              src={selectedPlaylist.images?.[0]?.url || ""}
            />
            <div className="main-content-text">
              <span className="playlist-type">Vald spellista</span>
              <h1>{selectedPlaylist.name}</h1>
              <p>{selectedPlaylist.owner?.display_name || ""} • {selectedPlaylist.tracks?.total || 0} låtar</p>
            </div>
          </div>
        )}

        <div className="criteria-view-container">
          <div className="criteria-header">
            <h2>Sätt dina kriterier</h2>
            <p>Klicka på en sektion för att aktivera den.</p>
          </div>

          <CriteriaSelection
            value={criteria}
            onChange={setCriteria}
            onGenerate={handleGenerate}
            submitting={busy}
          />

          {aiErr && <div style={{ color: "crimson", marginTop: 8 }}>{aiErr}</div>}
        </div>

        {result && (
          <div className="result-card">
            <ResultPage result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
