import { useEffect, useState } from "react";

export default function PlaylistSelector({ token, onSelect }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const r = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const j = await r.json();
      setItems(j.items || []);
    })();
  }, [token]);

  return (
    <ul className="playlist-list">
      {items.map((pl) => (
        <li key={pl.id} className="playlist-item" onClick={() => onSelect?.(pl)}>
          <img className="playlist-item-image" src={pl.images?.[0]?.url || ""} alt="" />
          <div className="playlist-item-info">
            <span className="playlist-item-title">{pl.name}</span>
            <span className="playlist-item-owner">Spellista • {pl.owner?.display_name || ""}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
