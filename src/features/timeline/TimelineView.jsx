import React, { useMemo } from "react";
import { Clock, X } from "lucide-react";
import { C } from "../../config/theme.js";
import { TYPE } from "../../config/eventTypes.js";
import { fullName, matchBranch } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Pill, EmptyState } from "../../components/ui/Primitives.jsx";

function TimelineView({ year, openPerson, typeFilter, setTypeFilter, branchSel, focusId, clearFocus }) {
  const { data, getP, getL } = useData();
  const filtered = useMemo(() => data.events
    .filter((e) => typeFilter === "all" || e.type === typeFilter)
    .filter((e) => !focusId || (e.people || []).includes(focusId))
    .filter((e) => focusId || branchSel.length === 0 || e.historical || (e.people || []).some((id) => matchBranch(getP(id), branchSel)))
    .sort((a, b) => a.year - b.year || (a.type === "birth" ? -1 : 1)), [data.events, typeFilter, branchSel, focusId]);
  const types = ["all", ...Object.keys(TYPE)];
  return (
    <div style={{ padding: "22px 24px 130px" }}>
      <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: "0 0 4px" }}>Timeline</h2>
      <p style={{ color: C.faint, fontSize: 13, margin: "0 0 16px" }}>The marker shows {year}. Events fade as they move away from the selected year.</p>
      {focusId && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.violet}14`, border: `1px solid ${C.violet}44`, borderRadius: 999, padding: "5px 6px 5px 12px", marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, color: C.violet }}>Focused on {fullName(getP(focusId))}</span>
          <button onClick={clearFocus} className="fa-click" style={{ background: "transparent", border: "none", color: C.violet, display: "flex", padding: 2 }}><X size={14} /></button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {types.map((t) => {
          const on = typeFilter === t; const m = t === "all" ? null : TYPE[t];
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className="fa-click" style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, border: `1px solid ${on ? (m ? m.color : C.amber) : C.border}`, color: on ? (m ? m.color : C.amber) : C.sub, background: on ? `${m ? m.color : C.amber}14` : "transparent", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {m && <m.Icon size={13} />}{t === "all" ? "All events" : m.label}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? <EmptyState icon={Clock} title="No events match" msg="Adjust the filters or add events in Manage Data." inline /> : (
        <div style={{ position: "relative", paddingLeft: 30, maxWidth: 760 }}>
          <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: C.border }} />
          {filtered.map((e) => {
            const m = TYPE[e.type] || TYPE.milestone; const dist = Math.abs(e.year - year); const near = dist <= 3;
            const opacity = dist === 0 ? 1 : dist <= 5 ? 0.9 : dist <= 15 ? 0.6 : 0.42;
            return (
              <div key={e.id} style={{ position: "relative", marginBottom: 16, opacity, transition: "opacity .3s" }}>
                <div style={{ position: "absolute", left: -30, top: 4, width: 16, height: 16, borderRadius: "50%", background: C.bg, border: `2px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} /></div>
                <div className="fa-card" style={{ background: e.historical ? "transparent" : C.panelSolid, border: `1px solid ${near ? m.color + "66" : e.historical ? C.borderSoft : C.border}`, borderStyle: e.historical ? "dashed" : "solid", borderRadius: 13, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 17, fontWeight: 600, color: near ? m.color : C.text, width: 48, flexShrink: 0 }}>{e.year}</span>
                    <m.Icon size={15} color={m.color} />
                    <span style={{ fontSize: 14, color: e.historical ? C.sub : C.text, fontStyle: e.historical ? "italic" : "normal" }}>{e.title}</span>
                    <span style={{ marginLeft: "auto" }}><Pill color={C.faint}>{getL(e.at).name}</Pill></span>
                  </div>
                  {e.desc && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 7, lineHeight: 1.5 }}>{e.desc}</div>}
                  {(e.people || []).length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                      {e.people.map((id) => <button key={id} onClick={() => openPerson(id)} className="fa-click" style={{ fontSize: 11.5, color: C.sub, background: C.panel2, border: "none", padding: "3px 9px", borderRadius: 999 }}>{fullName(getP(id))}</button>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================= MAP ================================ */
// Natural Earth "land" (1:110m, coastline only — no borders), via the standard
// world-atlas TopoJSON. Loaded at runtime and projected with d3-geo's Natural
// Earth projection. If the dataset can't be reached, the map falls back to the
// existing stylized base so it is never empty.

export { TimelineView };
