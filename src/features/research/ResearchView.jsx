import React, { useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { uid } from "../../utils/ids.js";
import { fullName } from "../../utils/people.js";
export function ResearchView({ openPerson }) {
  const { data, getP, actions } = useData();
  const [personId, setPersonId] = useState(data.people[0]?.id || ""),
    [field, setField] = useState("Birth date"),
    [value, setValue] = useState(""),
    [documentId, setDocumentId] = useState(""),
    [page, setPage] = useState(""),
    [quote, setQuote] = useState(""),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState("unverified"),
    [question, setQuestion] = useState(""),
    [error, setError] = useState("");
  const claims = (data.claims || []).filter((c) => c.personId === personId);
  const groups = new Map();
  claims.forEach((c) => {
    const k = c.field.trim().toLowerCase();
    groups.set(k, [...(groups.get(k) || []), c]);
  });
  const conflicts = [...groups.values()].filter(
    (g) => new Set(g.map((c) => c.value.trim().toLowerCase())).size > 1,
  );
  async function saveClaim(e) {
    e.preventDefault();
    setError("");
    if (!personId) {
      setError("Add a person before recording evidence.");
      return;
    }
    if (
      await actions.save("claims", {
        id: uid("claim"),
        personId,
        field,
        value,
        documentId,
        page,
        quote,
        notes,
        status,
      })
    ) {
      setValue("");
      setQuote("");
      setNotes("");
    }
  }
  return (
    <FeaturePage
      title="Research & evidence"
      description="Keep citations, uncertainty and conflicting claims beside the people they describe."
    >
      <PersonPicker
        label="Research person"
        value={personId}
        onChange={setPersonId}
      />
      <ErrorNotice message={error} />
      {conflicts.length > 0 && (
        <Panel title="Conflicting evidence">
          <p>
            These fields have different recorded values. None has automatically
            overwritten the person’s profile.
          </p>
          <ul>
            {conflicts.map((g) => (
              <li key={g[0].field}>
                {g[0].field}: {g.map((c) => c.value).join(" versus ")}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <div className="feature-grid">
        <Panel title="Record a claim and citation">
          <form className="studio-form" onSubmit={saveClaim}>
            <label className="studio-field">
              Claim field
              <input
                required
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="Birth date, birthplace, occupation…"
              />
            </label>
            <label className="studio-field">
              Claimed value
              <input
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="studio-field">
              Evidence status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="unverified">Unverified</option>
                <option value="supported">Supported by source</option>
                <option value="disputed">Disputed</option>
              </select>
            </label>
            <label className="studio-field">
              Source document
              <select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              >
                <option value="">No source attached yet</option>
                {data.documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field">
              Page / record locator
              <input
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="Page 3, line 12; archive reference…"
              />
            </label>
            <label className="studio-field">
              Quoted evidence
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
            </label>
            <label className="studio-field">
              Research notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <Btn type="submit" kind="primary">
              Save evidence
            </Btn>
          </form>
        </Panel>
        <Panel title="Recorded claims">
          {claims.map((c) => (
            <article className="evidence-card" key={c.id}>
              <div className="feature-row">
                <strong>
                  {c.field}: {c.value}
                </strong>
                <span className={`evidence-status ${c.status}`}>
                  {c.status}
                </span>
              </div>
              <p>
                {data.documents.find((d) => d.id === c.documentId)?.title ||
                  "No source"}{" "}
                {c.page && `· ${c.page}`}
              </p>
              {c.quote && <blockquote>{c.quote}</blockquote>}
              <p>{c.notes}</p>
              <div className="feature-actions">
                <label className="studio-field">
                  Change evidence status
                  <select
                    value={c.status}
                    onChange={(e) =>
                      actions.save(
                        "claims",
                        { ...c, status: e.target.value },
                        c,
                      )
                    }
                  >
                    <option value="unverified">Unverified</option>
                    <option value="supported">Supported</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </label>
                <Btn
                  small
                  onClick={() => {
                    if (window.confirm("Delete this evidence claim?"))
                      actions.remove("claims", c.id);
                  }}
                >
                  Delete claim
                </Btn>
              </div>
            </article>
          ))}
          {!claims.length && (
            <p>
              No claims recorded for {getP(personId).first}. Record evidence
              before deciding which profile facts to edit.
            </p>
          )}
          <Btn onClick={() => openPerson(personId)}>Open profile</Btn>
        </Panel>
      </div>
      <Panel title="Research questions">
        <form
          className="feature-actions"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await actions.save("researchTasks", {
                id: uid("task"),
                personId,
                title: question,
                status: "open",
                notes: "",
              })
            )
              setQuestion("");
          }}
        >
          <label className="studio-field grow">
            New research question
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which passenger manifest lists this family?"
            />
          </label>
          <Btn type="submit">Add question</Btn>
        </form>
        {(data.researchTasks || [])
          .filter((t) => !t.personId || t.personId === personId)
          .map((t) => (
            <article key={t.id} className="evidence-card">
              <strong>{t.title}</strong>
              <p className="feature-muted">
                {t.personId ? fullName(getP(t.personId)) : "General research"}
              </p>
              <label className="studio-field">
                Question status
                <select
                  value={t.status}
                  onChange={(e) =>
                    actions.save(
                      "researchTasks",
                      { ...t, status: e.target.value },
                      t,
                    )
                  }
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className="studio-field">
                Question notes
                <textarea
                  defaultValue={t.notes}
                  onBlur={(e) => {
                    if (e.target.value !== t.notes)
                      actions.save(
                        "researchTasks",
                        { ...t, notes: e.target.value },
                        t,
                      );
                  }}
                />
              </label>
              <Btn
                small
                onClick={() => {
                  if (window.confirm("Delete this research question?"))
                    actions.remove("researchTasks", t.id);
                }}
              >
                Delete question
              </Btn>
            </article>
          ))}
      </Panel>
    </FeaturePage>
  );
}
