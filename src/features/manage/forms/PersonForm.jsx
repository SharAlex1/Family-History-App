import React, { useState } from "react";
import { uid } from "../../../utils/ids.js";
import { fullName } from "../../../utils/people.js";
import { useData } from "../../../state/DataContext.jsx";
import { Field, TextInput, NumberInput, TextArea, SelectInput, MultiSelect } from "../../../components/ui/FormFields.jsx";
import { ResidenceEditor } from "../../../components/people/ResidenceEditor.jsx";
import { FormFooter } from "./FormFooter.jsx";

function PersonForm({ value, onSave, onCancel }) {
  const { data, getL } = useData();
  const base = value || { id: uid("p"), first: "", last: "", gender: "", branches: [], birth: "", death: "", born: data.locations[0]?.id || "", avatar: "", bio: "", parents: [], spouses: [], children: [], residences: [] };
  const init = { ...base, branches: Array.isArray(base.branches) ? base.branches : (base.branch ? [base.branch] : []) };
  const [f, setF] = useState(init);
  const [linkedEvents, setLinkedEvents] = useState((data.events.filter((e) => (e.people || []).includes(init.id))).map((e) => e.id));
  const [linkedDocs, setLinkedDocs] = useState((data.documents.filter((d) => (d.people || []).includes(init.id))).map((d) => d.id));
  const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const peopleOpts = data.people.filter((p) => p.id !== f.id).map((p) => ({ value: p.id, label: fullName(p), sub: String(p.birth) }));
  function save() {
    const e = {};
    if (!f.first.trim()) e.first = "Required";
    if (!f.last.trim()) e.last = "Required";
    if (f.birth === "" || isNaN(f.birth)) e.birth = "Birth year required";
    if (f.death !== "" && f.death !== null && Number(f.death) < Number(f.birth)) e.death = "Death precedes birth";
    setErr(e);
    if (Object.keys(e).length) return;
    const { branch: _legacyBranch, ...rest } = f;
    const person = { ...rest, branches: f.branches || [], birth: Number(f.birth), death: f.death === "" || f.death === null ? null : Number(f.death), residences: (f.residences || []).filter((r) => r.at).map((r) => ({ at: r.at, from: Number(r.from) || Number(f.birth) })) };
    onSave({ person, linkedEventIds: linkedEvents, linkedDocIds: linkedDocs });
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="First name" required error={err.first}><TextInput value={f.first} onChange={(v) => up("first", v)} error={err.first} /></Field>
        <Field label="Last name" required error={err.last}><TextInput value={f.last} onChange={(v) => up("last", v)} error={err.last} /></Field>
        <Field label="Birth year" required error={err.birth}><NumberInput value={f.birth} onChange={(v) => up("birth", v)} error={err.birth} placeholder="e.g. 1925" /></Field>
        <Field label="Death year" error={err.death} hint="Leave blank if living"><NumberInput value={f.death} onChange={(v) => up("death", v)} error={err.death} placeholder="—" /></Field>
        <Field label="Gender (optional)"><SelectInput value={f.gender} onChange={(v) => up("gender", v)} options={[{ value: "", label: "Unspecified" }, { value: "f", label: "Female" }, { value: "m", label: "Male" }, { value: "x", label: "Other" }]} /></Field>
        <Field label="Branches / family lines" hint="A person can belong to more than one"><MultiSelect value={f.branches} onChange={(v) => up("branches", v)} options={data.branches.map((b) => ({ value: b.id, label: b.name }))} placeholder="Assign branches…" /></Field>
        <Field label="Birthplace"><SelectInput value={f.born} onChange={(v) => up("born", v)} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} placeholder="—" /></Field>
        <Field label="Avatar / photo placeholder" hint="Initials are used automatically"><TextInput value={f.avatar} onChange={(v) => up("avatar", v)} placeholder="(optional note or URL)" /></Field>
      </div>
      <Field label="Biography"><TextArea value={f.bio} onChange={(v) => up("bio", v)} rows={3} placeholder="A short life summary…" /></Field>
      <Field label="Residences" hint="Each place this person lived, and the year they arrived — drives the map"><ResidenceEditor value={f.residences} onChange={(v) => up("residences", v)} locations={data.locations} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Parents"><MultiSelect value={f.parents} onChange={(v) => up("parents", v)} options={peopleOpts} /></Field>
        <Field label="Spouses"><MultiSelect value={f.spouses} onChange={(v) => up("spouses", v)} options={peopleOpts} /></Field>
        <Field label="Children"><MultiSelect value={f.children} onChange={(v) => up("children", v)} options={peopleOpts} /></Field>
        <Field label="Linked events"><MultiSelect value={linkedEvents} onChange={setLinkedEvents} options={data.events.map((e) => ({ value: e.id, label: e.title, sub: String(e.year) }))} /></Field>
      </div>
      <Field label="Linked documents"><MultiSelect value={linkedDocs} onChange={setLinkedDocs} options={data.documents.map((d) => ({ value: d.id, label: d.title, sub: String(d.year) }))} /></Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { PersonForm };
