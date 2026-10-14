import React, { useState } from "react";
import { uid } from "../../../utils/ids.js";
import { TYPE } from "../../../config/eventTypes.js";
import { fullName } from "../../../utils/people.js";
import { useData } from "../../../state/DataContext.jsx";
import { Field, TextInput, NumberInput, TextArea, SelectInput, Toggle, MultiSelect } from "../../../components/ui/FormFields.jsx";
import { FormFooter } from "./FormFooter.jsx";

function EventForm({ value, onSave, onCancel }) {
  const { data } = useData();
  const init = value || { id: uid("e"), type: "milestone", title: "", year: "", at: data.locations[0]?.id || "", desc: "", people: [], docs: [], historical: false };
  const [f, setF] = useState(init); const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function save() {
    const e = {}; if (!f.title.trim()) e.title = "Required"; if (f.year === "" || isNaN(f.year)) e.year = "Year required"; if (!f.at) e.at = "Location required";
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...f, year: Number(f.year) });
  }
  return (
    <>
      <Field label="Event title" required error={err.title}><TextInput value={f.title} onChange={(v) => up("title", v)} error={err.title} placeholder="e.g. Emigration to Canada" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Type" required><SelectInput value={f.type} onChange={(v) => up("type", v)} options={Object.entries(TYPE).map(([k, m]) => ({ value: k, label: m.label }))} /></Field>
        <Field label="Year" required error={err.year}><NumberInput value={f.year} onChange={(v) => up("year", v)} error={err.year} placeholder="e.g. 1952" /></Field>
        <Field label="Location" required error={err.at}><SelectInput value={f.at} onChange={(v) => up("at", v)} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} placeholder="—" error={err.at} /></Field>
      </div>
      <Field label="Description"><TextArea value={f.desc} onChange={(v) => up("desc", v)} rows={2} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Related people"><MultiSelect value={f.people} onChange={(v) => up("people", v)} options={data.people.map((p) => ({ value: p.id, label: fullName(p) }))} /></Field>
        <Field label="Related documents"><MultiSelect value={f.docs} onChange={(v) => up("docs", v)} options={data.documents.map((d) => ({ value: d.id, label: d.title }))} /></Field>
      </div>
      <Field label="Historical context"><Toggle value={f.historical} onChange={(v) => up("historical", v)} label="Show as background historical context" /></Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { EventForm };
