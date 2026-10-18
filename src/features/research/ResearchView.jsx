import { tr } from "../../i18n/index.js";
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
    [field, setField] = useState(() => tr("Birth date")),
    [value, setValue] = useState(""),
    [documentId, setDocumentId] = useState(""),
    [page, setPage] = useState(""),
    [quote, setQuote] = useState(""),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState("unverified"),
    [question, setQuestion] = useState(""),
    [error, setError] = useState(""),
    [saving,setSaving] = useState(false);
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
      setError(tr("Add a person before recording evidence."));
      return;
    }
    if(saving)return;
    setSaving(true);
    try { if (
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
    } } finally {setSaving(false);}
  }
  return (
    <FeaturePage
      title={tr("Research & evidence")}
      description={tr("Keep citations, uncertainty and conflicting claims beside the people they describe.")}
    >
      <PersonPicker
        label={tr("Research person")}
        value={personId}
        onChange={setPersonId}
      />
      <ErrorNotice message={error} />
      {conflicts.length > 0 && (
        <Panel title={tr("Conflicting evidence")}>
          <p>{tr("These fields have different recorded values. None has automatically overwritten the person’s profile.")}</p>
          <ul>
            {conflicts.map((g) => (
              <li key={g[0].field}>
                {g[0].field}: {g.map((c) => c.value).join(tr(" versus "))}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <div className="feature-grid">
        <Panel title={tr("Record a claim and citation")}>
          <form className="studio-form" onSubmit={saveClaim}><fieldset disabled={saving} style={{border:0,padding:0,margin:0,minWidth:0}}>
            <label className="studio-field">{tr("Claim field")}<input
                required
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder={tr("Birth date, birthplace, occupation…")}
              />
            </label>
            <label className="studio-field">{tr("Claimed value")}<input
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="studio-field">{tr("Evidence status")}<select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="unverified">{tr("Unverified")}</option>
                <option value="supported">{tr("Supported by source")}</option>
                <option value="disputed">{tr("Disputed")}</option>
              </select>
            </label>
            <label className="studio-field">{tr("Source document")}<select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              >
                <option value="">{tr("No source attached yet")}</option>
                {data.documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field">{tr("Page / record locator")}<input
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder={tr("Page 3, line 12; archive reference…")}
              />
            </label>
            <label className="studio-field">{tr("Quoted evidence")}<textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
            </label>
            <label className="studio-field">{tr("Research notes")}<textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <Btn type="submit" kind="primary" disabled={saving}>{saving?tr("Saving evidence…"):tr("Save evidence")}</Btn></fieldset>
          </form>
        </Panel>
        <Panel title={tr("Recorded claims")}>
          {claims.map((c) => (
            <article className="evidence-card" key={c.id}>
              <div className="feature-row">
                <strong>
                  {c.field}: {c.value}
                </strong>
                <span className={`evidence-status ${tr(c.status)}`}>
                  {tr(c.status)}
                </span>
              </div>
              <p>
                {data.documents.find((d) => d.id === c.documentId)?.title ||
                  tr("No source")}{" "}
                {c.page && tr("· {{v0}}", {v0: c.page})}
              </p>
              {c.quote && <blockquote>{c.quote}</blockquote>}
              <p>{c.notes}</p>
              <div className="feature-actions">
                <label className="studio-field">{tr("Change evidence status")}<select
                    value={tr(c.status)}
                    onChange={(e) =>
                      actions.save(
                        "claims",
                        { ...c, status: e.target.value },
                        c,
                      )
                    }
                  >
                    <option value="unverified">{tr("Unverified")}</option>
                    <option value="supported">{tr("Supported")}</option>
                    <option value="disputed">{tr("Disputed")}</option>
                  </select>
                </label>
                <Btn
                  small
                  onClick={() => {
                    if (window.confirm(tr("Delete this evidence claim?")))
                      actions.remove("claims", c.id);
                  }}
                >{tr("Delete claim")}</Btn>
              </div>
            </article>
          ))}
          {!claims.length && (
            <p>{tr("No claims recorded for ")}{getP(personId).first}{tr(". Record evidence before deciding which profile facts to edit.")}</p>
          )}
          <Btn onClick={() => openPerson(personId)}>{tr("Open profile")}</Btn>
        </Panel>
      </div>
      <Panel title={tr("Research questions")}>
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
          <label className="studio-field grow">{tr("New research question")}<input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={tr("Which passenger manifest lists this family?")}
            />
          </label>
          <Btn type="submit">{tr("Add question")}</Btn>
        </form>
        {(data.researchTasks || [])
          .filter((t) => !t.personId || t.personId === personId)
          .map((t) => (
            <article key={t.id} className="evidence-card">
              <strong>{t.title}</strong>
              <p className="feature-muted">
                {t.personId ? fullName(getP(t.personId)) : tr("General research")}
              </p>
              <label className="studio-field">{tr("Question status")}<select
                  value={t.status}
                  onChange={(e) =>
                    actions.save(
                      "researchTasks",
                      { ...t, status: e.target.value },
                      t,
                    )
                  }
                >
                  <option value="open">{tr("Open")}</option>
                  <option value="in-progress">{tr("In progress")}</option>
                  <option value="done">{tr("Done")}</option>
                </select>
              </label>
              <label className="studio-field">{tr("Question notes")}<textarea
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
                  if (window.confirm(tr("Delete this research question?")))
                    actions.remove("researchTasks", t.id);
                }}
              >{tr("Delete question")}</Btn>
            </article>
          ))}
      </Panel>
    </FeaturePage>
  );
}
