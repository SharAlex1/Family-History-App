import React, { useState, useEffect } from "react";
import { X, Plus, Link2 } from "lucide-react";
import { C } from "../../config/theme.js";
import { uniq } from "../../utils/ids.js";
import { fullName } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Btn, EmptyState } from "../../components/ui/Primitives.jsx";
import { Field, SelectInput } from "../../components/ui/FormFields.jsx";

function RelationshipsTab() {
  const { data, actions, getP } = useData();
  const [aId, setAId] = useState(data.people[0]?.id || "");
  const [type, setType] = useState("parent");
  const [bId, setBId] = useState("");
  useEffect(() => { if (!data.people.some(p => p.id === aId)) setAId(data.people[0]?.id || ""); if (bId === aId || !data.people.some(p => p.id === bId)) setBId(""); }, [data.people, aId, bId]);
  if (data.people.length === 0) return <EmptyState inline icon={Link2} title="No people to connect" msg="Add at least two people first." />;
  const a = getP(aId);
  const otherOpts = data.people.filter((p) => p.id !== aId).map((p) => ({ value: p.id, label: fullName(p) }));
  const siblings = uniq(data.people.filter((p) => p.id !== aId && (p.parents || []).some((pp) => (a.parents || []).includes(pp))).map((p) => p.id));
  const relRow = (label, ids, kind, color) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: C.faint, marginBottom: 7 }}>{label}</div>
      {ids.length === 0 ? <div style={{ fontSize: 12.5, color: C.faint }}>None.</div> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {ids.map((id) => (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.panel2, border: `1px solid ${color}55`, borderRadius: 999, padding: "4px 6px 4px 11px", fontSize: 12.5, color: C.text }}>
              {fullName(getP(id))}
              {kind && <button onClick={() => actions.removeRelationship(aId, kind, id)} className="fa-click" title="Remove" style={{ background: "transparent", border: "none", color: C.sub, display: "flex", padding: 1 }}><X size={13} /></button>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="fa-rel-grid">
      <div className="fa-card" style={{ padding: 18, borderRadius: 14, background: C.panelSolid, border: `1px solid ${C.border}` }}>
        <Field label="Person"><SelectInput value={aId} onChange={id => { setAId(id); setBId(""); }} options={data.people.map((p) => ({ value: p.id, label: fullName(p) }))} /></Field>
        {relRow("Parents", a.parents || [], "parent", C.sky)}
        {relRow("Spouses", a.spouses || [], "spouse", C.rose)}
        {relRow("Children", a.children || [], "child", C.teal)}
        {relRow("Recorded siblings", a.siblings || [], "sibling", C.amber)}
        {relRow("Siblings (shared parents)", siblings, null, C.amber)}
      </div>
      <div className="fa-card" style={{ padding: 18, borderRadius: 14, background: C.panelSolid, border: `1px solid ${C.border}`, height: "fit-content" }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 16, color: C.text, marginBottom: 14 }}>Add a connection</div>
        <Field label={`${a ? fullName(a) : "This person"} is the…`}>
          <SelectInput value={type} onChange={setType} options={[
            { value: "parent", label: "parent of →" }, { value: "child", label: "child of →" },
            { value: "spouse", label: "spouse of ↔" }, { value: "sibling", label: "sibling of ↔ (explicit connection)" },
          ]} />
        </Field>
        <Field label="…this person"><SelectInput value={bId} onChange={setBId} options={otherOpts} placeholder="Choose a person" /></Field>
        <Btn kind="primary" icon={Plus} disabled={!bId || bId === aId} onClick={async () => { if (await actions.addRelationship(aId, type, bId)) setBId(""); }}>Add connection</Btn>
        <p style={{ fontSize: 11.5, color: C.faint, marginTop: 12, lineHeight: 1.5 }}>Connections update both people automatically and flow straight into the family tree.</p>
      </div>
    </div>
  );
}

/* ================================ SIDEBAR ============================== */

export { RelationshipsTab };
