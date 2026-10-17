import React, { useState, useRef, useId } from "react";
import { Home, GitBranch, Clock, MapPin, Users, FileText, Search, Filter, Compass, Database, Check } from "lucide-react";
import { C } from "../../config/theme.js";
import { fullName } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Avatar } from "../ui/Primitives.jsx";

const NAV = [
  { id: "dashboard", label: "Overview", Icon: Home },
  { id: "tree", label: "Family Tree", Icon: GitBranch },
  { id: "timeline", label: "Timeline", Icon: Clock },
  { id: "map", label: "Map", Icon: MapPin },
  { id: "people", label: "People", Icon: Users },
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "manage", label: "Manage Data", Icon: Database },
];

function Sidebar({ view, setView }) {
  return (
    <nav className="fa-sidebar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 22px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.amber},#b07a2e)`, display: "flex", alignItems: "center", justifyContent: "center" }}><Compass size={19} color="#1a1206" /></div>
        <div className="fa-label">
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 16, color: C.text, lineHeight: 1 }}>Family Atlas</div>
          <div style={{ fontSize: 10.5, color: C.faint, letterSpacing: 0.5 }}>history in motion</div>
        </div>
      </div>
      {NAV.map(({ id, label, Icon }) => {
        const on = view === id;
        return (
          <button key={id} aria-label={label} title={label} aria-current={on ? "page" : undefined} onClick={() => setView(id)} className="fa-click fa-navbtn" style={{ background: on ? C.panel2 : "transparent", color: on ? C.text : C.sub, borderLeft: `2px solid ${on ? C.amber : "transparent"}` }}>
            <Icon size={18} /><span className="fa-label">{label}</span>
          </button>
        );
      })}
      <div style={{ marginTop: "auto", padding: "12px 8px 4px", borderTop: `1px solid ${C.border}` }} className="fa-label">
        <div style={{ fontSize: 11, color: C.faint, lineHeight: 1.5 }}>Editable archive<br />React state + local save</div>
      </div>
    </nav>
  );
}

/* ================================ TOPBAR ============================== */

function TopBar({ branchSel, setBranchSel, query, setQuery, openPerson }) {
  const { data, getP } = useData();
  const [open, setOpen] = useState(false);
  const searchRef=useRef(null), resultsRef=useRef(null), resultsId=useId();
  const move=(e,offset)=>{e.preventDefault();const buttons=[...(resultsRef.current?.querySelectorAll("button")||[])];if(!buttons.length)return;const i=buttons.indexOf(document.activeElement);buttons[(i+offset+buttons.length)%buttons.length]?.focus();};
  const results = query ? data.people.filter((p) => fullName(p).toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];
  const toggle = (id) => setBranchSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <header className="fa-topbar">
      <div className="fa-search" onKeyDown={e=>{if(e.key==="ArrowDown")move(e,1);if(e.key==="ArrowUp")move(e,-1);if(e.key==="Escape"){e.preventDefault();searchRef.current?.focus();setOpen(false);}}} style={{ position: "relative", flex: 1, maxWidth: 360 }}>
        <Search size={15} color={C.faint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input ref={searchRef} aria-label="Search the family" role="combobox" aria-autocomplete="list" aria-expanded={open && results.length > 0} aria-controls={resultsId} value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={e => {if(!e.currentTarget.parentElement.contains(e.relatedTarget))setOpen(false);}} placeholder="Search the family…" style={{ width: "100%", background: C.panel2, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, borderRadius: 10, padding: "9px 12px 9px 34px", outline: "none" }} />
        {open && results.length > 0 && (
          <div ref={resultsRef} id={resultsId} role="listbox" aria-label="Family search results" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.panelSolid, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, zIndex: 30, boxShadow: "0 12px 40px #0008" }}>
            {results.map((p) => (
              <button key={p.id} role="option" aria-selected="false" onMouseDown={e=>e.preventDefault()} onClick={() => { openPerson(p.id); setQuery(""); setOpen(false); }} className="fa-click" style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: "7px 8px", borderRadius: 8, textAlign: "left" }}>
                <Avatar p={p} size={26} status="alive" /><span style={{ fontSize: 13, color: C.text }}>{fullName(p)}</span><span style={{ marginLeft: "auto", fontSize: 11, color: C.faint }}>{p.birth}{p.death ? `–${p.death}` : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="fa-branch-filters" aria-label="Branch filters for tree, timeline, map and people" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Filter size={14} color={C.faint} />
        <button aria-pressed={branchSel.length === 0} onClick={() => setBranchSel([])} className="fa-click" style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, border: `1px solid ${branchSel.length === 0 ? C.amber : C.border}`, color: branchSel.length === 0 ? C.amber : C.sub, background: branchSel.length === 0 ? `${C.amber}12` : "transparent" }}>All branches</button>
        {data.branches.map((b) => { const on = branchSel.includes(b.id); return (
          <button key={b.id} aria-pressed={on} onClick={() => toggle(b.id)} className="fa-click" style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${on ? (b.color || C.amber) : C.border}`, color: on ? (b.color || C.amber) : C.sub, background: on ? `${b.color || C.amber}12` : "transparent" }}>
            {on && <Check size={12} />}{b.name}
          </button>
        ); })}
      </div>
    </header>
  );
}

/* ============================== TIME SLIDER ============================ */

export { NAV, Sidebar, TopBar };
