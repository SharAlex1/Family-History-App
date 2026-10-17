import React, { useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  CheckPeople,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { biography, bookHtml } from "../../lib/stories.js";
import { downloadBlob } from "../../lib/media.js";
import { uid } from "../../utils/ids.js";
export function StoriesView() {
  const { data, actions } = useData();
  const [people, setPeople] = useState(
      data.people[0] ? [data.people[0].id] : [],
    ),
    [title, setTitle] = useState("Our family story"),
    [narrative, setNarrative] = useState(() =>
      biography(data, data.people[0]?.id),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function output(print) {
    setError("");
    let popup;
    if (print) {
      popup = window.open("", "_blank");
      if (!popup) {
        setError("Allow a print window to save the book as PDF.");
        return;
      }
    }
    setBusy(true);
    try {
      const html = await bookHtml(data, people, title, narrative);
      if (print) {
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
        await Promise.all(
          [...popup.document.images].map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                }),
          ),
        );
        popup.focus();
        popup.print();
      } else
        downloadBlob(
          new Blob([html], { type: "text/html" }),
          "family-history-book.html",
        );
    } catch (e) {
      popup?.close();
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FeaturePage
      title="Life stories & family books"
      description="Generate factual drafts, edit the narrative, and produce an illustrated book with maps, timelines and citations."
    >
      <ErrorNotice message={error} />
      <div className="feature-grid">
        <Panel title="Book editor">
          <label className="studio-field">
            Book title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <CheckPeople
            label="People in this book"
            value={people}
            onChange={setPeople}
          />
          <Btn
            disabled={!people.length}
            onClick={() => {
              if (
                !narrative ||
                window.confirm(
                  "Replace the edited narrative with a new draft from the selected records?",
                )
              )
                setNarrative(
                  people
                    .map((id) => biography(data, id))
                    .join("\n\n──────────\n\n"),
                );
            }}
          >
            Generate draft from records
          </Btn>
          <label className="studio-field">
            Editable narrative
            <textarea
              rows={16}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
          </label>
          <p className="feature-muted">
            Drafts use recorded facts, without an AI service or invented
            details. Review sources and edit uncertain statements. Photographs
            must be available in this browser to appear in the book.
          </p>
          <div className="feature-actions">
            <Btn
              disabled={busy || !people.length || !title.trim()}
              kind="primary"
              onClick={() => output(true)}
            >
              Print / Save as PDF
            </Btn>
            <Btn
              disabled={busy || !people.length}
              onClick={() => output(false)}
            >
              Download illustrated book
            </Btn>
            <Btn
              disabled={!title.trim() || !people.length}
              onClick={() =>
                actions.save("books", {
                  id: uid("book"),
                  title,
                  people,
                  narrative,
                  createdAt: new Date().toISOString(),
                })
              }
            >
              Save book draft
            </Btn>
          </div>
        </Panel>
        <Panel title="Saved drafts">
          {(data.books || []).map((b) => (
            <article className="evidence-card" key={b.id}>
              <h4>{b.title}</h4>
              <p>
                {b.people.length} people ·{" "}
                {new Date(b.createdAt).toLocaleDateString()}
              </p>
              <div className="feature-actions">
                <Btn
                  small
                  onClick={() => {
                    setPeople(b.people);
                    setTitle(b.title);
                    setNarrative(b.narrative);
                  }}
                >
                  Open draft
                </Btn>
                <Btn
                  small
                  onClick={() => {
                    if (window.confirm("Delete this saved book draft?"))
                      actions.remove("books", b.id);
                  }}
                >
                  Delete draft
                </Btn>
              </div>
            </article>
          ))}
          <p className="feature-muted">
            The print window lets you choose your printer or your browser’s Save
            as PDF destination. The HTML download includes available photos and
            works offline.
          </p>
        </Panel>
      </div>
    </FeaturePage>
  );
}
