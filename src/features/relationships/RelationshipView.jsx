import React, { useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
} from "../../components/ui/FeatureUI.jsx";
import { findRelationship } from "../../lib/relationships.js";
import { fullName } from "../../utils/people.js";
export function RelationshipView({ openPerson }) {
  const { data, getP } = useData();
  const [from, setFrom] = useState(data.people[0]?.id || ""),
    [to, setTo] = useState(data.people[1]?.id || "");
  const result = findRelationship(data.people, from, to);
  return (
    <FeaturePage
      title="Relationship finder"
      description="Find the connecting path and shared ancestors between two relatives."
    >
      <div className="feature-grid">
        <PersonPicker label="From person" value={from} onChange={setFrom} />
        <PersonPicker label="To person" value={to} onChange={setTo} />
      </div>
      <Panel title={result.label}>
        <p>
          {getP(to).first} is related to {getP(from).first} as shown above.
        </p>
        <p className="feature-muted">{result.basis}</p>
        <ol className="relationship-path">
          {result.path.map((node) => (
            <li key={node.id}>
              <small>{node.label}</small>
              <button
                className="person-chip"
                onClick={() => openPerson(node.id)}
              >
                {fullName(getP(node.id))}
              </button>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Shared recorded ancestors">
        {result.common.length ? (
          <ul>
            {result.common.map((a) => (
              <li key={a.id}>
                <button className="text-link" onClick={() => openPerson(a.id)}>
                  {fullName(getP(a.id))}
                </button>{" "}
                — {a.from} generation(s) from the first person, {a.to} from the
                second
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No shared ancestor is recorded. That does not prove there is none.
          </p>
        )}
      </Panel>
    </FeaturePage>
  );
}
