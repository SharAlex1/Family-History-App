import React, { useMemo } from "react";
import { GitBranch, Heart } from "lucide-react";
import { C } from "../../config/theme.js";
import { matchBranch } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { EmptyState } from "../../components/ui/Primitives.jsx";
import { PersonCard } from "../../components/people/PersonCard.jsx";

function FamilyTreeView({ year, selectedId, openPerson, branchSel }) {
  const { data, getP } = useData();
  const people = data.people;
  const gens = useMemo(() => computeGenerations(people), [people]);
  const sel = selectedId ? getP(selectedId) : null;
  const relColor = (id) => {
    if (!sel) return null;
    if ((sel.parents || []).includes(id)) return C.sky;
    if ((sel.children || []).includes(id)) return C.teal;
    if ((sel.spouses || []).includes(id)) return C.rose;
    return null;
  };
  const dimmed = (p) => branchSel.length > 0 && !matchBranch(p, branchSel);
  if (people.length === 0) return <EmptyState icon={GitBranch} title="No people yet" msg="Add family members in Manage Data to build the tree." />;
  return (
    <div style={{ padding: "22px 24px 130px", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: 0 }}>Family Tree</h2>
        {sel && (
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.sub }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: C.sky }} />Parent</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: C.rose }} />Spouse</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: C.teal }} />Child</span>
          </div>
        )}
      </div>
      <p style={{ color: C.faint, fontSize: 13, margin: "0 0 18px" }}>Cards reflect {year}. Select anyone to trace their relations through the generations.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, minWidth: "fit-content" }}>
        {gens.map((row, gi) => (
          <div key={gi}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>Generation {gi + 1}</div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "stretch" }}>
              {groupUnions(row, getP).map((unit, ui) => (
                <div key={ui} style={{ display: "flex", alignItems: "center" }}>
                  {unit.map((p, idx) => {
                    const rc = relColor(p.id);
                    return (
                      <React.Fragment key={p.id}>
                        {idx > 0 && <div style={{ width: 26, display: "flex", justifyContent: "center", color: C.rose }}><Heart size={14} fill={C.rose} /></div>}
                        <div style={{ position: "relative" }}>
                          {rc && <div style={{ position: "absolute", inset: -4, borderRadius: 18, border: `2px solid ${rc}`, pointerEvents: "none" }} />}
                          <PersonCard p={p} year={year} selected={selectedId === p.id} dim={dimmed(p)} onClick={() => openPerson(p.id)} />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// assign generation by depth from people with no parents

function computeGenerations(people) {
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const depth = {};
  const visit = (id, d, seen) => {
    if (seen.has(id)) return; seen.add(id);
    depth[id] = Math.max(depth[id] ?? 0, d);
    const p = byId[id]; if (!p) return;
    (p.children || []).forEach((c) => visit(c, d + 1, seen));
  };
  people.filter((p) => (p.parents || []).length === 0).forEach((p) => visit(p.id, 0, new Set()));
  people.forEach((p) => { if (depth[p.id] == null) depth[p.id] = 0; });
  // pull spouses to the deeper of the pair
  people.forEach((p) => (p.spouses || []).forEach((s) => { if (byId[s]) { const m = Math.max(depth[p.id], depth[s]); depth[p.id] = m; depth[s] = m; } }));
  const maxD = Math.max(0, ...Object.values(depth));
  const rows = Array.from({ length: maxD + 1 }, () => []);
  people.forEach((p) => rows[depth[p.id]].push(p));
  return rows.filter((r) => r.length);
}

function groupUnions(row, getP) {
  const ids = new Set(row.map((p) => p.id));
  const used = new Set();
  const units = [];
  row.forEach((p) => {
    if (used.has(p.id)) return;
    const sp = (p.spouses || []).map(getP).find((s) => s && ids.has(s.id) && !used.has(s.id));
    if (sp) { units.push([p, sp]); used.add(p.id); used.add(sp.id); }
    else { units.push([p]); used.add(p.id); }
  });
  return units;
}

/* =============================== TIMELINE ============================== */

export { FamilyTreeView, computeGenerations, groupUnions };
