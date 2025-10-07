import { useMemo } from "react";

const GENRE_OPTS = ["Pop","Rock","Hip Hop","RnB","Elektroniskt","Indie","House","Techno","Soul","Funk","Jazz","Metal","Punk","Ambient","Country","Folk","Klassiskt","Reggae"];
const MOOD_OPTS  = ["Glad","Energisk","Fokus","Avslappnad","Ledsen","Romantisk","Träning","Fest","Mysig","Dramatisk","Melankolisk","Hoppfull"];

export default function CriteriaSelection({ value, onChange, onGenerate, submitting }) {
  const s = useMemo(() => ({
    useGenre:false,useMood:false,useTempo:false,useDuration:true,
    genres:[],moods:[],bpmMin:100,bpmMax:140,lengthMin:60,
    ...(value||{})
  }), [value]);

  const patch = (p) => onChange?.({ ...s, ...p });
  const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]);

  return (
    <div className="criteria-form">
      {/* Genre */}
      <div className="form-group">
        <div className="form-group-header">
          <input id="gchk" type="checkbox" checked={s.useGenre} onChange={e=>patch({useGenre:e.target.checked})}/>
          <label htmlFor="gchk">Önskad genre</label>
        </div>
        <div className="button-grid">
          {GENRE_OPTS.map(g => (
            <button key={g} type="button"
              disabled={!s.useGenre}
              className={`option-button ${s.genres.includes(g) ? "selected":""}`}
              onClick={()=>patch({ genres: toggle(s.genres, g) })}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="form-group">
        <div className="form-group-header">
          <input id="mchk" type="checkbox" checked={s.useMood} onChange={e=>patch({useMood:e.target.checked})}/>
          <label htmlFor="mchk">Önskad stämning</label>
        </div>
        <div className="button-grid">
          {MOOD_OPTS.map(m => (
            <button key={m} type="button"
              disabled={!s.useMood}
              className={`option-button ${s.moods.includes(m) ? "selected":""}`}
              onClick={()=>patch({ moods: toggle(s.moods, m) })}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Tempo */}
      <div className="form-group full-width">
        <div className="form-group-header">
          <input id="tchk" type="checkbox" checked={s.useTempo} onChange={e=>patch({useTempo:e.target.checked})}/>
          <label htmlFor="tchk">Specifikt tempo (BPM)</label>
        </div>
        <div className="range-slider">
          <span>{s.bpmMin}</span>
          <input type="range" min="60" max="200" value={s.bpmMin} disabled={!s.useTempo}
                 onChange={e=>patch({ bpmMin:+e.target.value })}/>
          <span>{s.bpmMax}</span>
          <input type="range" min="60" max="200" value={s.bpmMax} disabled={!s.useTempo}
                 onChange={e=>patch({ bpmMax:+e.target.value })}/>
        </div>
      </div>

      {/* Minst speltid */}
      <div className="form-group full-width">
        <div className="form-group-header">
          <input id="dchk" type="checkbox" checked={s.useDuration} onChange={e=>patch({useDuration:e.target.checked})}/>
          <label htmlFor="dchk">Minst speltid</label>
        </div>
        <div className="range-slider">
          <input type="range" min="10" max="240" step="5" value={s.lengthMin} disabled={!s.useDuration}
                 onChange={e=>patch({ lengthMin:+e.target.value })}/>
          <span>{s.lengthMin} min</span>
        </div>
      </div>

      <button className="confirm-button" type="button" onClick={onGenerate} disabled={submitting}>
        {submitting ? "Skapar…" : "✨ Generera ny spellista ✨"}
      </button>
    </div>
  );
}
