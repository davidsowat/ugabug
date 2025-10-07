import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Loggar in…");

  useEffect(() => {
    (async () => {
      try {
        const code = new URL(location.href).searchParams.get("code");
        if (!code) throw new Error("Ingen code i callback");
        const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const verifier = localStorage.getItem("spotify_code_verifier");
        if (!CLIENT_ID || !verifier) throw new Error("Saknar PKCE/Client ID");

        const body = new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${location.origin}/callback`,
          code_verifier: verifier,
        });

        const r = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!r.ok) throw new Error(`Token-fel ${r.status}: ${await r.text()}`);
        const j = await r.json();

        sessionStorage.setItem("spotify_access_token", j.access_token);
        location.replace("/app");
      } catch (e) {
        setMsg(`Fel: ${e.message || e}`);
      }
    })();
  }, []);

  return <div style={{ color: "#eee", padding: 24 }}>{msg}</div>;
}
