import React from "react";
import "./LoginPage.css"; // Se till att den här raden finns och är korrekt
import spotifyLogo from "./Spotify_Primary_Logo_RGB_White.png";

// PKCE-hjälpfunktioner för inloggning
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};
const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export default function LoginPage() {
  const handleLoginClick = async () => {
    const codeVerifier = generateRandomString(64);
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const clientId = import.meta.env.VITE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/callback`;
    const scope = 'playlist-read-private playlist-read-collaborative user-read-private playlist-modify-private playlist-modify-public';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
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