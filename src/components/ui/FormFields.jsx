import React, { useState, useId, useRef } from "react";
import { X } from "lucide-react";
import { C } from "../../config/theme.js";

function Field({ label, required, error, hint, children }) {
  const id = useId();
  return (
    <div
      className="fa-field"
      role="group"
      aria-labelledby={`${id}-label`}
      style={{ display: "block", marginBottom: 14 }}
    >
      <div
        id={`${id}-label`}
        style={{
          fontSize: 11.5,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: error ? C.danger : C.sub,
          marginBottom: 6,
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: C.amber }}>
            {" "}
            *
          </span>
        )}
      </div>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
            "aria-labelledby": `${id}-label`,
            "aria-describedby": hint || error ? `${id}-help` : undefined,
            "aria-invalid": Boolean(error),
          })
        : children}
      {(hint || error) && (
        <div
          id={`${id}-help`}
          role={error ? "alert" : undefined}
          style={{
            fontSize: 11,
            color: error ? C.danger : C.faint,
            marginTop: 4,
          }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
}
const inputStyle = (err) => ({
  width: "100%",
  background: C.panel2,
  border: `1px solid ${err ? C.danger : C.border}`,
  color: C.text,
  fontSize: 13.5,
  borderRadius: 9,
  padding: "9px 11px",
  outline: "none",
  fontFamily: "inherit",
});
function TextInput({ value, onChange, placeholder, error, ...props }) {
  return (
    <input
      {...props}
      className="fa-input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle(error)}
    />
  );
}
function NumberInput({ value, onChange, placeholder, error, ...props }) {
  return (
    <input
      {...props}
      className="fa-input"
      type="number"
      step="any"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? "" : Number(e.target.value))
      }
      placeholder={placeholder}
      style={inputStyle(error)}
    />
  );
}
function TextArea({ value, onChange, placeholder, error, rows = 3, ...props }) {
  return (
    <textarea
      {...props}
      className="fa-input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle(error), resize: "vertical", lineHeight: 1.5 }}
    />
  );
}
function SelectInput({
  value,
  onChange,
  options,
  error,
  placeholder,
  ...props
}) {
  return (
    <select
      {...props}
      className="fa-input fa-select"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle(error), cursor: "pointer" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
function Toggle({ value, onChange, label, ...props }) {
  return (
    <button
      {...props}
      aria-label={label}
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="fa-click"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        background: "transparent",
        border: "none",
        padding: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          background: value ? C.amber : C.panel2,
          border: `1px solid ${value ? C.amber : C.border}`,
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 20 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: value ? "#1a1206" : C.sub,
          }}
        />
      </span>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
    </button>
  );
}
function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Add…",
  error,
  id: providedId,
  ...props
}) {
  const generated = useId(),
    id = providedId || generated;
  const [open, setOpen] = useState(false),
    [q, setQ] = useState("");
  const opener = useRef(null),
    list = useRef(null),
    searchInput = useRef(null);
  const sel = value || [],
    filtered = options.filter(
      (o) =>
        !sel.includes(o.value) &&
        o.label.toLowerCase().includes(q.toLowerCase()),
    );
  const close = () => {
    setOpen(false);
    setQ("");
    opener.current?.focus();
  };
  const move = (event, offset) => {
    event.preventDefault();
    const opts = [...(list.current?.querySelectorAll("[role=option]") || [])];
    if (!opts.length) return;
    const index = opts.indexOf(document.activeElement);
    opts[(index + offset + opts.length) % opts.length]?.focus();
  };
  return (
    <div
      style={{ position: "relative" }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <div
        onClick={() => setOpen(true)}
        style={{
          ...inputStyle(error),
          minHeight: 40,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          padding: "6px 8px",
        }}
      >
        {sel.map((selected) => {
          const option = options.find((o) => o.value === selected);
          return (
            <span
              key={selected}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: C.panelSolid,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                padding: "2px 4px 2px 9px",
                fontSize: 12,
                color: C.text,
              }}
            >
              {option?.label || selected}
              <button
                type="button"
                aria-label={`Remove ${option?.label || selected}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(sel.filter((x) => x !== selected));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.sub,
                  display: "flex",
                  padding: 1,
                }}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <button
          {...props}
          id={id}
          ref={opener}
          type="button"
          aria-haspopup="listbox"
          aria-controls={`${id}-list`}
          aria-expanded={open}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          onClick={() => setOpen(true)}
          style={{
            background: "transparent",
            border: "none",
            color: C.sub,
            fontSize: 13,
            padding: 2,
            textAlign: "left",
            flex: 1,
          }}
        >
          {sel.length ? "Add…" : placeholder}
        </button>
      </div>
      {open && (
        <>
          <div
            onClick={close}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: C.panelSolid,
              border: `1px solid ${C.border}`,
              borderRadius: 11,
              padding: 6,
              zIndex: 41,
              maxHeight: 240,
              overflow: "auto",
              boxShadow: "0 14px 40px #000a",
            }}
          >
            <input
              ref={searchInput}
              autoFocus
              role="combobox"
              aria-label="Search choices"
              aria-controls={`${id}-list`}
              aria-expanded="true"
              aria-autocomplete="list"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") move(e, 1);
                if (e.key === "ArrowUp") move(e, -1);
              }}
              placeholder="Search…"
              style={{ ...inputStyle(false), marginBottom: 6 }}
            />
            <div
              ref={list}
              id={`${id}-list`}
              role="listbox"
              aria-label="Available choices"
              aria-multiselectable="true"
            >
              {filtered.length === 0 && (
                <div
                  role="status"
                  style={{ fontSize: 12, color: C.sub, padding: 8 }}
                >
                  No matches.
                </div>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") move(e, 1);
                    if (e.key === "ArrowUp") move(e, -1);
                  }}
                  onClick={() => {
                    onChange([...sel, o.value]);
                    setQ("");
                    searchInput.current?.focus();
                  }}
                  className="fa-click"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: "7px 8px",
                    borderRadius: 7,
                    color: C.text,
                    fontSize: 13,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  {o.label}
                  {o.sub && (
                    <span style={{ color: C.sub, fontSize: 11 }}>{o.sub}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export {
  Field,
  inputStyle,
  TextInput,
  NumberInput,
  TextArea,
  SelectInput,
  Toggle,
  MultiSelect,
};
