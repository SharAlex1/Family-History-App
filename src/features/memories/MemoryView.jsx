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
        throw new Error("Contribution files must be under 2 MB.");
      const input = JSON.parse(await f.text());
      if (
        input.version !== 1 ||
        !["people", "documents", "events"].includes(input.subject?.kind) ||
        typeof input.subject.id !== "string" ||
        typeof input.subject.title !== "string"
      )
        throw new Error("Invalid invitation or contribution subject.");
      if (input.format === "family-atlas-invitation") {
        setInvitation(input);
        setReply("");
      } else if (
        input.format === "family-atlas-contributions" &&
        Array.isArray(input.memories)
      ) {
        if (!data[input.subject.kind].some((x) => x.id === input.subject.id))
          throw new Error(
            "This contribution belongs to a subject that is not in this archive. Import the matching family archive first.",
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
          throw new Error("Invalid contribution entry.");
        setPending(input);
      } else
        throw new Error(
          "Choose a Family Atlas invitation or contribution file.",
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
      title="Family memories"
      description="Collect credited recollections, questions and corrections without overwriting anyone’s account."
      actions={
        <>
          <label className="file-button">
            Open invitation / contribution
            <input type="file" accept=".json" onChange={openFile} />
          </label>
          {!invitation && (
            <Btn disabled={!subject.id} onClick={invite}>
              Create invitation file
            </Btn>
          )}
        </>
      }
    >
      <ErrorNotice message={error} />
      <p className="feature-muted">
        Local-first collaboration: send files using a channel you choose. This
        app does not send invitations or sync accounts. Contributor names are
        self-reported, not verified identities.
      </p>
      {invitation ? (
        <Panel title={`Invited to remember: ${subject.title}`}>
          <p>
            Write a contribution below and return the downloaded file to the
            sender. No matching archive is needed to write a reply.
          </p>
          <Btn onClick={() => setInvitation(null)}>Return to my archive</Btn>
        </Panel>
      ) : (
        <div className="feature-grid">
          <label className="studio-field">
            Memory subject type
            <select
              value={subjectKind}
              onChange={(e) => {
                setKind(e.target.value);
                setSubject(data[e.target.value][0]?.id || "");
                setReply("");
              }}
            >
              <option value="people">Person</option>
              <option value="events">Event</option>
              <option value="documents">Photograph or document</option>
            </select>
          </label>
          <label className="studio-field">
            Memory subject
            <select
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
        <Panel title={replyTo ? "Reply to a memory" : "Contribute a memory"}>
          <form className="studio-form" onSubmit={submit}>
            <label className="studio-field">
              Contributor name
              <input
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </label>
            <label className="studio-field">
              Contribution type
              <select
                value={kind}
                onChange={(e) => setMemoryKind(e.target.value)}
              >
                <option value="memory">Recollection</option>
                <option value="correction">Suggested correction</option>
                <option value="question">Question</option>
              </select>
            </label>
            <label className="studio-field">
              Your memory
              <textarea
                required
                rows={7}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            {replyTo && <Btn onClick={() => setReply("")}>Cancel reply</Btn>}
            <Btn type="submit" kind="primary" disabled={!subject.id}>
              {invitation
                ? "Export contribution for sender"
                : "Save contribution"}
            </Btn>
          </form>
        </Panel>
        <Panel title="Collected memories">
          {memories.map((m) => (
            <article className="evidence-card" key={m.id}>
              <strong>{m.author}</strong>
              <small>
                {" "}
                · {m.kind} · {new Date(m.createdAt).toLocaleDateString()}
              </small>
              {m.replyTo && (
                <p className="feature-muted">
                  Reply to{" "}
                  {memories.find((x) => x.id === m.replyTo)?.author ||
                    "an earlier contribution"}
                </p>
              )}
              <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
              {!invitation && (
                <div className="feature-actions">
                  <Btn small onClick={() => setReply(m.id)}>
                    Reply
                  </Btn>
                  <Btn
                    small
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this contribution from your local archive?",
                        )
                      )
                        actions.remove("memories", m.id);
                    }}
                  >
                    Remove contribution
                  </Btn>
                </div>
              )}
            </article>
          ))}
          {!memories.length && (
            <p>No memories collected for this subject yet.</p>
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
            >
              Export collected contributions
            </Btn>
          )}
        </Panel>
      </div>
      {pending && (
        <Modal
          title="Review incoming contributions"
          onClose={() => setPending(null)}
        >
          <p>
            {pending.memories.length} entries for {pending.subject.title}. New
            entries will be added. Existing IDs will be kept unchanged,
            including conflicting revisions; ask the author to submit a new
            correction instead.
          </p>
          <ul>
            {pending.memories.map((m, i) => (
              <li key={i}>
                {String(m.author || "Unknown").slice(0, 100)}:{" "}
                {String(m.text || "").slice(0, 140)}
              </li>
            ))}
          </ul>
          <Btn onClick={() => setPending(null)}>Cancel</Btn>
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
                  throw new Error("A contribution does not match its subject.");
                return { ...d, memories: [...d.memories, ...incoming] };
              });
              if (ok) {
                setKind(pending.subject.kind);
                setSubject(pending.subject.id);
                setPending(null);
              }
            }}
          >
            Import new contributions
          </Btn>
        </Modal>
      )}
    </FeaturePage>
  );
}
