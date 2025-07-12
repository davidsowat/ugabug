import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function SpotifyKurator() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [report, setReport] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const logMessage = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const startAnalysis = async () => {
    try {
      setLoading(true);
      logMessage('Authenticating with Spotify and fetching playlist...');
      const resp = await axios.post('/api/analyze', {
        clientId,
        clientSecret,
        playlistId,
        apiKey,
      });
      setReport(resp.data.report);
      logMessage('Analysis complete.');
    } catch (err) {
      logMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Spotify Kurator</h1>
      <div className="space-y-4 bg-gray-800 p-4 rounded">
        <input
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="Spotify Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <input
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="Spotify Client Secret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
        />
        <input
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="Playlist ID"
          value={playlistId}
          onChange={(e) => setPlaylistId(e.target.value)}
        />
        <input
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="OpenAI API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={startAnalysis}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </div>
      <div className="bg-black text-green-400 font-mono whitespace-pre-wrap p-2 max-h-64 overflow-auto">
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {report && (
        <textarea
          readOnly
          value={report}
          className="w-full h-64 p-2 bg-gray-800 text-white rounded"
        />
      )}
    </div>
  );
}

export default SpotifyKurator;
