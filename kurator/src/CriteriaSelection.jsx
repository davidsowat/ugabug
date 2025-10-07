import { useState } from "react";

export default function CriteriaForm({ onChange, onSubmit, disabled }) {
  const [criteria, setCriteria] = useState({
    mood: "",
    bpmRange: "",
    genre: "",
    length: "",
  });

  function patch(p) {
    const next = { ...criteria, ...p };
    setCriteria(next);
    onChange?.(sanitize(next));
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>2) Välj kriterier</h3>
      <div style={grid}>
        <Field label="Mood (komma-separerat)">
          <input style={input} placeholder="t.ex. fest, glad, fokus"
                 value={criteria.mood} onChange={(e) => patch({ mood: e.target.value })}/>
        </Field>
        <Field label="BPM-intervall">
          <input style={input} placeholder="t.ex. 118-132"
                 value={criteria.bpmRange} onChange={(e) => patch({ bpmRange: e.target.value })}/>
        </Field>
        <Field label="Genrer (komma-separerat)">
          <input style={input} placeholder="t.ex. house, pop"
                 value={criteria.genre} onChange={(e) => patch({ genre: e.target.value })}/>
        </Field>
        <Field label="Total längd (min)">
          <input style={input} type="number" min={0} step={5} placeholder="t.ex. 60"
                 value={criteria.length} onChange={(e) => patch({ length: e.target.value })}/>
        </Field>
      </div>

      <button style={button} onClick={() => onSubmit?.(sanitize(criteria))} disabled={disabled}>
        3) Generera med AI
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.85 }}>{label}</label>
      {children}
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginBottom: 12 };
const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a2a", background: "#0e0e0e", color: "#eaeaea" };
const button = { marginTop: 8, background: "#1db954", color: "#0a0a0a", fontWeight: 700, border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer" };

function sanitize(c) {
  const out = { ...c };
  out.mood = (out.mood || "").trim();
  out.genre = (out.genre || "").trim();
  out.bpmRange = (out.bpmRange || "").replace(/\s+/g, "");
  const len = parseInt(out.length, 10);
  out.length = Number.isFinite(len) ? Math.max(0, Math.min(len, 600)) : "";
  return out;
}
