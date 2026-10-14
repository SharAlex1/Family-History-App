import React from "react";
import { Play, Pause } from "lucide-react";
import { C, MIN_YEAR, MAX_YEAR } from "../../config/theme.js";
import { statusAt, residenceAt } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";

function TimeSlider({ year, setYear, playing, setPlaying }) {
  const { data } = useData();
  const living = data.people.filter((p) => statusAt(p, year) === "alive");
  const places = new Set(living.map((p) => residenceAt(p, year))).size;
  const decades = []; for (let y = 1900; y <= 2020; y += 20) decades.push(y);
  return (
    <div className="fa-slider">
      <button onClick={() => setPlaying((v) => !v)} className="fa-click" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: playing ? C.amber : `${C.amber}1a`, color: playing ? "#1a1206" : C.amber, border: `1px solid ${C.amber}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {playing ? <Pause size={19} /> : <Play size={19} style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ width: 88, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 30, fontWeight: 600, color: C.amber, lineHeight: 1 }}>{year}</div>
        <div style={{ fontSize: 10.5, color: C.faint }}>{living.length} living · {places} places</div>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={year} onChange={(e) => { setPlaying(false); setYear(+e.target.value); }} className="fa-range" />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 2px" }}>{decades.map((d) => <span key={d} style={{ fontSize: 10, color: C.faint }}>{d}</span>)}</div>
      </div>
    </div>
  );
}

/* ============================ PERSISTENCE ============================= */

export { TimeSlider };
