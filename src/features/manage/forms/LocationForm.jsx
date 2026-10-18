import { tr } from "../../../i18n/index.js";
import React, { useState } from "react";
import { uid } from "../../../utils/ids.js";
import { Field, TextInput, NumberInput, TextArea } from "../../../components/ui/FormFields.jsx";
import { MiniMapPicker } from "../../../components/maps/MiniMapPicker.jsx";
import { FormFooter } from "./FormFooter.jsx";

function LocationForm({ value, onSave, onCancel }) {
  const init = value || { id: uid("loc"), name: "", region: "", lat: "", lng: "", x: 500, y: 280, desc: "" };
  const [f, setF] = useState(init); const [err, setErr] = useState({});
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function save() {
    const e = {}; if (!f.name.trim()) e.name = tr("Required");
    if (typeof f.x !== "number" || typeof f.y !== "number") e.x = tr("Pick a map position");
    const lat = f.lat === "" || f.lat == null ? null : Number(f.lat), lng = f.lng === "" || f.lng == null ? null : Number(f.lng);
    if ((lat === null) !== (lng === null) || (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180))) e.coords = tr("Supply both coordinates: latitude -90 to 90, longitude -180 to 180.");
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...f, lat, lng, unmapped: f.unmapped ? lat == null : false });
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label={tr("Location name")} required error={err.name}><TextInput value={f.name} onChange={(v) => up("name", v)} error={err.name} placeholder={tr("e.g. Lisbon")} /></Field>
        <Field label={tr("Country / region")}><TextInput value={f.region} onChange={(v) => up("region", v)} placeholder={tr("e.g. Portugal")} /></Field>
        <Field label={tr("Latitude (optional)")} error={err.coords}><NumberInput value={f.lat} onChange={(v) => up("lat", v)} placeholder={tr("e.g. 38.7")} /></Field>
        <Field label={tr("Longitude (optional)")}><NumberInput value={f.lng} onChange={(v) => up("lng", v)} placeholder={tr("e.g. -9.1")} /></Field>
      </div>
      <Field label={tr("Map position")} required error={err.x} hint={tr("Click the map to place this location's pin")}><MiniMapPicker x={f.x} y={f.y} lat={f.lat === "" || f.lat == null ? null : Number(f.lat)} lng={f.lng === "" || f.lng == null ? null : Number(f.lng)} onPick={(x, y, ll) => setF((s) => ({ ...s, x, y, unmapped: false, ...(ll ? { lat: Number(ll.lat.toFixed(4)), lng: Number(ll.lng.toFixed(4)) } : {}) }))} /></Field>
      <Field label={tr("Description")}><TextArea value={f.desc} onChange={(v) => up("desc", v)} rows={2} /></Field>
      <FormFooter onCancel={onCancel} onSave={save} />
    </>
  );
}


export { LocationForm };
