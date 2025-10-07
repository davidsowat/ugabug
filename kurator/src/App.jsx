import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./services/api.js";
import PlaylistSelector from "./PlaylistSelector.jsx"; // ← din befintliga komponent

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  // token från ditt befintliga loginflöde (PKCE)
  const [token, setToken] = useState(null);
  const [tokenErr, setTokenErr] = useState("");

  // vald spellista (från PlaylistSelector)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // kriterier (du kan koppla dessa vidare till dina Criteria* komponenter om du vill)
  const [criteria, setCriteria] = useState({
    mood: "",
    bpmRange: "",
    genre: "",
    length: "",
  });

  // AI/Result
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
        criteria: sanitizeCriteria(criteria),
        createNew: true,
        llmLimit: 300,
      });
      if (!data?.ok) throw new Error(data?.error || "Okänt fel");
      setResult(data);
    } catch (_e) {
      setAiErr("Kunde inte analysera. Testa igen (token/scopes, nätverk, rate-limit).");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>🎧 TrackCurator</h1>
        <p style={{ marginTop: 6, opacity: 0.85 }}>AI-kurering – allt hostat på Cloudflare.</p>
      </header>

      <section style={styles.card}>
        <strong>Spotify-status:</strong>{" "}
        {token ? <span style={{ color: "green" }}>inloggad ✅</span> : <span style={{ color: "crimson" }}>ej inloggad ❌</span>}
        {tokenErr && <div style={styles.err}>{tokenErr}</div>}
      </section>

      <section style={styles.card}>
        {/* Din PlaylistSelector.jsx hämtar listor med access-token och skickar upp vald spellista */}
        <PlaylistSelector token={token} onSelect={setSelectedPlaylist} />
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Kriterier</h3>
        <div style={styles.grid}>
          <Field label="Mood (komma-separerat)">
            <input style={styles.input} placeholder="t.ex. fest, glad, fokus"
              value={criteria.mood} onChange={(e)=>setCriteria(v=>({...v, mood:e.target.value}))}/>
          </Field>
          <Field label="BPM-intervall">
            <input style={styles.input} placeholder="t.ex. 118-132"
              value={criteria.bpmRange} onChange={(e)=>setCriteria(v=>({...v, bpmRange:e.target.value}))}/>
          </Field>
          <Field label="Genrer">
            <input style={styles.input} placeholder="t.ex. house, pop"
              value={criteria.genre} onChange={(e)=>setCriteria(v=>({...v, genre:e.target.value}))}/>
          </Field>
          <Field label="Total längd (min)">
            <input style={styles.input} type="number" min={0} step={5} placeholder="t.ex. 60"
              value={criteria.length} onChange={(e)=>setCriteria(v=>({...v, length:e.target.value}))}/>
          </Field>
        </div>

        <button style={styles.button} onClick={runAnalyze} disabled={loadingAI || !token || !selectedPlaylist}>
          {loadingAI ? "Skapar kurering…" : "Generera med AI"}
        </button>
        {aiErr && <div style={styles.err}>{aiErr}</div>}
      </section>

      {result && (
        <section style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Resultat</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={styles.titleRow}>
              <h2 style={{ margin: 0 }}>{result.llm_title || "Ny spellista"}</h2>
              {result.newPlaylist?.external_urls?.spotify && (
                <a href={result.newPlaylist.external_urls.spotify} target="_blank" rel="noreferrer" style={styles.linkBtn}>
                  Öppna på Spotify ↗
                </a>
              )}
            </div>
            <p style={{ marginTop: 6, opacity: 0.85 }}>
              {result.llm_description || "AI-genererad beskrivning saknas."}
            </p>
            <small style={{ opacity: 0.7 }}>
              {result.counts?.curated ?? 0} kuraterade av {result.counts?.original ?? 0} spår
              {result.playlistMeta?.name ? ` • källa: ${result.playlistMeta.name}` : ""}
            </small>
          </div>

          {Array.isArray(result.analysis?.cards) && result.analysis.cards.length > 0 && (
            <div style={styles.cardsGrid}>
              {result.analysis.cards.map((c, i) => (
                <div key={i} style={styles.infoCard}>
                  <div style={{ fontSize: 20 }}>{c.emoji || "🎵"}</div>
                  <div style={{ fontWeight: 600 }}>{c.title || "Trivia"}</div>
                  <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{c.body}</div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{c.why_it_matters}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer style={{ marginTop: 20, opacity: 0.6 }}>
        <small>Backend: {API_BASE}</small>
      </footer>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.85 }}>{label}</label>
      {children}
    </div>
  );
}

function sanitizeCriteria(c) {
  const out = { ...c };
  out.mood     = (out.mood || "").trim();
  out.genre    = (out.genre || "").trim();
  out.bpmRange = (out.bpmRange || "").replace(/\s+/g, "");
  const len    = parseInt(out.length, 10);
  out.length   = Number.isFinite(len) ? Math.max(0, Math.min(len, 600)) : "";
  return out;
}

const styles = {
  app: { maxWidth: 880, margin: "32px auto", padding: "0 16px", fontFamily: "Inter, system-ui, sans-serif", color: "#eaeaea" },
  header: { marginBottom: 16 },
  card: { background: "#131313", border: "1px solid #2a2a2a", borderRadius: 14, padding: 16, margin: "12px 0", boxShadow: "0 2px 10px rgba(0,0,0,.35)" },
  err: { marginTop: 8, color: "crimson" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginBottom: 12 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a2a", background: "#0e0e0e", color: "#eaeaea" },
  button: { marginTop: 8, background: "#1db954", color: "#0a0a0a", fontWeight: 700, border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer" },
  titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  linkBtn: { background: "#0e0e0e", border: "1px solid #2a2a2a", padding: "8px 10px", borderRadius: 10, color: "#87cefa", textDecoration: "none" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginTop: 6 },
  infoCard: { background: "#0e0e0e", border: "1px solid #2a2a2a", borderRadius: 12, padding: 12 }
};
