// LoginPage.jsx
import React from "react";
import "./LoginPage.css";
import spotifyLogo from "./Spotify_Primary_Logo_RGB_White.png";

export default function LoginPage() {
  const handleLoginClick = () => {
    window.location.href = "/";
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={spotifyLogo} alt="Spotify Logo" className="logo" />
        <h2 className="text-white text-xl font-semibold mb-4">Välkommen till Spotify Kurator</h2>
        <button
          onClick={handleLoginClick}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Gå vidare till inloggning
        </button>
      </div>
    </div>
  );
}
