import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./services/api";
import PlaylistSelector from "./components/PlaylistSelector";
import CriteriaForm from "./components/CriteriaForm";
import ResultView from "./components/ResultView";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [token, setToken] = useState(null);
  const [tokenErr, setTokenErr] = useState("");

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [criteria, setCriteria] = useState({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("spotify_access_token");
      if (t) setToken(t);
      else setTokenErr("Ingen Spotify-token hittades. Logga in först.");
    } catch {
      setTokenErr("Kunde inte läsa Spotify-token.");
    }
  }, []);

  async function runAnalyze() {
    if (!token) { setAiErr("Ingen Spotify-token. Logga in först."); return; }
    if (!selectedPlaylist?.id) { setAiErr("Välj en spellista."); return; }

    setLoadingAI(true);
    setAiErr("");
    setResult(null);
    try {
      await sleep(150);
      const { data } = await axios.post(`${API_BASE}/analyze`, {
        token,
        playlistId: selectedPlaylist.id,
        criteria,
        createNew: true,
        llmLimit: 300,
      });
      if (!data?.ok) throw new Error(data?.error || "Okänt fel");
      setResult(data);
    } catch (e) {
      setAiErr("Kunde inte analysera. Testa igen (token/scopes, nätverk, rate-limit).");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div style={app}>
      <header style={header}>
        <h1 style={{ margin: 0, fontSize: 28 }}>🎧 TrackCurator</h1>
        <p style={{ marginTop: 6, opacity: 0.85 }}>AI-kurering – allt hostat på Cloudflare.</p>
      </header>

      <section style={card}>
        <strong>Spotify-status:</strong>{" "}
        {token ? <span style={{ color: "green" }}>inloggad ✅</span> : <span style={{ color: "crimson" }}>ej inloggad ❌</span>}
        {tokenErr && <div style={{ marginTop: 8, color: "crimson" }}>{tokenErr}</div>}
      </section>

      <section style={card}>
        <PlaylistSelector token={token} onSelect={setSelectedPlaylist} />
      </section>

      <section style={card}>
        <CriteriaForm onChange={setCriteria} onSubmit={runAnalyze} disabled={loadingAI || !token || !selectedPlaylist}/>
        {aiErr && <div style={{ marginTop: 8, color: "crimson" }}>{aiErr}</div>}
      </section>

      <ResultView result={result} />

      <footer style={{ marginTop: 20, opacity: 0.6 }}>
        <small>Backend: {API_BASE}</small>
      </footer>
    </div>
  );
}

const app   = { maxWidth: 880, margin: "32px auto", padding: "0 16px", fontFamily: "Inter, system-ui, sans-serif", color: "#eaeaea" };
const header= { marginBottom: 16 };
const card  = { background: "#131313", border: "1px solid #2a2a2a", borderRadius: 14, padding: 16, margin: "12px 0", boxShadow: "0 2px 10px rgba(0,0,0,.35)" };
