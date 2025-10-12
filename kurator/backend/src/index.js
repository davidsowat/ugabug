export default {
  async fetch(request, env) {
    // --- CORS ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, "");

    // --- ROUTING ---
    let targetUrl;
    let headers = { "Content-Type": "application/json" };
    const body = await request.text();

    if (path.startsWith("openai")) {
      targetUrl = `https://api.openai.com/v1/${path.replace("openai/", "")}`;
      headers.Authorization = `Bearer ${env.OPENAI_API_KEY}`;
    } else if (path.startsWith("spotify")) {
      targetUrl = `https://api.spotify.com/v1/${path.replace("spotify/", "")}`;
      headers.Authorization = `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`;
    } else {
      return new Response("Invalid endpoint", { status: 404 });
    }

    // --- FORWARD REQUEST ---
    const res = await fetch(targetUrl, { method: "POST", headers, body });
    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  },
};
