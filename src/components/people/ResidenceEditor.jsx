import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { C, MIN_YEAR } from "../../config/theme.js";
import { Btn } from "../ui/Primitives.jsx";
import { NumberInput, SelectInput } from "../ui/FormFields.jsx";

function ResidenceEditor({ value, onChange, locations }) {
  const rows = value || [];
  const opts = locations.map((l) => ({ value: l.id, label: l.name }));
  const set = (i, key, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  return (
    <div>
      {rows.length === 0 && <div style={{ fontSize: 12, color: C.faint, marginBottom: 8 }}>No residences yet — add where this person lived and when.</div>}
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}><SelectInput value={r.at} onChange={(v) => set(i, "at", v)} options={opts} placeholder="Location…" /></div>
          <div style={{ width: 110 }}><NumberInput value={r.from} onChange={(v) => set(i, "from", v)} placeholder="From year" /></div>
          <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="fa-click" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.danger, borderRadius: 8, padding: 8 }}><Trash2 size={14} /></button>
        </div>
      ))}
      <Btn small kind="soft" icon={Plus} onClick={() => onChange([...rows, { at: locations[0]?.id || "", from: MIN_YEAR }])}>Add residence</Btn>
    </div>
  );
}

/* =============================== PERSON CARD ============================= */

export { ResidenceEditor };
