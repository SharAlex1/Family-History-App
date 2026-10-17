import React from "react";
import { Clock, MapPin, FileText, X, ArrowRight, Pencil } from "lucide-react";
import { C } from "../../config/theme.js";
import { uniq } from "../../utils/ids.js";
import { TYPE, DOC_ICON } from "../../config/eventTypes.js";
import { fullName, statusAt, ageAt, residenceAt } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { DialogFrame } from "../ui/DialogFrame.jsx";
import { Avatar, Pill } from "../ui/Primitives.jsx";

function ProfilePanel({ id, year, onClose, openPerson, setView, focusPerson, onEdit }) {
  const { getP, getL, data } = useData();
  const p = getP(id);
  const status = statusAt(p, year), age = ageAt(p, year), where = residenceAt(p, year);
  const lifeEvents = data.events.filter((e) => (e.people || []).includes(id)).sort((a, b) => a.year - b.year);
  const docs = data.documents.filter((d) => (d.people || []).includes(id));
  const relList = (ids, label) => (ids || []).length > 0 && (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {ids.map((rid) => { const rp = getP(rid); return (
          <button key={rid} onClick={() => openPerson(rid)} className="fa-click" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 10px 4px 4px" }}>
            <Avatar p={rp} size={24} status={statusAt(rp, year)} /><span style={{ fontSize: 12.5, color: C.text }}>{fullName(rp)}</span>
          </button>
        ); })}
      </div>
    </div>
  );
  const places = uniq((p.residences || []).map((r) => getL(r.at).name));
  return (
    <DialogFrame title={fullName(p)} onClose={onClose} className="fa-panel" element="aside" width={420} backdropClassName="fa-backdrop">
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 14, position: "sticky", top: 0, background: C.panelSolid, zIndex: 2 }}>
          <Avatar p={p} size={56} status={status} selected />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 21, color: C.text, lineHeight: 1.1 }}>{fullName(p)}</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>{p.birth} – {p.death != null ? p.death : "present"} · born {getL(p.born).name}</div>
            <div style={{ marginTop: 8 }}>
              {status === "alive" && <Pill color={C.teal} bg={`${C.teal}1a`}>{age} in {year} · {where ? getL(where).name : "—"}</Pill>}
              {status === "deceased" && <Pill color={C.gray}>Deceased before {year}</Pill>}
              {status === "unborn" && <Pill color={C.faint}>Not yet born in {year}</Pill>}
            </div>
          </div>
          <button aria-label="Close profile" onClick={onClose} className="fa-click" style={{ background: "transparent", border: "none", color: C.sub, padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: "16px 20px 40px" }}>
          {p.bio && <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.6, margin: "0 0 18px" }}>{p.bio}</p>}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setView("map")} className="fa-click" style={{ flex: 1, minWidth: 110, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, color: C.amber, background: `${C.amber}12`, border: `1px solid ${C.amberSoft}`, padding: "9px", borderRadius: 10 }}><MapPin size={14} /> View on map</button>
            <button onClick={() => { focusPerson(); setView("timeline"); }} className="fa-click" style={{ flex: 1, minWidth: 110, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, color: C.violet, background: `${C.violet}12`, border: `1px solid ${C.violet}33`, padding: "9px", borderRadius: 10 }}><Clock size={14} /> Focus timeline</button>
          </div>
          <button onClick={() => onEdit(p.id)} className="fa-click" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, color: C.text, background: C.panel2, border: `1px solid ${C.border}`, padding: "9px", borderRadius: 10, marginBottom: 20 }}><Pencil size={14} /> Edit this person</button>
          {(p.branches || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>Branches</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {(p.branches || []).map((bid) => { const b = data.branches.find((x) => x.id === bid); if (!b) return null; return (
                  <span key={bid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${b.color}18`, border: `1px solid ${b.color}55`, borderRadius: 999, padding: "4px 11px", fontSize: 12.5, color: C.text }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color }} />{b.name}
                  </span>
                ); })}
              </div>
            </div>
          )}
          {relList(p.parents, "Parents")}
          {relList(p.spouses, "Spouse")}
          {relList(p.children, "Children")}
          {relList(p.siblings || [], "Recorded siblings")}
          {places.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>Places lived</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {places.map((c, i) => <React.Fragment key={i}><span style={{ fontSize: 13, color: C.text }}>{c}</span>{i < places.length - 1 && <ArrowRight size={12} color={C.faint} />}</React.Fragment>)}
              </div>
            </div>
          )}
          {lifeEvents.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, marginBottom: 9 }}>Life timeline</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lifeEvents.map((e) => { const m = TYPE[e.type] || TYPE.milestone; return (
                  <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 13, color: C.sub, width: 36 }}>{e.year}</span>
                    <m.Icon size={14} color={m.color} /><span style={{ fontSize: 12.5, color: C.text }}>{e.title}</span>
                  </div>
                ); })}
              </div>
            </div>
          )}
          {docs.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, marginBottom: 9 }}>Documents</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {docs.map((d) => { const Dn = DOC_ICON[d.type] || FileText; return (
                  <div key={d.id} style={{ display: "flex", gap: 10, alignItems: "center", background: C.panel2, borderRadius: 10, padding: "8px 11px" }}>
                    <Dn size={15} color={C.rose} /><span style={{ fontSize: 12.5, color: C.text }}>{d.title}</span><span style={{ marginLeft: "auto" }}><Pill>{d.year}</Pill></span>
                  </div>
                ); })}
              </div>
            </div>
          )}
        </div>
    </DialogFrame>
  );
}

/* ============================== EMPTY STATE ============================ */

export { ProfilePanel };
