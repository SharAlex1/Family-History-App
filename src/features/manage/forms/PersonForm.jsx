import { tr } from "../../../i18n/index.js";
import React, { useState, useRef } from "react";
import { parseFamilyDate } from "../../../lib/dates.js";
import { isYear, yearError } from "../../../lib/archive.js";
import { uid } from "../../../utils/ids.js";
import { fullName } from "../../../utils/people.js";
import { useData } from "../../../state/DataContext.jsx";
import { Field, TextInput, NumberInput, TextArea, SelectInput, MultiSelect, Toggle } from "../../../components/ui/FormFields.jsx";
import { ResidenceEditor } from "../../../components/people/ResidenceEditor.jsx";
import { FormFooter } from "./FormFooter.jsx";

function PersonForm({ value, onSave, onCancel }) {
  const { data, getL } = useData();
  const base = value || { id: uid("p"), first: "", last: "", gender: "", branches: [], birth: "", death: "", born: data.locations[0]?.id || "", avatar: "", bio: "", parents: [], spouses: [], children: [], residences: [] };
  const init = { ...base, branches: Array.isArray(base.branches) ? base.branches : (base.branch ? [base.branch] : []) };
  const original = useRef(value);
  const [f, setF] = useState(init);
  const [linkedEvents, setLinkedEvents] = useState((data.events.filter((e) => (e.people || []).includes(init.id))).map((e) => e.id));
  const [linkedDocs, setLinkedDocs] = useState((data.documents.filter((d) => (d.people || []).includes(init.id))).map((d) => d.id));
  const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const peopleOpts = data.people.filter((p) => p.id !== f.id).map((p) => ({ value: p.id, label: fullName(p), sub: String(p.birth) }));
  function save() {
    const e = {};
    if (!f.first.trim()) e.first = tr("Required");
    if (!f.last.trim()) e.last = tr("Required");
    if (f.birth !== "" && f.birth != null && !isYear(f.birth)) e.birth = yearError;
    if (f.death !== "" && f.death !== null && !isYear(f.death)) e.death = yearError;
    if (f.residences.some(r => !r.at || !isYear(r.from) || (f.birth !== "" && f.birth != null && r.from < Number(f.birth)) || (f.death !== "" && f.death != null && r.from > Number(f.death)))) e.residences = tr("Every residence needs a location and a whole year within this person’s lifetime.");
    if (f.death !== "" && f.death !== null && f.birth !== "" && f.birth != null && Number(f.death) < Number(f.birth)) e.death = tr("Death precedes birth");
    for(const kind of ['birth','death']) if(f[`${kind}Date`]){try{const parsed=parseFamilyDate(f[`${kind}Date`]);if(parsed.year!==Number(f[kind]))e[kind]=tr("{{v0}} date and year must agree", {v0: kind});}catch(error){e[kind]=error.message;}}
    setErr(e);
    if (Object.keys(e).length) return;
    const { branch: _legacyBranch, ...rest } = f;
    const person = { ...rest, branches: f.branches || [], birth: f.birth === "" || f.birth == null ? null : Number(f.birth), death: f.death === "" || f.death === null ? null : Number(f.death), residences: (f.residences || []).filter((r) => r.at).map((r) => ({ at: r.at, from: Number(r.from) })) };
    onSave({ person, original: original.current, linkedEventIds: linkedEvents, linkedDocIds: linkedDocs });
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={tr("First name")} required error={err.first}><TextInput value={f.first} onChange={(v) => up("first", v)} error={err.first} /></Field>
        <Field label={tr("Last name")} required error={err.last}><TextInput value={f.last} onChange={(v) => up("last", v)} error={err.last} /></Field>
        <Field label={tr("Birth year")} hint={tr("Leave blank if unknown")} error={err.birth}><NumberInput value={f.birth} onChange={(v) => up("birth", v)} error={err.birth} placeholder={tr("e.g. 1925")} /></Field>
        <Field label={tr("Death year")} error={err.death} hint={tr("Leave blank if living or the death year is unknown")}><NumberInput value={f.death} onChange={(v) => up("death", v)} error={err.death} placeholder="—" /></Field>
        <Field label={tr("Gender (optional)")}><SelectInput value={f.gender} onChange={(v) => up("gender", v)} options={[{ value: "", label: tr("Unspecified") }, { value: "f", label: tr("Female") }, { value: "m", label: tr("Male") }, { value: "x", label: tr("Other") }]} /></Field>
        <Field label={tr("Branches / family lines")} hint={tr("A person can belong to more than one")}><MultiSelect value={f.branches} onChange={(v) => up("branches", v)} options={data.branches.map((b) => ({ value: b.id, label: b.name }))} placeholder={tr("Assign branches…")} /></Field>
        <Field label={tr("Birthplace")}><SelectInput value={f.born} onChange={(v) => up("born", v)} options={data.locations.map((l) => ({ value: l.id, label: l.name }))} placeholder="—" /></Field>
        <Field label={tr("Avatar / photo placeholder")} hint={tr("Initials are used automatically")}><TextInput value={f.avatar} onChange={(v) => up("avatar", v)} placeholder={tr("(optional note or URL)")} /></Field>
      </div>
      <div className="feature-grid"><Field label={tr("Birth date (optional)")}><TextInput value={f.birthDate || ''} onChange={v=>{up('birthDate',v);try{const d=parseFamilyDate(v);if(d.year!=null)up('birth',d.year);}catch{/* validation is shown on save */}}} placeholder={tr("1900-05-12 or ABT 1900")}/></Field><Field label={tr("Death date (optional)")}><TextInput value={f.deathDate || ''} onChange={v=>{up('deathDate',v);try{const d=parseFamilyDate(v);if(d.year!=null)up('death',d.year);}catch{/* validation is shown on save */}}} placeholder={tr("1970-03-08 or BEF 1970")}/></Field><Field label={tr("Profile photograph")}><SelectInput value={f.photoFileId||''} onChange={v=>up('photoFileId',v)} placeholder={tr("Use initials")} options={data.documents.flatMap(doc=>(doc.files||[]).filter(file=>file.type.startsWith('image/')).map(file=>({value:file.id,label:tr("{{v0}}: {{v1}}", {v0: doc.title, v1: file.name})})))}/></Field></div>
      <Field label={tr("Life status")} hint={tr("Use when death is recorded but its year is unknown.")}><Toggle label={tr("Death recorded without a known date")} value={Boolean(f.deceased)} onChange={v=>up("deceased",v)} /></Field>
      <Field label={tr("Biography")}><TextArea value={f.bio} onChange={(v) => up("bio", v)} rows={3} placeholder={tr("A short life summary…")} /></Field>
      <Field label={tr("Residences")} error={err.residences} hint={tr("Each place this person lived, and the year they arrived — drives the map")}><ResidenceEditor defaultYear={f.birth} value={f.residences} onChange={(v) => up("residences", v)} locations={data.locations} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={tr("Parents")}><MultiSelect value={f.parents} onChange={(v) => up("parents", v)} options={peopleOpts} /></Field>
        <Field label={tr("Spouses")}><MultiSelect value={f.spouses} onChange={(v) => up("spouses", v)} options={peopleOpts} /></Field>
        <Field label={tr("Children")}><MultiSelect value={f.children} onChange={(v) => up("children", v)} options={peopleOpts} /></Field>
        <Field label={tr("Linked events")}><MultiSelect value={linkedEvents} onChange={setLinkedEvents} options={data.events.map((e) => ({ value: e.id, label: e.title, sub: String(e.year) }))} /></Field>
      </div>
      <Field label={tr("Linked documents")}><MultiSelect value={linkedDocs} onChange={setLinkedDocs} options={data.documents.map((d) => ({ value: d.id, label: d.title, sub: String(d.year) }))} /></Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { PersonForm };
