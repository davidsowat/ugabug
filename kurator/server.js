import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let userAnalysisData = {};

app.post("/batch", async (req, res) => {
  const { userId, batchNumber, tracks } = req.body;
  if (!userId) return res.status(400).json({ error: "Användar-ID saknas." });
  if (batchNumber === 1) userAnalysisData[userId] = { summaries: [] };
  if (!userAnalysisData[userId]) return res.status(400).json({ message: `Ingen aktiv session för ${userId}.` });
  
  console.log(`Användare ${userId}: Sammanfattar batch ${batchNumber}...`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: "Sammanfatta de viktigaste musikaliska dragen i denna låt-batch med nyckelord (genre, stämning, artister). Svara kortfattat på svenska." },
        { role: 'user', content: JSON.stringify(tracks) }
      ],
    });
    userAnalysisData[userId].summaries.push(response.choices[0].message.content);
    res.status(200).json({ message: `Batch ${batchNumber} analyserad.` });
  } catch (error) {
    res.status(500).json({ error: `Kunde inte analysera batch ${batchNumber}.` });
  }
});

app.post("/analyze", async (req, res) => {
  const { userId, criteria } = req.body;
  if (!userId || !userAnalysisData[userId] || userAnalysisData[userId].summaries.length === 0) {
    return res.status(400).json({ error: "Inga sammanfattningar att analysera." });
  }

  const summaries = userAnalysisData[userId].summaries;
  const requestedLength = criteria.length || 60;
  const trackCount = Math.ceil(requestedLength / 3.5);

  const systemPrompt = `
    Du är en svensk musikterapeut. Ditt svar MÅSTE vara ett giltigt JSON-objekt.
    ANALYS: Baserat på sammanfattningarna av HELA spellistan, skriv en djuplodande psykoanalys.
    REKOMMENDATIONER: Baserat på användarens specifika önskemål, ge nya låtrekommendationer.
    JSON-struktur: {
      "personalityAnalysis": "...",
      "dominantGenres": ["..."],
      "funFacts": "...",
      "matchingReasoning": "...",
      "songRecommendations": ["..."]
    }
  `;

  const userPrompt = `
    Här är sammanfattningarna från hela spellistan: ${summaries.join("\n---\n")}.
    ANALYS: Gör en holistisk analys.
    REKOMMENDATIONER: Användarens önskemål är:
    - Genre: ${criteria.genre || 'valfri'}
    - Stämning: ${criteria.mood || 'valfri'}
    - Beskrivning: ${criteria.description || 'ingen specifik'}
    - Tempo: ${criteria.bpmRange || 'valfritt'} BPM
    - Minsta längd: ${requestedLength} minuter. Generera ungefär ${trackCount} låtar för att uppnå detta.
    Rekommendera ENDAST ny musik. Svara på svenska.
  `;

  try {
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      response_format: { type: 'json_object' },
    });
    
    const parsedResponse = JSON.parse(finalResponse.choices[0].message.content);
    delete userAnalysisData[userId];
    res.json(parsedResponse);
  } catch (error) {
    delete userAnalysisData[userId];
    res.status(500).json({ error: 'Något gick fel med den slutgiltiga analysen.' });
  }
});

const PORT = process.env.VITE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server körs på https://trackcurator.org:${PORT}`);
});