import React, { useState } from 'react';
import './CriteriaSelection.css';

const genreOptions = ["Pop", "Rock", "Hip Hop", "RnB", "Elektroniskt", "Indie", "House", "Techno", "Soul", "Funk", "Jazz", "Metal", "Punk", "Ambient", "Country", "Folk", "Klassiskt", "Reggae"];
const moodOptions = ["Glad", "Energisk", "Fokus", "Avslappnad", "Ledsen", "Romantisk", "Träning", "Fest", "Mysig", "Dramatisk", "Melankolisk", "Hoppfull"];
const descriptionOptions = ["Roadtrip", "Sena nätter", "Sommarkväll", "Plugga", "Middag med vänner", "Före festen", "Efterfesten", "Städa", "Solnedgång", "Regnig dag"];

const CriteriaSelection = ({ playlist, onConfirm }) => {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);
  const [bpmMin, setBpmMin] = useState(100);
  const [bpmMax, setBpmMax] = useState(140);
  const [duration, setDuration] = useState(60);
  const [isGenreActive, setIsGenreActive] = useState(false);
  const [isMoodActive, setIsMoodActive] = useState(false);
  const [isDescriptionActive, setIsDescriptionActive] = useState(false);
  const [isTempoActive, setIsTempoActive] = useState(false);
  const [isDurationActive, setIsDurationActive] = useState(false);

  const handleMultiSelect = (option, list, setter) => {
    setter(prevList => prevList.includes(option) ? prevList.filter(item => item !== option) : [...prevList, option]);
  };

  const activateSection = (setter) => setter(true);

  const handleConfirm = () => {
    const criteria = {
      genre: isGenreActive ? selectedGenres.join(', ') : '',
      mood: isMoodActive ? selectedMoods.join(', ') : '',
      description: isDescriptionActive ? selectedDescriptions.join(', ') : '',
      bpmRange: isTempoActive ? `${bpmMin}-${bpmMax}` : '',
      length: isDurationActive ? duration : '',
    };
    onConfirm(criteria, playlist); 
  };

  return (
    <div className="criteria-view-container">
      <div className="criteria-header">
        <h2>Sätt dina kriterier</h2>
        <p>Klicka på en sektion för att aktivera den.</p>
      </div>
      <div className="criteria-form">
        <div className={`form-group ${!isGenreActive ? 'disabled' : ''}`} onClick={() => !isGenreActive && activateSection(setIsGenreActive)}>
          <div className="form-group-header">
            <input type="checkbox" id="genre-check" checked={isGenreActive} onChange={() => setIsGenreActive(!isGenreActive)} />
            <label htmlFor="genre-check">Önskad genre</label>
          </div>
          <div className="button-grid">
            {genreOptions.map(genre => (<button key={genre} className={`option-button ${selectedGenres.includes(genre) ? 'selected' : ''}`} onClick={() => handleMultiSelect(genre, selectedGenres, setSelectedGenres)} disabled={!isGenreActive}>{genre}</button>))}
          </div>
        </div>
        <div className={`form-group ${!isMoodActive ? 'disabled' : ''}`} onClick={() => !isMoodActive && activateSection(setIsMoodActive)}>
           <div className="form-group-header">
            <input type="checkbox" id="mood-check" checked={isMoodActive} onChange={() => setIsMoodActive(!isMoodActive)} />
            <label htmlFor="mood-check">Önskad stämning</label>
          </div>
          <div className="button-grid">
            {moodOptions.map(mood => (<button key={mood} className={`option-button ${selectedMoods.includes(mood) ? 'selected' : ''}`} onClick={() => handleMultiSelect(mood, selectedMoods, setSelectedMoods)} disabled={!isMoodActive}>{mood}</button>))}
          </div>
        </div>
        <div className={`form-group full-width ${!isDescriptionActive ? 'disabled' : ''}`} onClick={() => !isDescriptionActive && activateSection(setIsDescriptionActive)}>
          <div className="form-group-header">
            <input type="checkbox" id="desc-check" checked={isDescriptionActive} onChange={() => setIsDescriptionActive(!isDescriptionActive)} />
            <label htmlFor="desc-check">Vad är du ute efter?</label>
          </div>
          <div className="button-grid">
             {descriptionOptions.map(desc => (<button key={desc} className={`option-button ${selectedDescriptions.includes(desc) ? 'selected' : ''}`} onClick={() => handleMultiSelect(desc, selectedDescriptions, setSelectedDescriptions)} disabled={!isDescriptionActive}>{desc}</button>))}
          </div>
        </div>
        <div className={`form-group full-width ${!isTempoActive ? 'disabled' : ''}`} onClick={() => !isTempoActive && activateSection(setIsTempoActive)}>
          <div className="form-group-header">
            <input type="checkbox" id="tempo-check" checked={isTempoActive} onChange={() => setIsTempoActive(!isTempoActive)} />
            <label htmlFor="tempo-check">Specifikt tempo (BPM)</label>
          </div>
          <div className="range-slider">
            <span>{bpmMin}</span>
            <input type="range" min="60" max="200" value={bpmMin} onChange={(e) => setBpmMin(parseInt(e.target.value))} disabled={!isTempoActive} />
            <span>{bpmMax}</span>
            <input type="range" min="60" max="200" value={bpmMax} onChange={(e) => setBpmMax(parseInt(e.target.value))} disabled={!isTempoActive} />
          </div>
        </div>
        <div className={`form-group full-width ${!isDurationActive ? 'disabled' : ''}`} onClick={() => !isDurationActive && activateSection(setIsDurationActive)}>
          <div className="form-group-header">
            <input type="checkbox" id="duration-check" checked={isDurationActive} onChange={() => setIsDurationActive(!isDurationActive)} />
            <label htmlFor="duration-check">Minst speltid</label>
          </div>
          <div className="range-slider">
            <input type="range" min="10" max="240" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} disabled={!isDurationActive} />
            <span>{duration} min</span>
          </div>
        </div>
        <button className="confirm-button" onClick={handleConfirm}>
          ✨ Generera ny spellista ✨
        </button>
      </div>
    </div>
  );
};

export default CriteriaSelection;