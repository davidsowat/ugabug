import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import ResultPage from "./ResultPage";
import LoginPage from "./LoginPage";
import './index.css';

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const SCOPE = import.meta.env.VITE_SCOPE;

function generateCodeVerifier() {
  const array = new Uint32Array(56 / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).slice(-2)).join("");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function CallbackHandler({ onTokenReceived }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getToken = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");
      const verifier = localStorage.getItem("verifier");

      if (!code || !verifier) return;

      try {
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
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        const token = response.data.access_token;
        localStorage.setItem("accessToken", token);
        onTokenReceived(token);
        navigate("/");
      } catch (err) {
        console.error("Token error", err);
      }
    };

    getToken();
  }, [location.search, onTokenReceived, navigate]);

  return <div className="text-white p-10">🔁 Loggar in med Spotify...</div>;
}

function MainPage({ accessToken, setAccessToken }) {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPlaylists(res.data.items);
    } catch (err) {
      console.error("Kunde inte hämta spellistor:", err);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedPlaylist) return;

    const genresInfo = [
      {
        genre: "Techno",
        personality: "Strukturerad & kreativ",
        funFact: "Techno skapades i Detroit på 80-talet!",
      },
      {
        genre: "Trance",
        personality: "Visionär dagdrömmare",
        funFact: "Trance har ofta BPM runt 138 — därav vår titel 😄",
      },
    ];

    const recommendedTracks = [
      "spotify:track:5uEYRdEIh9Bo4fpjDd4Na9",
      "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
    ];

    const playlistUri = selectedPlaylist.uri;

    navigate("/result", {
      state: {
        accessToken,
        playlistUri,
        genresInfo,
        recommendedTracks,
        userName: selectedPlaylist.owner.display_name || "Du",
      },
    });
  };

  const loginWithSpotify = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await sha256(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPE,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  return (
    <div className="bg-black text-white min-h-screen p-10 font-sans">
      <h1 className="text-3xl font-bold mb-4">🎧 Spotify Kurator</h1>

      {!accessToken ? (
        <button
          onClick={loginWithSpotify}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded"
        >
          Logga in med Spotify
        </button>
      ) : (
        <>
          <button
            onClick={fetchPlaylists}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded mb-4"
          >
            Hämta mina spellistor
          </button>

          {playlists.length > 0 && (
            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl mb-2">Välj en spellista</h2>
              <select
                onChange={(e) =>
                  setSelectedPlaylist(
                    playlists.find((p) => p.id === e.target.value)
                  )
                }
                className="text-black p-2 rounded w-full mb-4"
              >
                <option value="">-- Välj --</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleStartAnalysis}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded"
              >
                Starta analys
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken") || null
  );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              accessToken={accessToken}
              setAccessToken={setAccessToken}
            />
          }
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/callback"
          element={<CallbackHandler onTokenReceived={setAccessToken} />}
        />
        <Route
          path="/result"
          element={<ResultWrapper />}
        />
      </Routes>
    </Router>
  );
}

function ResultWrapper() {
  const location = useLocation();
  const {
    accessToken,
    playlistUri,
    genresInfo,
    recommendedTracks,
    userName,
  } = location.state || {};

  return (
    <ResultPage
      accessToken={accessToken}
      playlistUri={playlistUri}
      genresInfo={genresInfo}
      recommendedTracks={recommendedTracks}
      userName={userName}
    />
  );
}
