import React from "react";
import "./LoginPage.css";
import spotifyLogo from "./Spotify_Primary_Logo_RGB_White.png";

// === PKCE helpers ===
const generateRandomString = (length) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (x) => possible[x % possible.length]).join("");
};
const sha256 = async (plain) => {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
};
const base64url = (arrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

export default function LoginPage() {
  const handleLoginClick = async () => {
    try {
      const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID; // ← viktig!
      if (!CLIENT_ID) {
        alert("Saknar VITE_SPOTIFY_CLIENT_ID. Sätt den i .env/Pages settings.");
        return;
      }
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        alert("Spotify kräver https i produktion. Öppna sajten via https://");
        return;
      }

      // PKCE
      const verifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", verifier);
      const challenge = base64url(await sha256(verifier));

      const redirectUri = `${window.location.origin}/callback`;
      const scope = [
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-read-private",
        "playlist-modify-private",
        "playlist-modify-public",
      ].join(" ");

      const params = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        scope,
        code_challenge_method: "S256",
        code_challenge: challenge,
        redirect_uri: redirectUri,
      });

      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (e) {
      console.error(e);
      alert("Kunde inte starta inloggning: " + (e?.message || e));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={spotifyLogo} alt="Spotify Logo" className="logo" />
        <h2>Välkommen till Spotify Kurator</h2>
        <button onClick={handleLoginClick} className="spotify-button">
          <img src={spotifyLogo} alt="Spotify" className="spotify-icon" />
          Logga in med Spotify
        </button>
      </div>
    </div>
  );
}
