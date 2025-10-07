/**
 * Cloudflare Worker – Spotify Kurator (Full AI)
 * Endpoints:
 *   GET  /           – health
 *   POST /analyze    – { token, playlistId, criteria, createNew?, llmLimit? }
 *   POST /batch      – legacy stub
 *
 * Secrets (wrangler):
 *   wrangler secret put OPENAI_API_KEY
 */

//////////////////////// CORS & Origin policy ////////////////////////

const ALLOWED_ORIGINS = new Set([
  "https://trackcurator.org",      // rootdomänen = frontend
  "https://kurator-ui.pages.dev"   // Pages preview
]);

function corsHeaders(origin) {
  const allow =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://trackcurator.org";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization"
  };
}

function json(data, status = 200, origin = null, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      ...extra
    }
  });
}

function forbid(origin) { return json({ error: "Forbidden origin" }, 403, origin); }

//////////////////////////// Helpers /////////////////////////////////

const uniq = (a) => [...new Set(a)];

async function spotifyGET(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Spotify GET ${r.status}: ${await r.text()}`);
  return r.json();
}

async function spotifyPOST(url, token, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Spotify POST ${r.status}: ${await r.text()}`);
  return r.json();
}

async function fetchAllPlaylistTracks(token, playlistId, total) {
  const out = [];
  for (let offset = 0; offset < total; offset += 100) {
    const page = await spotifyGET(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}` +
      `&fields=items(track(id,uri,name,duration_ms,album(release_date),artists(id,name)))`,
      token
    );
    out.push(...(page.items || []));
  }
  return out;
}

async function fetchAudioFeatures(token, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 100) {
    const r = await spotifyGET(
      `https://api.spotify.com/v1/audio-features?ids=${ids.slice(i, i + 100).join(",")}`,
      token
    );
    out.push(...(r.audio_features || []).filter(Boolean));
  }
  return out;
}

async function fetchArtistsGenres(token, artistIds) {
  const out = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    const r = await spotifyGET(
      `https://api.spotify.com/v1/artists?ids=${artistIds.slice(i, i + 50).join(",")}`,
      token
    );
    out.push(...(r.artists || []));
  }
  return out;
}

function preliminaryFilter(list, criteria = {}) {
  const wantGenres = (criteria.genre || "").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const wantMoods  = (criteria.mood  || "").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const tempoRange = (criteria.bpmRange || "").split("-").map(x=>parseInt(x,10)).filter(x=>!Number.isNaN(x));
  const minMs = (parseInt(criteria.length || "0",10) || 0) * 60_000;

  const inTempo = x => tempoRange.length===2 ? (x.bpm!=null && x.bpm>=tempoRange[0] && x.bpm<=tempoRange[1]) : true;
  const genreHit = x => !wantGenres.length || wantGenres.some(g => (x.genres||[]).some(gg => gg.toLowerCase().includes(g)));
  const moodHit = x => {
    if (!wantMoods.length) return true;
    const m = {
      glad: x.valence>0.6,
      energisk: x.energy>0.6,
      fokus: x.energy<0.5 && x.valence<0.6,
      avslappnad: x.energy<0.4,
      ledsen: x.valence<0.3,
      romantisk: x.valence>0.6 && x.acousticness>0.3,
      träning: x.energy>0.7 && x.danceability>0.6,
      fest: x.danceability>0.7,
      mysig: x.acousticness>0.4,
      dramatisk: x.instrumentalness>0.3 || x.mode===0,
      melankolisk: x.valence<0.4,
      hoppfull: x.valence>0.6 && x.energy>0.5
    };
    return wantMoods.some(k => m[k]);
  };

  let filtered = list.filter(x => inTempo(x) && genreHit(x) && moodHit(x));

  if (minMs>0) {
    filtered.sort((a,b)=>((b.danceability||0)+(b.energy||0))-((a.danceability||0)+(a.energy||0)));
    let sum=0, take=[]; for (const t of filtered) { if (sum>=minMs) break; sum+=t.duration_ms||0; take.push(t); }
    filtered = take;
  }

  if (filtered.length<10) filtered = list.slice(0,100);
  return filtered;
}

async function openAICurateAndExplain(apiKey, payload) {
  const sys =
    `Du är en musikkurator. Välj 30–60 låtar ENDAST från "candidates" (track IDs). ` +
    `Ordna dramaturgiskt (start→höjd→landning), skriv "playlist_title" (<=90), ` +
    `"playlist_description" (<=300) och 4–5 trivia-kort. ` +
    `Svara ENDAST med JSON: {"playlist_title":"","playlist_description":"","curated_tracks":["id",...],"summary":"","cards":[{"title":"","emoji":"","body":"","why_it_matters":""}]}. ` +
    `Skriv på svenska.`;

  const user =
    `KRITERIER:\n${JSON.stringify(payload.criteria, null, 2)}\n\nKANDIDATER:\n` +
    JSON.stringify(payload.candidates.map(c => ({
      id:c.id, name:c.name, artists:c.artists, year:c.year,
      bpm:c.bpm, energy:c.energy, danceability:c.danceability, valence:c.valence,
      genres:c.genres.slice(0,3), duration_ms:c.duration_ms
    })), null, 2) +
    `\nSpellista: ${payload.playlistName} (ägare: ${payload.owner||"okänd"})`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ Authorization:`Bearer ${apiKey}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"gpt-4o-mini",
      response_format:{ type:"json_object" },
      temperature:0.4,
      messages:[{ role:"system", content:sys }, { role:"user", content:user }]
    })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  try { return JSON.parse(data.choices[0].message.content); }
  catch { return { playlist_title:null, playlist_description:null, curated_tracks:[], summary:"", cards:[] }; }
}

/////////////////////////// Worker entry /////////////////////////////

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || null;

    // CORS preflight
    if (request.method === "OPTIONS") return new Response("", { headers: corsHeaders(origin) });

    // Origin guard
    if (origin && !ALLOWED_ORIGINS.has(origin)) return forbid(origin);

    const url = new URL(request.url);

    // Health
    if (url.pathname === "/" && request.method === "GET") {
      return json({ ok:true, service:"kurator-backend", time:new Date().toISOString() }, 200, origin);
    }

    // ---- FULL AI: POST /analyze ----
    if (url.pathname === "/analyze" && request.method === "POST") {
      try {
        const { token, playlistId, criteria, createNew = true, llmLimit = 300 } = await request.json();
        if (!token || !playlistId) return json({ error:"Missing token or playlistId" }, 400, origin);

        // 1) Meta
        const meta = await spotifyGET(
          `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,owner(display_name),tracks.total`,
          token
        );
        const total = meta?.tracks?.total ?? 0;

        // 2) Tracks + features + genres
        const items   = await fetchAllPlaylistTracks(token, playlistId, total);
        const tracks  = items.map(i=>i.track).filter(Boolean);
        const ids     = tracks.map(t=>t.id).filter(Boolean);
        const feats   = await fetchAudioFeatures(token, ids);
        const fMap    = new Map(feats.map(f=>[f.id,f]));
        const artistIds = uniq(tracks.flatMap(t => (t.artists||[]).map(a=>a.id))).filter(Boolean);
        const artists = await fetchArtistsGenres(token, artistIds.slice(0,300));
        const aGenres = new Map(artists.map(a => [a.id, a.genres||[]]));

        const all = tracks.map(t=>{
          const feat = fMap.get(t.id);
          const genres = uniq((t.artists||[]).flatMap(a => aGenres.get(a.id)||[])).slice(0,6);
          return {
            id:t.id, uri:t.uri, name:t.name,
            artists:(t.artists||[]).map(a=>a.name).join(", "),
            duration_ms:t.duration_ms, year:(t.album?.release_date||"").slice(0,4),
            bpm: feat?.tempo ?? null, energy: feat?.energy ?? null,
            danceability: feat?.danceability ?? null, valence: feat?.valence ?? null,
            acousticness: feat?.acousticness ?? null, instrumentalness: feat?.instrumentalness ?? null,
            mode: feat?.mode ?? null, genres
          };
        });

        // 3) Kandidater + LLM-kurering
        const prelim    = preliminaryFilter(all, criteria || {});
        const candidates= prelim.slice(0, Math.max(50, Math.min(llmLimit, 400)));
        const llm       = await openAICurateAndExplain(env.OPENAI_API_KEY, {
          playlistName: meta.name, owner: meta.owner?.display_name, criteria: criteria || {}, candidates
        });

        const candSet   = new Set(candidates.map(c=>c.id));
        const curatedIds= (llm.curated_tracks||[]).filter(id => candSet.has(id));
        const curated   = curatedIds.map(id => candidates.find(c=>c.id===id)).filter(Boolean); // behåll ordning

        // 4) Skapa spellista i Spotify (om så önskas)
        let newPlaylist = null;
        if (createNew) {
          const me    = await spotifyGET("https://api.spotify.com/v1/me", token);
          const title = (llm.playlist_title || `Kurator • ${meta.name}`).slice(0,90);
          const desc  = (llm.playlist_description || `Auto-genererad från ${meta.name}`).slice(0,300);
          newPlaylist = await spotifyPOST(`https://api.spotify.com/v1/users/${me.id}/playlists`, token, {
            name:title, description:desc, public:false
          });
          const uris = curated.map(c=>c.uri).slice(0,500);
          for (let i=0; i<uris.length; i+=100) {
            await spotifyPOST(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, token, { uris: uris.slice(i,i+100) });
          }
        }

        return json({
          ok:true,
          playlistMeta:{ name:meta.name, owner:meta.owner?.display_name, total },
          mode:"full_ai",
          counts:{ original: all.length, candidates: candidates.length, curated: curated.length },
          llm_title: llm.playlist_title || null,
          llm_description: llm.playlist_description || null,
          analysis:{ summary: llm.summary || "", cards: llm.cards || [] },
          curated, curated_ids: curatedIds,
          newPlaylist
        }, 200, origin);

      } catch (_err) {
        // Medvetet generiskt fel (läcker ej hemligheter)
        return json({ error:"Analyze failed" }, 500, origin);
      }
    }

    // Legacy stub
    if (url.pathname === "/batch" && request.method === "POST") {
      return json({ ok:true, note:"/batch ej nödvändig i full AI-läget" }, 200, origin);
    }

    return json({ error:"Not found" }, 404, origin);
  }
};
