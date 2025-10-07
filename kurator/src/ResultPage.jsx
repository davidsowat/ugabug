export default function ResultView({ result }) {
  if (!result) return null;

  const title = result.llm_title || "Ny spellista";
  const desc  = result.llm_description || "AI-genererad beskrivning saknas.";
  const count = result.counts?.curated ?? 0;
  const total = result.counts?.original ?? 0;
  const source= result.playlistMeta?.name ? ` • källa: ${result.playlistMeta.name}` : "";
  const link  = result.newPlaylist?.external_urls?.spotify;

  return (
    <section style={card}>
      <h3 style={{ marginTop: 0 }}>Resultat</h3>
      <div style={{ marginBottom: 12 }}>
        <div style={titleRow}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {link && (
            <a href={link} target="_blank" rel="noreferrer" style={linkBtn}>
              Öppna på Spotify ↗
            </a>
          )}
        </div>
        <p style={{ marginTop: 6, opacity: 0.85 }}>{desc}</p>
        <small style={{ opacity: 0.7 }}>
          {count} kuraterade av {total} spår{source}
        </small>
      </div>

      {Array.isArray(result.analysis?.cards) && result.analysis.cards.length > 0 && (
        <div style={cardsGrid}>
          {result.analysis.cards.map((c, i) => (
            <div key={i} style={infoCard}>
              <div style={{ fontSize: 20 }}>{c.emoji || "🎵"}</div>
              <div style={{ fontWeight: 600 }}>{c.title || "Trivia"}</div>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{c.body}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{c.why_it_matters}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const card = { background: "#131313", border: "1px solid #2a2a2a", borderRadius: 14, padding: 16, margin: "12px 0", boxShadow: "0 2px 10px rgba(0,0,0,.35)" };
const titleRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
const linkBtn = { background: "#0e0e0e", border: "1px solid #2a2a2a", padding: "8px 10px", borderRadius: 10, color: "#87cefa", textDecoration: "none" };
const cardsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginTop: 6 };
const infoCard = { background: "#0e0e0e", border: "1px solid #2a2a2a", borderRadius: 12, padding: 12 };
