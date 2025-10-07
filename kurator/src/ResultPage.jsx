export default function ResultPage({ result }) {
  const r = result || {};
  const cards = r.analysis?.cards || r.cards || [];
  const title = r.analysis?.title || r.llm_title || "Kuraterad spellista";
  const desc  = r.analysis?.description || r.llm_description || "";

  return (
    <div className="result-page">
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}

      {cards.length > 0 && (
        <div className="cards">
          {cards.slice(0,5).map((c, i) => (
            <div key={i} className="card">
              <div className="card-emoji">{c.emoji || "🎵"}</div>
              <div className="card-title">{c.title}</div>
              <div className="card-body">{c.body}</div>
              {c.why_it_matters && <div className="card-meta">{c.why_it_matters}</div>}
            </div>
          ))}
        </div>
      )}

      {r.newPlaylist?.external_urls?.spotify && (
        <a
          className="open-in-spotify"
          href={r.newPlaylist.external_urls.spotify}
          target="_blank"
          rel="noreferrer"
        >
          Öppna nya spellistan i Spotify
        </a>
      )}
    </div>
  );
}
