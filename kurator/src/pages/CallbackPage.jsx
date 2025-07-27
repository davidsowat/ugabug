import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

const CallbackPage = ({ onTokenReceived }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getToken = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");
      const verifier = localStorage.getItem("verifier");
      if (!code || !verifier) return;

      try {
        const data = new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        });
        const response = await axios.post("https://accounts.spotify.com/api/token", data.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
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
};

export default CallbackPage;