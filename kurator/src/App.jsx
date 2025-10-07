import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./services/api.js";

// Dina befintliga komponenter
import PlaylistSelector from "./PlaylistSelector.jsx";       // har redan CSS
import CriteriaSelection from "./CriteriaSelection.jsx";     // har redan CSS
import ResultPage from "./ResultPage.jsx";                   // visar resultat

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  // Spotify-token (satt av ditt loginflöde)
  const [token, setToken] = useState(null);
  const [tokenErr, setTokenErr] = useState("");

  // Vald spellista från sidans vänsterkolumn
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Kriterier från CriteriaSelection
  const [criteria, setCriteria] = useState({
    genres: [],       // array av strängar
    moods: [],        // array av strängar
    bpmMin: 0,
    bpmMax: 0,
    lengthMin: 0      // i minuter
  });

  // Läge/resultat
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Plocka token från sessionStorage (matcha ditt loginflöde)
  useEffect(() => {
    try {
      const t = sessionStorage.getItem("spotify_access_token");
      if (t) setToken(t);
      else setTokenErr("Ingen Spotify-token hittades. Logga in först.");
    } catch {
      setTokenErr("Kunde inte läsa Spotify-token.");
    }
  }, []);

  // Kallas när du klickar på “Generera ny spellista”
  async function handleGenerate() {
    if (!token) { setError("Ingen Spotify-token. Logga in först."); return; }
    if (!selectedPlaylist?.id) { setError("Välj en spellista."); return; }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      await sleep(120);

      // Mappa dina UI-kriterier → backend-format
      const payload = {
        token,
        playlistId: selectedPlaylist.id,
        createNew: true,
        llmLimit: 300,
        criteria: {
          mood: criteria.moods.join(", "),                            // "Fest, Glad"
          genre: criteria.genres.join(", "),                          // "House, Pop"
          bpmRange: toBpmRange(criteria.bpmMin, criteria.bpmMax),     // "118-132" el. ""
          length: criteria.lengthMin                                  // minuter (valfritt)
        }
      };

      const { data } = await axios.post(`${API_BASE}/analyze`, payload);
      if (!data?.ok) throw new Error(data?.error || "Okänt fel");
      setResult(data);
    } catch (e) {
      setError("Kunde inte generera spellista. Testa igen (token/scopes, nätverk).");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      {/* Vänster: Dina spellistor (din komponent + CSS) */}
      <aside className="sidebar">
        <PlaylistSelector
          token={token}
          onSelect={setSelectedPlaylist}   // får hela playlist-objektet
        />
        <div className="logout-row">
          {/* Din befintliga “Logga ut”-knapp kan ligga kvar här */}
        </div>
      </aside>

      {/* Höger: Det stora kortet med kriterier och CTA-knapp */}
      <main className="content">
        {selectedPlaylist && (
          <header className="playlist-header">
            <h1 className="playlist-title">{selectedPlaylist.name}</h1>
            {/* Din befintliga artwork/ägare/antal spår kan ligga kvar här */}
          </header>
        )}

        {/* Kriterier – behåll din look; vi skickar upp state via props */}
        <section className="criteria-card">
          <CriteriaSelection
            // Dessa två props behöver du implementera i CriteriaSelection (se filen nedan):
            onChange={setCriteria}            // skickar upp {genres,moods,bpmMin,bpmMax,lengthMin}
            onGenerate={handleGenerate}       // körs när du trycker på knappen
            submitting={submitting}
          />

          {/* Felmeddelande (behåller din stil – lägg valfri klass) */}
          {error && <div className="error-text">{error}</div>}
          {tokenErr && <div className="error-text">{tokenErr}</div>}
        </section>

        {/* Resultat – din sida/komponent renderar titeln, beskrivningen, trivia mm */}
        {result && (
          <section className="result-card">
            <ResultPage
              result={result}                  // { newPlaylist, llm_title, llm_description, analysis.cards, ... }
            />
          </section>
        )}
      </main>
    </div>
  );
}

function toBpmRange(min, max) {
  const a = parseInt(min, 10), b = parseInt(max, 10);
  if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && b >= a) {
    return `${a}-${b}`;
  }
  return "";
}
