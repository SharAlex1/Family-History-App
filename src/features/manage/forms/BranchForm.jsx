import { tr } from "../../../i18n/index.js";
import React, { useState } from "react";
import { C } from "../../../config/theme.js";
import { uid } from "../../../utils/ids.js";
import { Field, TextInput } from "../../../components/ui/FormFields.jsx";
import { FormFooter } from "./FormFooter.jsx";

function BranchForm({ value, onSave, onCancel }) {
  const init = value || { id: uid("br"), name: "", color: C.teal };
  const [f, setF] = useState(init); const [err, setErr] = useState({});
  const colors = [C.teal, C.violet, C.amber, C.rose, C.sky, C.green];
  function save() { if (!f.name.trim()) { setErr({ name: "Required" }); return; } onSave(f); }
  return (
    <>
      <Field label={tr("Branch name")} required error={err.name}><TextInput value={f.name} onChange={(v) => setF((s) => ({ ...s, name: v }))} error={err.name} placeholder={tr("e.g. Alvarez line")} /></Field>
      <Field label={tr("Color")}>
        <div style={{ display: "flex", gap: 10 }}>
          {colors.map((c) => <button key={c} type="button" aria-label={tr("Use {{v0}} color", {v0: c})} aria-pressed={f.color === c} onClick={() => setF((s) => ({ ...s, color: c }))} className="fa-click" style={{ width: 30, height: 30, borderRadius: 8, background: c, border: `2px solid ${f.color === c ? C.text : "transparent"}` }} />)}
        </div>
      </Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { BranchForm };
