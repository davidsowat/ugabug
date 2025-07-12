import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { clientId, clientSecret, playlistId, apiKey } = req.body;
  if (!clientId || !clientSecret || !playlistId || !apiKey) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    const tokenResp = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
      }
    );
    const token = tokenResp.data.access_token;

    const tracksResp = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const names = tracksResp.data.tracks.items.map((i) => i.track.name).slice(0, 30);

    const prompt = `Here are some songs from a playlist:\n${names.join('\n')}\n\nSuggest a few additional songs that would fit well.`;

    const aiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a music curator.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    res.json({ report: aiResp.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, 'dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
