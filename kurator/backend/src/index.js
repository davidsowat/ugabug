export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });

    if (url.pathname === "/analyze" && req.method === "POST") {
      try {
        const body = await req.json(); // { token, playlistId, criteria, createNew, llmLimit }

        const tracks = await getPlaylistTracks(body.token, body.playlistId);
        const analysis = await analyzeWithOpenAI(env, tracks, body.criteria, body.llmLimit || 300);

        let newPlaylist = null;
        if (body.createNew) {
          newPlaylist = await createPlaylistAndAdd(
            body.token,
            analysis.suggestions.map(s => s.uri),
            analysis.title || "Kuraterad spellista",
            analysis.description || "Skapad av TrackCurator"
          );
        }

        return json({ ok: true, analysis, newPlaylist }, 200, cors(req));
      } catch (e) {
        return json({ ok: false, error: e.message || "Analyze failed" }, 500, cors(req));
      }
    }

    if (url.pathname === "/batch" && req.method === "POST") {
      return json({ ok: true, storedChunks: 1 }, 200, cors(req)); // no-op
    }

    return json({ ok: false, error: "Not found" }, 404, cors(req));
  }
};

const ALLOWED = new Set([
  "https://trackcurator.org",
  "https://kurator-ui.pages.dev"
]);

function cors(req) {
  const o = req.headers.get("Origin");
  const allow = ALLOWED.has(o) ? o : "";
  return {
    "Access-Control-Allow-Origin": allow || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

// ------- Spotify & OpenAI helpers (enkel version) -------
async function getPlaylistTracks(accessToken, playlistId) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  const out = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) throw new Error(`Spotify tracks ${r.status}`);
    const j = await r.json();
    for (const it of j.items || []) {
      const tr = it.track;
      if (tr) out.push({ id: tr.id, uri: tr.uri, name: tr.name,
        artists: tr.artists?.map(a => a.name).join(", "),
        duration_ms: tr.duration_ms });
    }
    url = j.next;
  }
  return out;
}

async function analyzeWithOpenAI(env, tracks, criteria, llmLimit) {
  const sys = `Du är en spellistekurator. Returnera JSON med:
  title, description, cards[ {title,emoji,body,why_it_matters} ], suggestions[ {uri} ]`;

  const user = { criteria, sample: tracks.slice(0, 80).map(t => ({ name: t.name, artists: t.artists })) };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify(user) }
      ]
    })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content || "{}";
  const out = JSON.parse(content);
  return {
    title: out.title || "Kuraterad spellista",
    description: out.description || "",
    cards: out.cards || [],
    suggestions: (out.suggestions || []).map(s => (typeof s === "string" ? { uri: s } : s)).slice(0, llmLimit)
  };
}

async function createPlaylistAndAdd(accessToken, uris, title, description) {
  const meR = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!meR.ok) throw new Error(`Spotify me ${meR.status}`);
  const me = await meR.json();

  const createR = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: title, description, public: false })
  });
  if (!createR.ok) throw new Error(`Spotify create ${createR.status}`);
  const playlist = await createR.json();

  for (let i = 0; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100);
    const addR = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: chunk })
    });
    if (!addR.ok) throw new Error(`Spotify add ${addR.status}`);
  }
  return playlist;
}
