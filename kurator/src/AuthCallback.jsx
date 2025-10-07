import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const code = new URL(location.href).searchParams.get("code");
        if (!code) throw new Error("Ingen code i callback.");

        const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        if (!CLIENT_ID) throw new Error("Saknar VITE_SPOTIFY_CLIENT_ID.");

        const verifier = localStorage.getItem("spotify_code_verifier");
        if (!verifier) throw new Error("Saknar PKCE verifier.");

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

        const data = await r.json();
        sessionStorage.setItem("spotify_access_token", data.access_token);
        // (valfritt) spara refresh_token i localStorage om du vill bygga refresh senare

        location.replace("/app");
      } catch (e) {
        console.error(e);
        setErr(e.message || "Callback misslyckades.");
      }
    })();
  }, []);

  return (
    <div style={{ color: "#eee", padding: 24 }}>
      {err ? <p>Fel: {err}</p> : <p>Loggar in…</p>}
    </div>
  );
}
