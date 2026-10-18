import { tr } from "../../i18n/index.js";
import React from "react";
import { useData } from "../../state/DataContext.jsx";
import { fullName } from "../../utils/people.js";
export function FeaturePage({ title, description, children, actions }) {
  return (
    <section className="feature-page">
      <div className="feature-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="feature-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
export function Panel({ title, children, ...props }) {
  return (
    <section className="studio-panel" {...props}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
export function PersonPicker({
  value,
  onChange,
  label = tr("Person"),
  optional = false,
}) {
  const { data } = useData();
  return (
    <label className="studio-field">
      {tr(label)}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {optional && <option value="">{tr("All / unspecified")}</option>}
        {data.people.map((p) => (
          <option key={p.id} value={p.id}>
            {fullName(p)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ErrorNotice({ message }) {
  return message ? (
    <p role="alert" className="feature-error">
      {tr(message)}
    </p>
  ) : null;
}
export function CheckPeople({ value, onChange, label = tr("People tagged") }) {
  const { data } = useData();
  return (
    <label className="studio-field">
      {tr(label)}
      <select
        multiple
        size={Math.min(5, Math.max(2, data.people.length))}
        value={value}
        onChange={(e) =>
          onChange([...e.target.selectedOptions].map((o) => o.value))
        }
      >
        {data.people.map((p) => (
          <option key={p.id} value={p.id}>
            {fullName(p)}
          </option>
        ))}
      </select>
      <small>{tr("Use Ctrl/Command or Shift to select multiple people.")}</small>
    </label>
  );
}
