import React from "react";
import { GitBranch, Clock, MapPin, ChevronRight, ArrowRight, Compass, Database, Plus } from "lucide-react";
import { C } from "../../config/theme.js";
import { uniq } from "../../utils/ids.js";
import { TYPE } from "../../config/eventTypes.js";
import { fullName, statusAt, residenceAt } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";

function Stat({ k, v, sub, accent }) {
  return (
    <div className="fa-card" style={{ padding: 18, borderRadius: 16, background: C.panelSolid, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.sub, letterSpacing: 0.3 }}>{k}</div>
      <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 34, color: accent || C.text, lineHeight: 1.1, marginTop: 6 }}>{v}</div>
      {sub && <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NavCard({ Icon, title, desc, color, onClick }) {
  return (
    <button onClick={onClick} className="fa-card fa-click" style={{ textAlign: "left", padding: 18, borderRadius: 16, background: C.panelSolid, border: `1px solid ${C.border}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}1f`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={20} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 16, color: C.text }}>{title}</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3 }}>{desc}</div>
      </div>
      <ChevronRight size={18} color={C.faint} style={{ marginTop: 12 }} />
    </button>
  );
}

function DashboardView({ year, setView }) {
  const { data, getL } = useData();
  const people = data.people;
  if (people.length === 0) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: "40px auto", textAlign: "center" }}>
        <Compass size={40} color={C.amber} style={{ marginBottom: 16 }} />
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 28, color: C.text }}>Your archive is empty</h1>
        <p style={{ color: C.sub, marginTop: 10, lineHeight: 1.6 }}>Add your first family member to begin building the timeline, tree, and map.</p>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 10 }}>
          <Btn kind="primary" icon={Plus} onClick={() => setView("manage")}>Open Manage Data</Btn>
        </div>
      </div>
    );
  }
  const living = people.filter((p) => statusAt(p, year) === "alive");
  const earliest = people.reduce((a, b) => (b.birth < a.birth ? b : a));
  const regions = uniq(people.flatMap((p) => (p.residences || []).map((r) => getL(r.at).region)).filter(Boolean));
  const path = (earliest.residences || []).map((r) => getL(r.at).name);
  const highlights = [...data.events].filter((e) => ["milestone", "migration", "marriage"].includes(e.type)).sort((a, b) => b.year - a.year).slice(0, 4);
  return (
    <div style={{ padding: "28px 32px 120px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, letterSpacing: 2, textTransform: "uppercase", color: C.amber }}>Family Archive</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 38, color: C.text, margin: "6px 0 0" }}>{regions.length} regions, {data.branches.length} branches, one story.</h1>
          <p style={{ color: C.sub, fontSize: 15, maxWidth: 620, marginTop: 10, lineHeight: 1.55 }}>Everything below is generated from your editable data. Move through time to watch the family unfold — or open Manage Data to change anything.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 52, fontWeight: 600, color: C.amber, lineHeight: 1 }}>{year}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{living.length} living · {new Set(living.map((p) => residenceAt(p, year)).filter(Boolean)).size} places</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginTop: 26 }}>
        <Stat k="Family members" v={people.length} sub="across the archive" />
        <Stat k="Branches" v={data.branches.length} sub={data.branches.map((b) => b.name).join(" · ") || "—"} accent={C.amber} />
        <Stat k="Earliest ancestor" v={earliest.birth} sub={`${fullName(earliest)}, ${getL(earliest.born).name}`} />
        <Stat k="Regions" v={regions.length} sub={regions.join(" · ") || "—"} accent={C.teal} />
        <Stat k="Migrations" v={data.migrations.length} sub="recorded paths" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginTop: 22 }} className="fa-dash-grid">
        <div className="fa-card" style={{ padding: 20, borderRadius: 16, background: C.panelSolid, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12.5, color: C.sub, letterSpacing: 0.5, textTransform: "uppercase" }}>{fullName(earliest)}'s path</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {path.map((c, i) => (
              <React.Fragment key={i}>
                <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 18, color: C.text }}>{c}</span>
                {i < path.length - 1 && <ArrowRight size={16} color={C.amber} />}
              </React.Fragment>
            ))}
          </div>
          <button onClick={() => setView("map")} className="fa-click" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, color: C.amber, background: "transparent", border: `1px solid ${C.amberSoft}`, padding: "8px 14px", borderRadius: 10, fontSize: 13 }}>Open the migration map <ArrowRight size={15} /></button>
        </div>
        <div className="fa-card" style={{ padding: 20, borderRadius: 16, background: C.panelSolid, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12.5, color: C.sub, letterSpacing: 0.5, textTransform: "uppercase" }}>Highlighted events</div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {highlights.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>No events yet.</div>}
            {highlights.map((e) => { const m = TYPE[e.type] || TYPE.milestone; return (
              <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${m.color}1f`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><m.Icon size={15} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  <div style={{ fontSize: 11.5, color: C.faint }}>{e.year} · {getL(e.at).name}</div>
                </div>
              </div>
            ); })}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 22 }}>
        <NavCard Icon={GitBranch} title="Family Tree" desc="Who was alive, and how old" color={C.teal} onClick={() => setView("tree")} />
        <NavCard Icon={Clock} title="Timeline" desc="Every event, year by year" color={C.violet} onClick={() => setView("timeline")} />
        <NavCard Icon={MapPin} title="Map" desc="Where everyone was" color={C.amber} onClick={() => setView("map")} />
        <NavCard Icon={Database} title="Manage Data" desc="Add, edit & remove everything" color={C.rose} onClick={() => setView("manage")} />
      </div>
    </div>
  );
}

/* ============================== FAMILY TREE ============================ */

export { Stat, NavCard, DashboardView };
