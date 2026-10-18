import { tr, formatDate } from "../../i18n/index.js";
import React, { useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { Modal } from "../../components/ui/Dialogs.jsx";
import { downloadArchive } from "../../lib/storage.js";
import { uid } from "../../utils/ids.js";
import { fullName } from "../../utils/people.js";
export function MemoryView() {
  const { data, actions } = useData();
  const [subjectKind, setKind] = useState("people"),
    [subjectId, setSubject] = useState(data.people[0]?.id || ""),
    [author, setAuthor] = useState(""),
    [text, setText] = useState(""),
    [kind, setMemoryKind] = useState("memory"),
    [replyTo, setReply] = useState(""),
    [error, setError] = useState(""),
    [invitation, setInvitation] = useState(null),
    [pending, setPending] = useState(null);
  const subject = invitation?.subject || {
    kind: subjectKind,
    id: subjectId,
    title:
      subjectKind === "people"
        ? fullName(
            data.people.find((p) => p.id === subjectId) || {
              first: "",
              last: "",
            },
          )
        : data[subjectKind].find((x) => x.id === subjectId)?.title || "",
  };
  const memories = (data.memories || []).filter(
    (m) => m.subjectKind === subject.kind && m.subjectId === subject.id,
  );
  const make = () => ({
    id: uid("memory"),
    subjectKind: subject.kind,
    subjectId: subject.id,
    author: author.trim(),
    text: text.trim(),
    kind,
    replyTo,
    createdAt: new Date().toISOString(),
  });
  function invite() {
    downloadArchive(
      {
        format: "family-atlas-invitation",
        version: 1,
        subject,
        instructions:
          "Open Family Atlas → Family memories → Open invitation. Write your memory, export the contribution file, and return it to the person who sent this invitation. Contributor names are self-reported.",
      },
      "family-memory-invitation.json",
    );
  }
  async function openFile(e) {
    setError("");
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024)
        throw new Error(tr("Contribution files must be under 2 MB."));
      const input = JSON.parse(await f.text());
      if (
        input.version !== 1 ||
        !["people", "documents", "events"].includes(input.subject?.kind) ||
        typeof input.subject.id !== "string" ||
        typeof input.subject.title !== "string"
      )
        throw new Error(tr("Invalid invitation or contribution subject."));
      if (input.format === "family-atlas-invitation") {
        setInvitation(input);
        setReply("");
      } else if (
        input.format === "family-atlas-contributions" &&
        Array.isArray(input.memories)
      ) {
        if (!data[input.subject.kind].some((x) => x.id === input.subject.id))
          throw new Error(
            tr("This contribution belongs to a subject that is not in this archive. Import the matching family archive first."),
          );
        if (
          input.memories.some(
            (m) =>
              !m ||
              typeof m !== "object" ||
              typeof m.id !== "string" ||
              typeof m.author !== "string" ||
              typeof m.text !== "string",
          )
        )
          throw new Error(tr("Invalid contribution entry."));
        setPending(input);
      } else
        throw new Error(
          tr("Choose a Family Atlas invitation or contribution file."),
        );
    } catch (err) {
      setError(err.message);
    }
    e.target.value = "";
  }
  async function submit(e) {
    e.preventDefault();
    if (!subject.id || !author.trim() || !text.trim()) return;
    const memory = make();
    if (invitation) {
      downloadArchive(
        {
          format: "family-atlas-contributions",
          version: 1,
          subject,
          memories: [memory],
        },
        "family-memory-contribution.json",
      );
      setText("");
      return;
    }
    if (await actions.save("memories", memory)) {
      setText("");
      setReply("");
    }
  }
  return (
    <FeaturePage
      title={tr("Family memories")}
      description={tr("Collect credited recollections, questions and corrections without overwriting anyone’s account.")}
      actions={
        <>
          <label className="file-button">{tr("Open invitation / contribution")}<input type="file" accept=".json" onChange={openFile} />
          </label>
          {!invitation && (
            <Btn disabled={!subject.id} onClick={invite}>{tr("Create invitation file")}</Btn>
          )}
        </>
      }
    >
      <ErrorNotice message={error} />
      <p className="feature-muted">{tr("Local-first collaboration: send files using a channel you choose. This app does not send invitations or sync accounts. Contributor names are self-reported, not verified identities.")}</p>
      {invitation ? (
        <Panel title={tr("Invited to remember: {{v0}}", {v0: subject.title})}>
          <p>{tr("Write a contribution below and return the downloaded file to the sender. No matching archive is needed to write a reply.")}</p>
          <Btn onClick={() => setInvitation(null)}>{tr("Return to my archive")}</Btn>
        </Panel>
      ) : (
        <div className="feature-grid">
          <label className="studio-field">{tr("Memory subject type")}<select
              value={subjectKind}
              onChange={(e) => {
                setKind(e.target.value);
                setSubject(data[e.target.value][0]?.id || "");
                setReply("");
              }}
            >
              <option value="people">{tr("Person")}</option>
              <option value="events">{tr("Event")}</option>
              <option value="documents">{tr("Photograph or document")}</option>
            </select>
          </label>
          <label className="studio-field">{tr("Memory subject")}<select
              value={subjectId}
              onChange={(e) => {
                setSubject(e.target.value);
                setReply("");
              }}
            >
              {data[subjectKind].map((r) => (
                <option key={r.id} value={r.id}>
                  {subjectKind === "people" ? fullName(r) : r.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="feature-grid">
        <Panel title={replyTo ? tr("Reply to a memory") : tr("Contribute a memory")}>
          <form className="studio-form" onSubmit={submit}>
            <label className="studio-field">{tr("Contributor name")}<input
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </label>
            <label className="studio-field">{tr("Contribution type")}<select
                value={kind}
                onChange={(e) => setMemoryKind(e.target.value)}
              >
                <option value="memory">{tr("Recollection")}</option>
                <option value="correction">{tr("Suggested correction")}</option>
                <option value="question">{tr("Question")}</option>
              </select>
            </label>
            <label className="studio-field">{tr("Your memory")}<textarea
                required
                rows={7}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            {replyTo && <Btn onClick={() => setReply("")}>{tr("Cancel reply")}</Btn>}
            <Btn type="submit" kind="primary" disabled={!subject.id}>
              {invitation
                ? tr("Export contribution for sender")
                : tr("Save contribution")}
            </Btn>
          </form>
        </Panel>
        <Panel title={tr("Collected memories")}>
          {memories.map((m) => (
            <article className="evidence-card" key={m.id}>
              <strong>{m.author}</strong>
              <small>
                {" "}
                · {tr(m.kind)} · {formatDate(m.createdAt)}
              </small>
              {m.replyTo && (
                <p className="feature-muted">{tr("Reply to")}{" "}
                  {memories.find((x) => x.id === m.replyTo)?.author ||
                    tr("an earlier contribution")}
                </p>
              )}
              <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
              {!invitation && (
                <div className="feature-actions">
                  <Btn small onClick={() => setReply(m.id)}>{tr("Reply")}</Btn>
                  <Btn
                    small
                    onClick={() => {
                      if (
                        window.confirm(
                          tr("Remove this contribution from your local archive?"),
                        )
                      )
                        actions.remove("memories", m.id);
                    }}
                  >{tr("Remove contribution")}</Btn>
                </div>
              )}
            </article>
          ))}
          {!memories.length && (
            <p>{tr("No memories collected for this subject yet.")}</p>
          )}
          {!!memories.length && (
            <Btn
              onClick={() =>
                downloadArchive(
                  {
                    format: "family-atlas-contributions",
                    version: 1,
                    subject,
                    memories,
                  },
                  "family-memory-contributions.json",
                )
              }
            >{tr("Export collected contributions")}</Btn>
          )}
        </Panel>
      </div>
      {pending && (
        <Modal
          title={tr("Review incoming contributions")}
          onClose={() => setPending(null)}
        >
          <p>
            {pending.memories.length}{tr(" entries for ")}{pending.subject.title}{tr(". New entries will be added. Existing IDs will be kept unchanged, including conflicting revisions; ask the author to submit a new correction instead.")}</p>
          <ul>
            {pending.memories.map((m, i) => (
              <li key={i}>
                {String(m.author || "Unknown").slice(0, 100)}:{" "}
                {String(m.text || "").slice(0, 140)}
              </li>
            ))}
          </ul>
          <Btn onClick={() => setPending(null)}>{tr("Cancel")}</Btn>
          <Btn
            kind="primary"
            onClick={async () => {
              const ok = await actions.mergeData((d) => {
                const known = new Set(d.memories.map((m) => m.id));
                const incoming = pending.memories.filter(
                  (m) => !known.has(m.id),
                );
                if (
                  incoming.some(
                    (m) =>
                      m.subjectId !== pending.subject.id ||
                      m.subjectKind !== pending.subject.kind,
                  )
                )
                  throw new Error(tr("A contribution does not match its subject."));
                return { ...d, memories: [...d.memories, ...incoming] };
              });
              if (ok) {
                setKind(pending.subject.kind);
                setSubject(pending.subject.id);
                setPending(null);
              }
            }}
          >{tr("Import new contributions")}</Btn>
        </Modal>
      )}
    </FeaturePage>
  );
}
