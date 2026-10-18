import { tr } from "../../i18n/index.js";
import React, { useState } from "react";
import { FileText } from "lucide-react";
import { C } from "../../config/theme.js";
import { DOC_ICON } from "../../config/eventTypes.js";
import { useData } from "../../state/DataContext.jsx";
import { Pill, Btn } from "../../components/ui/Primitives.jsx";
import { Modal } from "../../components/ui/Dialogs.jsx";
import {
  FeaturePage,
  Panel,
  CheckPeople,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import {
  MediaPreview,
  downloadMedia,
} from "../../components/media/MediaPreview.jsx";
import {
  storeFiles,
  exportMediaBundle,
  readMediaBundle,
  putMediaBatch,
} from "../../lib/media.js";
import { uid } from "../../utils/ids.js";

function DocumentEditor({ value, onClose }) {
  const { data, actions } = useData();
  const [draft, setDraft] = useState(
    value || {
      id: uid("doc"),
      title: "",
      type: "photo",
      year: new Date().getFullYear(),
      people: [],
      events: [],
      desc: "",
      caption: "",
      files: [],
    },
  );
  const [files, setFiles] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!draft.title.trim()) throw new Error(tr("Give the record a title."));
      const added = await storeFiles(files);
      const next = {
        ...draft,
        year: Number(draft.year),
        files: [
          ...new Map(
            [...(draft.files || []), ...added].map((file) => [file.id, file]),
          ).values(),
        ],
      };
      if (await actions.save("documents", next, value)) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={value ? tr("Edit archive record") : tr("Upload to archive")}
      wide
      onClose={onClose}
    >
      <form onSubmit={save} className="studio-form">
        <ErrorNotice message={error} />
        <label className="studio-field">{tr("Record title")}<input
            required
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <div className="feature-grid">
          <label className="studio-field">{tr("Record year")}<input
              required
              type="number"
              step="1"
              min="-9999"
              max="9999"
              value={draft.year}
              onChange={(e) => set("year", e.target.value)}
            />
          </label>
          <label className="studio-field">{tr("Record type")}<select
              value={draft.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {[
                "photo",
                "certificate",
                "record",
                "passport",
                "clipping",
                "letter",
                "audio",
                "video",
              ].map((t) => (
                <option key={t} value={t}>{tr(t)}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="studio-field">{tr("Caption")}<textarea
            value={draft.caption || ""}
            onChange={(e) => set("caption", e.target.value)}
          />
        </label>
        <label className="studio-field">{tr("Description / transcription")}<textarea
            value={draft.desc || ""}
            onChange={(e) => set("desc", e.target.value)}
          />
        </label>
        <CheckPeople value={draft.people} onChange={(v) => set("people", v)} />
        <label className="studio-field">{tr("Related events")}<select
            multiple
            size={4}
            value={draft.events}
            onChange={(e) =>
              set(
                "events",
                [...e.target.selectedOptions].map((o) => o.value),
              )
            }
          >
            {data.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.year} · {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="studio-field">{tr("Attachments")}<input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,text/plain,audio/*,video/mp4,video/webm,video/ogg"
            onChange={(e) => setFiles([...e.target.files])}
          />
        </label>
        <small>{tr("Up to 100 MB per file. Files stay in this browser; export a media ZIP for a complete backup.")}</small>
        {(draft.files || []).map((f) => (
          <div key={f.id} className="feature-row">
            <span>{f.name}</span>
            <Btn
              small
              onClick={() =>
                set(
                  "files",
                  draft.files.filter((x) => x.id !== f.id),
                )
              }
            >{tr("Detach file")}</Btn>
          </div>
        ))}
        <div className="feature-actions">
          <Btn onClick={onClose}>{tr("Cancel")}</Btn>
          <Btn type="submit" kind="primary" disabled={busy}>
            {busy ? tr("Storing files…") : tr("Save record")}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
function DocumentsView({ openPerson }) {
  const { data, getP, actions } = useData();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [editing, setEditing] = useState(undefined),
    [viewing, setViewing] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState(null);
  const docs = data.documents
    .filter(
      (d) =>
        (filter === "all" || d.type === filter) &&
        `${d.title} ${d.desc} ${d.caption || ""} ${d.people.map((id) => getP(id).first).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.year - b.year);
  async function bundle() {
    setBusy(true);
    setError("");
    try {
      await exportMediaBundle(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function importBundle(e) {
    setError("");
    try {
      if (e.target.files[0])
        setPending(await readMediaBundle(e.target.files[0]));
    } catch (err) {
      setError(err.message);
    }
    e.target.value = "";
  }
  return (
    <FeaturePage
      title={tr("Documents & Media")}
      description={tr("Photographs, records, letters and recordings, linked to people and events.")}
      actions={
        <>
          <Btn kind="primary" onClick={() => setEditing(null)}>{tr("Upload records")}</Btn>
          <Btn disabled={busy} onClick={bundle}>
            {busy ? tr("Packaging…") : tr("Export archive with media")}
          </Btn>
          <label className="file-button">{tr("Import media ZIP")}<input type="file" accept=".zip" onChange={importBundle} />
          </label>
        </>
      }
    >
      <ErrorNotice message={error} />
      <p className="feature-muted">{tr("Media stays in this browser. JSON contains metadata only; the ZIP includes the files. Detached files are retained for backup recovery.")}</p>
      <div className="feature-grid">
        <label className="studio-field">{tr("Search archive")}<input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("Title, caption, person or transcription")}
          />
        </label>
        <label className="studio-field">{tr("Media type")}<select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{tr("All records")}</option>
            {[
              "photo",
              "certificate",
              "record",
              "passport",
              "clipping",
              "letter",
              "audio",
              "video",
            ].map((t) => (
              <option key={t} value={t}>{tr(t)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="media-grid">
        {docs.map((d) => {
          const Icon = DOC_ICON[d.type] || FileText;
          return (
            <article key={d.id} className="fa-card archive-card">
              <div className="media-cover">
                {d.files?.[0] ? (
                  <MediaPreview file={d.files[0]} thumbnail />
                ) : (
                  <Icon size={30} color={C.rose} />
                )}
              </div>
              <div className="archive-card-body">
                <div className="feature-row">
                  <strong>{d.title}</strong>
                  <Pill>{d.year}</Pill>
                </div>
                <p>{d.caption || d.desc}</p>
                <div className="feature-actions">
                  {d.people.map((id) => (
                    <button
                      className="person-chip"
                      key={id}
                      onClick={() => openPerson(id)}
                    >
                      {getP(id).first}
                    </button>
                  ))}
                </div>
                <div className="feature-actions">
                  <Btn small onClick={() => setViewing(d)}>{tr("Open record")}</Btn>
                  <Btn small onClick={() => setEditing(d)}>{tr("Edit record")}</Btn>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!docs.length && (
        <Panel
          title={
            data.documents.length ? tr("No records match") : tr("No documents yet")
          }
        >
          <p>{tr("Upload your first photograph or clear the filters.")}</p>
        </Panel>
      )}
      {editing !== undefined && (
        <DocumentEditor value={editing} onClose={() => setEditing(undefined)} />
      )}{" "}
      {viewing && (
        <Modal title={viewing.title} wide onClose={() => setViewing(null)}>
          <p>{viewing.caption}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{viewing.desc}</p>
          {(viewing.files || []).map((f) => (
            <section key={f.id} className="media-attachment">
              <h3>{f.name}</h3>
              <MediaPreview file={f} />
              <Btn
                small
                onClick={() =>
                  downloadMedia(f).catch((e) => setError(e.message))
                }
              >{tr("Download attachment")}</Btn>
            </section>
          ))}
          {!viewing.files?.length && (
            <p>{tr("This is a metadata record. Edit it to attach a file.")}</p>
          )}
        </Modal>
      )}
      {pending && (
        <Modal
          title={tr("Replace archive and import media?")}
          onClose={() => setPending(null)}
        >
          <p>
            {pending.data.people.length}{tr(" people, ")}{pending.data.documents.length}{" "}{tr("records and ")}{pending.records.length}{tr(" files. Your previous archive metadata will be backed up first; its files remain in this browser.")}</p>
          <Btn onClick={() => setPending(null)}>{tr("Cancel")}</Btn>
          <Btn
            kind="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await putMediaBatch(pending.records);
                if (await actions.importData(pending.data)) setPending(null);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >{tr("Import complete archive")}</Btn>
        </Modal>
      )}
    </FeaturePage>
  );
}
export { DocumentsView };
