import { useEffect, useMemo, useState } from "react";

export default function PlaylistSelector({ token, onSelect }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const items = [];
        let url = "https://api.spotify.com/v1/me/playlists?limit=50";
        for (let i = 0; i < 5 && url; i++) {
          const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
          const data = await r.json();
          items.push(...(data.items || []));
          url = data.next;
        }
        setPlaylists(items);
        if (!selectedId && items.length) {
          setSelectedId(items[0].id);
          onSelect?.(items[0]);
        }
      } catch {
        setErr("Kunde inte hämta spellistor (token/scopes?).");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const selected = useMemo(
    () => playlists.find((p) => p.id === selectedId) || null,
    [playlists, selectedId]
  );

  useEffect(() => {
    if (selected) onSelect?.(selected);
  }, [selectedId]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>1) Välj spellista</h3>
      {loading ? (
        <div>Hämtar spellistor…</div>
      ) : err ? (
        <div style={{ color: "crimson" }}>{err}</div>
      ) : (
        <>
          <select
            style={selectStyle}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={!playlists.length}
          >
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.owner?.display_name ? `• ${p.owner.display_name}` : ""}
              </option>
            ))}
          </select>
          {selected && (
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              <small>
                {selected.tracks?.total ?? "?"} spår {selected.public ? "• publik" : "• privat"}
              </small>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const selectStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1px solid #2a2a2a", background: "#0e0e0e", color: "#f2f2f2",
};
