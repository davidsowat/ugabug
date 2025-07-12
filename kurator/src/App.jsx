import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import axios from "axios";

// Miljövariabler
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const SCOPE = import.meta.env.VITE_SCOPE;

// Skapa verifier för PKCE
function generateCodeVerifier() {
  const array = new Uint32Array(56 / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).slice(-2)).join("");
}

// Skapa SHA-256 challenge
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Hanterar callback från Spotify
function CallbackHandler({ onTokenReceived }) {
  const location = useLocation();
  const [log, setLog] = useState([]);
  const logMessage = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    const getToken = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");
      const verifier = localStorage.getItem("verifier");

      if (!code || !verifier) {
        logMessage("⚠️ Saknar verifier eller kod");
        return;
      }

      try {
        logMessage("🔑 Begär token från Spotify...");

        const data = new URLSearchParams();
        data.append("client_id", CLIENT_ID);
        data.append("grant_type", "authorization_code");
        data.append("code", code);
        data.append("redirect_uri", REDIRECT_URI);
        data.append("code_verifier", verifier);

        const response = await axios.post(
          "https://accounts.spotify.com/api/token",
          data.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const token = response.data.access_token;
        localStorage.setItem("accessToken", token);
        logMessage("✅ Inloggning lyckades!");
        onTokenReceived(token);
      } catch (err) {
        logMessage("❌ Fel vid token-begäran: " + err.message);
      } finally {
        window.location.href = "/";
      }
    };

    getToken();
  }, [location.search]);

  return (
    <div className="text-white p-10">
      <h1>🔁 Bearbetar inloggning...</h1>
      <div className="text-sm mt-4">
        {log.map((entry, idx) => (
          <div key={idx}>{entry}</div>
        ))}
      </div>
    </div>
  );
}

// Förstasidan där användaren loggar in och ser spellistor
function MainPage({ accessToken, playlists, fetchPlaylists }) {
  const [clientId, setClientId] = useState(CLIENT_ID || "");
  const [apiKey, setApiKey] = useState("");
  const [log, setLog] = useState([]);

  const logMessage = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const redirectToSpotifyAuth = async () => {
    if (!clientId || !REDIRECT_URI || !SCOPE) {
      logMessage("❌ Miljövariabler saknas. Kontrollera .env!");
      return;
    }

    const verifier = generateCodeVerifier();
    const challenge = await sha256(verifier);

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

// Huvudkomponenten
export default function App() {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken") || null
  );
  const [playlists, setPlaylists] = useState([]);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setPlaylists(res.data.items);
    } catch (err) {
      console.error("Fel vid hämtning av spellistor", err.message);
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              accessToken={accessToken}
              playlists={playlists}
              fetchPlaylists={fetchPlaylists}
            />
          }
        />
        <Route
          path="/callback"
          element={<CallbackHandler onTokenReceived={setAccessToken} />}
        />
      </Routes>
    </Router>
  );
}
