import "./styles/LoginPage.css";
import spotifyLogo from "./assets/Spotify_Primary_Logo_RGB_White.png";

const genRand = (len) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};
const sha256 = async (text) => {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data);
};
const b64url = (ab) =>
  btoa(String.fromCharCode(...new Uint8Array(ab)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export default function LoginPage() {
  const handleLogin = async () => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!CLIENT_ID) return alert("Saknar VITE_SPOTIFY_CLIENT_ID");

    const verifier = genRand(64);
    localStorage.setItem("spotify_code_verifier", verifier);
    const challenge = b64url(await sha256(verifier));

    const redirectUri = `${location.origin}/callback`;
    const scope = [
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-read-private",
      "playlist-modify-private",
      "playlist-modify-public",
    ].join(" ");

    const qs = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope,
      code_challenge_method: "S256",
      code_challenge: challenge,
      redirect_uri: redirectUri,
    });
    location.href = `https://accounts.spotify.com/authorize?${qs.toString()}`;
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={spotifyLogo} className="logo" alt="Spotify" />
        <h2>Välkommen till Spotify Kurator</h2>
        <button className="spotify-button" onClick={handleLogin}>
          <img src={spotifyLogo} className="spotify-icon" alt="" /> Logga in med Spotify
        </button>
      </div>
    </div>
  );
}
