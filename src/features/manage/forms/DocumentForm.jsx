import React, { useState } from "react";
import { isYear, yearError } from "../../../lib/archive.js";
import { uid } from "../../../utils/ids.js";
import { DOC_TYPES } from "../../../config/eventTypes.js";
import { fullName } from "../../../utils/people.js";
import { useData } from "../../../state/DataContext.jsx";
import { Field, TextInput, NumberInput, TextArea, SelectInput, MultiSelect } from "../../../components/ui/FormFields.jsx";
import { FormFooter } from "./FormFooter.jsx";

function DocumentForm({ value, onSave, onCancel }) {
  const { data } = useData();
  const init = value || { id: uid("d"), title: "", type: "photo", year: "", desc: "", people: [], events: [] };
  const [f, setF] = useState(init); const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function save() {
    const e = {}; if (!f.title.trim()) e.title = "Required"; if (!isYear(f.year)) e.year = yearError;
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...f, year: Number(f.year) });
  }
  return (
    <>
      <Field label="Title" required error={err.title}><TextInput value={f.title} onChange={(v) => up("title", v)} error={err.title} placeholder="e.g. Naturalization papers" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Type" required><SelectInput value={f.type} onChange={(v) => up("type", v)} options={DOC_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} /></Field>
        <Field label="Year" required error={err.year}><NumberInput value={f.year} onChange={(v) => up("year", v)} error={err.year} /></Field>
      </div>
      <Field label="Description"><TextArea value={f.desc} onChange={(v) => up("desc", v)} rows={2} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Linked people"><MultiSelect value={f.people} onChange={(v) => up("people", v)} options={data.people.map((p) => ({ value: p.id, label: fullName(p) }))} /></Field>
        <Field label="Linked events"><MultiSelect value={f.events} onChange={(v) => up("events", v)} options={data.events.map((e) => ({ value: e.id, label: e.title }))} /></Field>
      </div>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { DocumentForm };
