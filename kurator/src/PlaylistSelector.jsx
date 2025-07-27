import React, { useEffect, useState } from 'react';
import './PlaylistSelector.css';

const PlaylistSelector = ({ token, onSelect }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [sortOption, setSortOption] = useState('recent');

  useEffect(() => {
    fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setPlaylists(data.items);
        }
      });
  }, [token]);

  const handleSort = (type) => {
    const sorted = [...playlists];
    switch (type) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'mostTracks':
        sorted.sort((a, b) => b.tracks.total - a.tracks.total);
        break;
      default:
        sorted.sort((a, b) => new Date(b.snapshot_id) - new Date(a.snapshot_id)); // latest
    }
    setPlaylists(sorted);
    setSortOption(type);
  };

  const handleSelect = () => {
    if (selectedPlaylist) {
      onSelect(selectedPlaylist);
    } else {
      alert('Välj en spellista först!');
    }
  };

  return (
    <div className="playlist-container">
      <div className="sidebar">
        <h2>Dina Spellistor</h2>
        <select onChange={(e) => handleSort(e.target.value)} value={sortOption}>
          <option value="recent">Senast uppdaterad</option>
          <option value="alphabetical">A–Ö</option>
          <option value="mostTracks">Mest låtar</option>
        </select>

        <ul className="playlist-list">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className={selectedPlaylist?.id === playlist.id ? 'selected' : ''}
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <img src={playlist.images[0]?.url} alt="cover" />
              <span>{playlist.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content">
        {selectedPlaylist ? (
          <>
            <h2>{selectedPlaylist.name}</h2>
            <p>{selectedPlaylist.tracks.total} låtar</p>
            <button className="continue-button" onClick={handleSelect}>
              Fortsätt
            </button>
          </>
        ) : (
          <p>Välj en spellista i menyn till vänster.</p>
        )}
      </div>
    </div>
  );
};

export default PlaylistSelector;
