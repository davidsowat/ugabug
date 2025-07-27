import React, { useEffect, useState } from 'react';
import './PlaylistSelector.css';
import CriteriaSelection from './CriteriaSelection';

const PlaylistSelector = ({ token, onLogout, handleGeneratePlaylist }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setPlaylists(data.items);
          if (data.items.length > 0) {
            setSelectedPlaylist(data.items[0]);
          }
        }
      });
  }, [token]);

  return (
    <div className="playlist-container">
      <div className="sidebar">
        <div className="sidebar-header"><h2>Dina Spellistor</h2></div>
        <ul className="playlist-list">
          {playlists.map((playlist) => (
            <li key={playlist.id} className={`playlist-item ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`} onClick={() => setSelectedPlaylist(playlist)}>
              <img src={playlist.images[0]?.url} alt="cover" className="playlist-item-image" />
              <div className="playlist-item-info">
                <span className="playlist-item-title">{playlist.name}</span>
                <span className="playlist-item-owner">Spellista • {playlist.owner.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={onLogout} className="logout-button">Logga ut</button>
      </div>
      <div className="main-content">
        {selectedPlaylist ? (
          <>
            <div className="main-content-header">
              <img src={selectedPlaylist.images[0]?.url} alt="cover" className="main-content-cover-art" />
              <div className="main-content-text">
                <span className="playlist-type">Vald spellista</span>
                <h1>{selectedPlaylist.name}</h1>
                <p>{selectedPlaylist.description || `${selectedPlaylist.owner.display_name} • ${selectedPlaylist.tracks.total} låtar`}</p>
              </div>
            </div>
            <CriteriaSelection 
              playlist={selectedPlaylist}
              onConfirm={handleGeneratePlaylist} // Skickar funktionen vidare hit
            />
          </>
        ) : (
          <div className="main-content-placeholder"><h2>Laddar...</h2></div>
        )}
      </div>
    </div>
  );
};

export default PlaylistSelector;