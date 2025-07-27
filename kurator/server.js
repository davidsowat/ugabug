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

// Minnessystem per användare
let userAnalysisData = {};

// Tar emot en batch, ber AI:n att sammanfatta den, och sparar sammanfattningen.
app.post("/batch", async (req, res) => {
  const { userId, batchNumber, totalBatches, tracks } = req.body;
  if (!userId) return res.status(400).json({ error: "Användar-ID saknas." });

  if (batchNumber === 1) {
    userAnalysisData[userId] = { summaries: [] };
    console.log(`Ny analys startad för användare: ${userId}`);
  }

  if (!userAnalysisData[userId]) {
    return res.status(400).json({ message: `Ingen aktiv session för ${userId}.` });
  }

  console.log(`Användare ${userId}: Sammanfattar batch ${batchNumber}/${totalBatches}...`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: "Du är en dataanalytiker. Sammanfatta de viktigaste musikaliska dragen i denna låt-batch med nyckelord. Fokusera på genre (enligt Beatport-stil), stämning och artister. Svara kortfattat på svenska." },
        { role: 'user', content: JSON.stringify(tracks) }
      ],
    });
    const summary = response.choices[0].message.content;
    userAnalysisData[userId].summaries.push(summary);
    console.log(`Användare ${userId}: Sammanfattning för batch ${batchNumber} klar.`);
    res.status(200).json({ message: `Batch ${batchNumber} analyserad.` });
  } catch (error) {
    console.error(`🔴 Fel vid analys av batch ${batchNumber} för ${userId}:`, error);
    res.status(500).json({ error: `Kunde inte analysera batch ${batchNumber}.` });
  }
});

// Startar den slutgiltiga analysen
app.post("/analyze", async (req, res) => {
  const { userId, criteria } = req.body;
  if (!userId || !userAnalysisData[userId] || userAnalysisData[userId].summaries.length === 0) {
    return res.status(400).json({ error: "Inga sammanfattningar att analysera." });
  }

  const summaries = userAnalysisData[userId].summaries;
  const requestedLength = criteria.length || 60;
  const trackCount = Math.ceil(requestedLength / 3.5);

  const systemPrompt = `
    Du är en svensktalande musikterapeut och DJ. Ditt svar MÅSTE vara ett giltigt JSON-objekt.
    Ditt jobb har TVÅ delar:
    1.  **ANALYS:** Baserat på sammanfattningarna av HELA användarens spellista, skriv en djuplodande psykoanalys, identifiera dominerande genrer och inkludera rolig fakta om dem.
    2.  **REKOMMENDATIONER:** Baserat på användarens specifika önskemål, ge nya låtrekommendationer.

    JSON-struktur:
    {
      "personalityAnalysis": "En djuplodande psykoanalys (på svenska) baserad på HELA spellistan.",
      "dominantGenres": ["En array med de 3 mest framträdande sub-genrerna från HELA spellistan."],
      "funFacts": "En intressant 'visste du att...'-fakta (på svenska) för varje genre i dominantGenres.",
      "matchingReasoning": "En DETALJERAD motivering (på svenska) för dina låtval.",
      "songRecommendations": ["En array med nya, högkvalitativa låtrekommendationer i formatet 'Artist - Låttitel'."]
    }
  `;

  const userPrompt = `
    Här är sammanfattningarna från hela spellistan: ${summaries.join("\n---\n")}.
    
    DEL 1: ANALYS
    Gör en holistisk analys av hela denna musiksamling.

    DEL 2: REKOMMENDATIONER
    Användarens specifika önskemål för de nya låtarna är:
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
    console.error(`🔴 Fel vid slutgiltig analys för ${userId}:`, error);
    res.status(500).json({ error: 'Något gick fel med den slutgiltiga analysen.' });
  }
});

const PORT = process.env.VITE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server körs på http://localhost:${PORT}`);
});