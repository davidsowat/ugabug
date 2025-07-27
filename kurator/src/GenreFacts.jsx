import React from 'react';
import './styles/GenreFacts.css';

const funFacts = {
  techno: {
    description: 'Techno är exakt, repetitivt och ofta djupt hypnotiskt.',
    personality: 'INTJ – Strategen: logisk, målinriktad, gillar struktur.',
  },
  psytrance: {
    description: 'Psytrance tar dig med på en psykedelisk resa fylld av lager och energi.',
    personality: 'INFP – Idealisten: nyfiken, öppen för inre resor och idéer.',
  },
  edm: {
    description: 'EDM samlar många elektroniska stilar i energiska rytmer.',
    personality: 'ESFP – Underhållaren: spontan, älskar fest och dans.',
  },
  // Lägg till fler efter behov
};

const GenreFacts = ({ genre }) => {
  const fact = funFacts[genre.toLowerCase()] || {
    description: 'Denna genre är unik och spännande!',
    personality: '🎭 Okänd typ – men du är en pionjär!',
  };

  return (
    <div className="genre-facts">
      <p><strong>Beskrivning:</strong> {fact.description}</p>
      <p><strong>Personlighetstyp:</strong> {fact.personality}</p>
    </div>
  );
};

export default GenreFacts;
