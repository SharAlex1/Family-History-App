import { tr } from "../../../i18n/index.js";
import React, { useState } from "react";
import { isYear, yearError } from "../../../lib/archive.js";
import { uid } from "../../../utils/ids.js";
import { fullName } from "../../../utils/people.js";
import { useData } from "../../../state/DataContext.jsx";
import { Field, NumberInput, TextArea, SelectInput } from "../../../components/ui/FormFields.jsx";
import { FormFooter } from "./FormFooter.jsx";

function MigrationForm({ value, onSave, onCancel }) {
  const { data } = useData();
  const init = value || { id: uid("mig"), mode: "person", personId: data.people[0]?.id || "", branch: data.branches[0]?.id || "", from: data.locations[0]?.id || "", to: data.locations[1]?.id || data.locations[0]?.id || "", startYear: "", endYear: "", description: "" };
  const [f, setF] = useState(init); const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function save() {
    const e = {};
    if (f.mode === "person" && !f.personId) e.personId = tr("Pick a person");
    if (f.mode === "branch" && !f.branch) e.branch = tr("Pick a branch");
    if (!f.from) e.from = tr("Required"); if (!f.to) e.to = tr("Required");
    if (!isYear(f.startYear)) e.startYear = yearError;
    if (f.endYear !== "" && f.endYear != null && (!isYear(f.endYear) || Number(f.endYear) < Number(f.startYear))) e.endYear = tr("End year must be a whole year at or after the start.");
    if (f.from === f.to) e.to = tr("Origin and destination must differ");
    setErr(e); if (Object.keys(e).length) return;
    const branch = f.mode === "person" ? (data.people.find((p) => p.id === f.personId)?.branches?.[0] || "") : f.branch;
    onSave({ ...f, branch, startYear: Number(f.startYear), endYear: f.endYear === "" || f.endYear == null ? null : Number(f.endYear) });
  }
  return (
    <>
      <p style={{fontSize:12}}>{tr("Routes generated from residences update that residence when edited or deleted. Additional routes are separate historical records and do not change residences.")}</p>
      <Field label={tr("Applies to")}><SelectInput value={f.mode} onChange={(v) => up("mode", v)} options={[{ value: "person", label: tr("A single person") }, { value: "branch", label: tr("A whole branch") }]} /></Field>
      {f.mode === "person"
        ? <Field label={tr("Person")} required error={err.personId}><SelectInput value={f.personId} onChange={(v) => up("personId", v)} options={data.people.map((p) => ({ value: p.id, label: fullName(p) }))} error={err.personId} placeholder="—" /></Field>
        : <Field label={tr("Branch")} required error={err.branch}><SelectInput value={f.branch} onChange={(v) => up("branch", v)} options={data.branches.map((b) => ({ value: b.id, label: b.name }))} error={err.branch} placeholder="—" /></Field>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={tr("From")} required error={err.from}><SelectInput value={f.from} onChange={(v) => up("from", v)} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} error={err.from} placeholder="—" /></Field>
        <Field label={tr("To")} required error={err.to}><SelectInput value={f.to} onChange={(v) => up("to", v)} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} error={err.to} placeholder="—" /></Field>
        <Field label={tr("Start year")} required error={err.startYear}><NumberInput value={f.startYear} onChange={(v) => up("startYear", v)} error={err.startYear} /></Field>
        <Field label={tr("End year (optional)")} error={err.endYear}><NumberInput value={f.endYear} onChange={(v) => up("endYear", v)} placeholder="—" /></Field>
      </div>
      <Field label={tr("Description")}><TextArea value={f.description} onChange={(v) => up("description", v)} rows={2} /></Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { MigrationForm };
