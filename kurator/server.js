import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/token", async (req, res) => {
  const { code, verifier, clientId, redirectUri } = req.body;

  const data = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });

  try {
    const tokenRes = await axios.post("https://accounts.spotify.com/api/token", data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.json(tokenRes.data); // innehåller access_token, refresh_token m.m.
  } catch (err) {
    console.error("Token exchange error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get token" });
  }
});

const PORT = process.env.VITE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server körs på http://localhost:${PORT}`);
});
