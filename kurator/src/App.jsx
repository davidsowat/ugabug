import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const SCOPE = import.meta.env.VITE_SCOPE;

function App() {
  const [clientId, setClientId] = useState(CLIENT_ID || "");
  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [log, setLog] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const logMessage = (msg) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const generateCodeVerifier = () => {
    const array = new Uint32Array(56 / 2);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join("");
  };

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const redirectToSpotifyAuth = async () => {
    if (!clientId || !REDIRECT_URI || !SCOPE) {
      logMessage("❌ Miljövariabler saknas. Kontrollera .env!");
      console.error({ clientId, REDIRECT_URI, SCOPE });
      return;
    }

    logMessage("🔑 Förbereder Spotify-inloggning...");
    const verifier = generateCodeVerifier();
    const challenge = await sha256(verifier);

    // För felsökning
    console.log("clientId:", clientId);
    console.log("redirect_uri:", REDIRECT_URI);
    console.log("code_challenge:", challenge);

    localStorage.setItem("verifier", verifier);
    localStorage.setItem("spotifyClientId", clientId);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: SCOPE,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.location = authUrl;
  };

  const getTokenFromCode = useCallback(
    async (code) => {
      const verifier = localStorage.getItem("verifier");
      try {
        const res = await axios.post("/api/token", {
          code,
          verifier,
          clientId,
          redirectUri: REDIRECT_URI,
        });
        return res.data.access_token;
      } catch (err) {
        logMessage("⚠️ Fel vid hämtning av token: " + err.message);
        return null;
      }
    },
    [clientId]
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && clientId) {
      logMessage("📬 Kod mottagen från Spotify, hämtar token...");
      getTokenFromCode(code).then((token) => {
        if (token) {
          setAccessToken(token);
          logMessage("✅ Inloggning lyckades!");
        } else {
          localStorage.clear();
        }
      });
    }
  }, [clientId, getTokenFromCode]);

  const fetchPlaylists = async () => {
    if (!accessToken) return;
    try {
      logMessage("🎧 Hämtar spellistor...");
      const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      logMessage(`🎵 Antal spellistor: ${res.data.items.length}`);
      setPlaylists(res.data.items);
    } catch (err) {
      logMessage("⚠️ Fel vid hämtning av spellistor: " + err.message);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-10 font-sans">
      <h1 className="text-3xl font-bold mb-4">Spotify Kurator</h1>

      <div className="space-y-2 mb-4">
        <input
          className="p-2 w-full bg-gray-800 border border-gray-600 rounded"
          placeholder="Spotify Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <input
          type="password"
          className="p-2 w-full bg-gray-800 border border-gray-600 rounded"
          placeholder="OpenAI API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          onClick={redirectToSpotifyAuth}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          Logga in med Spotify
        </button>
        {accessToken && (
          <button
            onClick={fetchPlaylists}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Hämta spellistor
          </button>
        )}
      </div>

      <div className="bg-gray-900 p-4 rounded h-64 overflow-y-scroll mb-4 text-sm">
        {log.map((entry, idx) => (
          <div key={idx}>{entry}</div>
        ))}
      </div>

      {playlists.length > 0 && (
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Dina spellistor</h2>
          <ul className="list-disc pl-6">
            {playlists.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
