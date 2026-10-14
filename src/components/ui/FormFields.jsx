import React, { useState } from "react";
import { X } from "lucide-react";
import { C } from "../../config/theme.js";

function Field({ label, required, error, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase", color: error ? C.danger : C.sub, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.amber }}> *</span>}
      </div>
      {children}
      {hint && !error && <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{error}</div>}
    </label>
  );
}

const inputStyle = (err) => ({ width: "100%", background: C.panel2, border: `1px solid ${err ? C.danger : C.border}`, color: C.text, fontSize: 13.5, borderRadius: 9, padding: "9px 11px", outline: "none", fontFamily: "inherit" });

function TextInput({ value, onChange, placeholder, error }) {
  return <input className="fa-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle(error)} />;
}

function NumberInput({ value, onChange, placeholder, error }) {
  return <input className="fa-input" type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} placeholder={placeholder} style={inputStyle(error)} />;
}

function TextArea({ value, onChange, placeholder, error, rows = 3 }) {
  return <textarea className="fa-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle(error), resize: "vertical", lineHeight: 1.5 }} />;
}

function SelectInput({ value, onChange, options, error, placeholder }) {
  return (
    <select className="fa-input fa-select" value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(error), appearance: "none", cursor: "pointer" }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="fa-click" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "transparent", border: "none", padding: 0 }}>
      <span style={{ width: 40, height: 22, borderRadius: 999, background: value ? C.amber : C.panel2, border: `1px solid ${value ? C.amber : C.border}`, position: "relative", transition: "all .2s" }}>
        <span style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: value ? "#1a1206" : C.sub, transition: "all .2s" }} />
      </span>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
    </button>
  );
}

function MultiSelect({ value, onChange, options, placeholder = "Add…", error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sel = value || [];
  const filtered = options.filter((o) => !sel.includes(o.value) && o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(true)} style={{ ...inputStyle(error), minHeight: 40, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", cursor: "text", padding: "6px 8px" }}>
        {sel.map((id) => {
          const o = options.find((x) => x.value === id);
          return (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.panelSolid, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 4px 2px 9px", fontSize: 12, color: C.text }}>
              {o ? o.label : id}
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(sel.filter((x) => x !== id)); }} className="fa-click" style={{ background: "transparent", border: "none", color: C.sub, display: "flex", padding: 1 }}><X size={12} /></button>
            </span>
          );
        })}
        {sel.length === 0 && <span style={{ color: C.faint, fontSize: 13 }}>{placeholder}</span>}
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.panelSolid, border: `1px solid ${C.border}`, borderRadius: 11, padding: 6, zIndex: 41, maxHeight: 240, overflow: "auto", boxShadow: "0 14px 40px #000a" }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" style={{ ...inputStyle(false), marginBottom: 6 }} />
            {filtered.length === 0 && <div style={{ fontSize: 12, color: C.faint, padding: 8 }}>No matches.</div>}
            {filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange([...sel, o.value]); setQ(""); }} className="fa-click" style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "7px 8px", borderRadius: 7, color: C.text, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                {o.label}{o.sub && <span style={{ color: C.faint, fontSize: 11 }}>{o.sub}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- MODAL ---------------------------------- */

export { Field, inputStyle, TextInput, NumberInput, TextArea, SelectInput, Toggle, MultiSelect };
