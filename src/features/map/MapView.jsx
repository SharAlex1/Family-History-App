import { tr } from "../../i18n/index.js";
import React from "react";
import { MapPin } from "lucide-react";
import { C } from "../../config/theme.js";
import { fullName, statusAt, residenceAt, matchBranch } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Pill, EmptyState } from "../../components/ui/Primitives.jsx";
import { LAND_PATHS, useWorldMap, arcPath } from "../../lib/worldMap.js";

function MapView({ year, selectedId, openPerson, branchSel }) {
  const { data, getL, getP } = useData();

  // Accurate Natural Earth base map (shared loader), projected with d3-geo's
  // Natural Earth projection. Falls back to the stylized base if it can't load.
  const world = useWorldMap();
  const landPath = world.landPath;

  // Project a location by lat/lng when the accurate map is ready; otherwise fall
  // back to the location's stored stylized x/y so the map keeps working.
  const ptOf = (l) => {
    const proj = world.proj;
    if (proj && Number.isFinite(l.lat) && Number.isFinite(l.lng)) {
      const p = proj([l.lng, l.lat]);
      if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) return { x: p[0], y: p[1] };
    }
    return { x: l.x, y: l.y };
  };

  const living = data.people.filter((p) => statusAt(p, year) === "alive").filter((p) => matchBranch(p, branchSel));
  const clusters = {};
  living.forEach((p) => { const at = residenceAt(p, year); if (at) (clusters[at] = clusters[at] || []).push(p); });
  // migration arcs from editable migrations that have occurred
  const occurred = data.migrations.filter(mg => !getL(mg.from).unmapped && !getL(mg.to).unmapped).filter((mg) => mg.startYear <= year).filter((mg) => branchSel.length === 0 || (mg.mode === "person" ? matchBranch(getP(mg.personId), branchSel) : branchSel.includes(mg.branch)));
  const sel = selectedId ? getP(selectedId) : null;
  const selSet = new Set((data.migrations).filter((mg) => sel && ((mg.mode === "person" && mg.personId === sel.id) || (mg.mode === "branch" && (sel.branches || []).includes(mg.branch)))).map((mg) => mg.id));
  if (data.locations.length === 0) return <EmptyState icon={MapPin} title={tr("No locations yet")} msg={tr("Add locations in Manage Data to populate the map.")} />;
  return (
    <div style={{ padding: "22px 24px 130px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: 0 }}>{tr("Migration Map")}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: C.sub }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: C.teal }} />{tr("Living here in ")}{year}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 2, background: C.amber, display: "inline-block" }} />{tr("Migration path")}</span>
        </div>
      </div>
      <p style={{ color: C.faint, fontSize: 13, margin: "0 0 14px" }}>{tr("Pins show where living members were in ")}{year}. {sel ? tr("Tracing {{v0}}'s paths.", {v0: fullName(sel)}) : tr("Select a person to highlight their routes.")}</p>
      <div style={{ borderRadius: 18, border: `1px solid ${C.border}`, background: "#0b0d13", overflow: "hidden" }}>
        <svg viewBox="0 0 1000 560" style={{ width: "100%", display: "block" }}>
          <defs>
            <radialGradient id="ocean" cx="50%" cy="40%" r="80%"><stop offset="0%" stopColor="#11151f" /><stop offset="100%" stopColor="#0a0c12" /></radialGradient>
            <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.amber} stopOpacity="0.15" /><stop offset="100%" stopColor={C.amber} stopOpacity="0.7" /></linearGradient>
          </defs>
          <rect width="1000" height="560" fill="url(#ocean)" />
          {[120, 200, 280, 360, 440].map((y) => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke={C.borderSoft} strokeWidth="1" opacity="0.5" />)}
          {[160, 320, 480, 640, 800].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="560" stroke={C.borderSoft} strokeWidth="1" opacity="0.5" />)}
          {landPath
            ? <path d={landPath} fill={C.panel2} stroke={C.border} strokeWidth="0.8" opacity="0.95" />
            : <g fill={C.panel2} stroke={C.border} strokeWidth="1.2" opacity="0.95">{LAND_PATHS.map((d, i) => <path key={i} d={d} />)}</g>}
          {occurred.map((mg) => {
            const a = ptOf(getL(mg.from)), b = ptOf(getL(mg.to)); const isSel = selSet.has(mg.id);
            return <path key={mg.id} d={arcPath(a, b)} fill="none" stroke={isSel ? "url(#arc)" : C.amberLine} strokeWidth={isSel ? 3 : 1.4} className={isSel ? "fa-flow" : ""} opacity={isSel ? 1 : 0.26} />;
          })}
          {Object.entries(clusters).filter(([locId])=>!getL(locId).unmapped).map(([locId, ppl]) => {
            const l = getL(locId); const pt = ptOf(l); const hasSel = sel && ppl.some((p) => p.id === sel.id); const r = 7 + Math.min(ppl.length, 5) * 2.2;
            return (
              <g key={locId}>
                <circle cx={pt.x} cy={pt.y} r={r + 8} fill={C.teal} opacity="0.10" className="fa-pulse" />
                <circle cx={pt.x} cy={pt.y} r={r} fill={hasSel ? C.amber : C.teal} stroke="#0b0d13" strokeWidth="2" />
                <text x={pt.x} y={pt.y + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0b0d13">{ppl.length}</text>
                <text x={pt.x} y={pt.y - r - 7} textAnchor="middle" fontSize="12.5" fill={C.text} fontFamily="Fraunces, Georgia, serif">{l.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
        {Object.entries(clusters).sort((a, b) => b[1].length - a[1].length).map(([locId, ppl]) => (
          <div key={locId} className="fa-card" style={{ padding: 14, borderRadius: 13, background: C.panelSolid, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <MapPin size={14} color={C.amber} /><span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 15, color: C.text }}>{getL(locId).name}{getL(locId).unmapped ? tr(" (needs coordinates)") : ""}</span>
              <span style={{ marginLeft: "auto" }}><Pill color={C.teal}>{ppl.length}</Pill></span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ppl.map((p) => <button key={p.id} onClick={() => openPerson(p.id)} className="fa-click" style={{ fontSize: 11.5, color: C.sub, background: C.panel2, border: "none", padding: "3px 9px", borderRadius: 999 }}>{p.first} {(p.last || " ")[0]}.</button>)}
            </div>
          </div>
        ))}
        {Object.keys(clusters).length === 0 && <div style={{ color: C.faint, fontSize: 13, padding: 20 }}>{tr("No family members were living in ")}{year}{tr(" — try a later year.")}</div>}
      </div>
    </div>
  );
}

/* ================================ PEOPLE ============================== */

export { MapView };
