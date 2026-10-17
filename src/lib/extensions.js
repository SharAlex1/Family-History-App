import { parseFamilyDate } from "./dates.js";
export const EXTRA_COLLECTIONS = [
  "interviews",
  "claims",
  "researchTasks",
  "memories",
  "reminders",
  "books",
];
export function validateExtensions(d) {
  const fail = (message) => {
    throw new Error(message);
  };
  const string = (x, name, required = false) => {
    if (typeof x !== "string" || (required && !x.trim()))
      fail(`${name} must be text${required ? " and cannot be empty" : ""}.`);
  };
  const has = (key, id) => d[key].some((row) => row.id === id);
  const ref = (key, id, name, optional = false) => {
    if (optional && !id) return;
    if (!has(key, id)) fail(`${name} refers to a missing record.`);
  };
  for (const key of EXTRA_COLLECTIONS) {
    if (d[key] === undefined) continue;
    if (!Array.isArray(d[key])) fail(`Invalid ${key} collection.`);
    const ids = new Set();
    for (const r of d[key]) {
      if (!r || typeof r !== "object" || Array.isArray(r))
        fail(`Invalid ${key} record.`);
      string(r.id, "ID", true);
      if (ids.has(r.id)) fail(`Duplicate ${key} ID.`);
      ids.add(r.id);
    }
  }
  for (const p of d.people) {
    for (const kind of ["birth", "death"])
      if (p[`${kind}Date`]) {
        string(p[`${kind}Date`], `${kind} date`);
        const parsed = parseFamilyDate(p[`${kind}Date`]);
        if (parsed.year !== p[kind]) fail(`${kind} date and year disagree.`);
      }
    if (p.parentTypes !== undefined) {
      if (
        !p.parentTypes ||
        typeof p.parentTypes !== "object" ||
        Array.isArray(p.parentTypes)
      )
        fail("Invalid parentage types.");
      for (const [id, type] of Object.entries(p.parentTypes))
        if (
          !p.parents.includes(id) ||
          !["biological", "adoptive", "step", "unknown"].includes(type)
        )
          fail("Invalid parentage link.");
    }
  }
  for (const e of d.events)
    if (e.date) {
      const parsed = parseFamilyDate(e.date);
      if (parsed.year !== e.year) fail("Event date and year disagree.");
    }
  const attachments = new Map();
  for (const doc of d.documents) {
    if (doc.files !== undefined && !Array.isArray(doc.files))
      fail("Invalid attachment list.");
    for (const f of doc.files || []) {
      string(f.id, "Attachment ID", true);
      string(f.name, "Attachment name", true);
      string(f.type, "Attachment type", true);
      if (
        !Number.isSafeInteger(f.size) ||
        f.size < 0 ||
        f.size > 100 * 1024 * 1024 ||
        !/^[a-f0-9]{64}$/.test(f.sha256) ||
        f.id !== `file_${f.sha256}`
      )
        fail("Invalid attachment metadata.");
      const previous = attachments.get(f.id);
      if (previous && (previous.type !== f.type || previous.size !== f.size))
        fail("Conflicting attachment metadata.");
      attachments.set(f.id, f);
    }
    if (doc.caption != null) string(doc.caption, "Caption");
  }
  for (const p of d.people)
    if (
      p.photoFileId &&
      !attachments.get(p.photoFileId)?.type.startsWith("image/")
    )
      fail("Profile photograph must reference an attached image.");
  for (const r of d.interviews || []) {
    ref("people", r.personId, "Interview person");
    ref("documents", r.documentId, "Interview recording", true);
    for (const k of ["title", "prompt", "transcript", "createdAt"])
      string(r[k], k, k === "title");
  }
  for (const r of d.claims || []) {
    ref("people", r.personId, "Claim person");
    ref("documents", r.documentId, "Citation document", true);
    for (const k of ["field", "value", "page", "quote", "notes"])
      string(r[k], k, ["field", "value"].includes(k));
    if (!["unverified", "supported", "disputed"].includes(r.status))
      fail("Invalid evidence status.");
  }
  for (const r of d.researchTasks || []) {
    ref("people", r.personId, "Research person", true);
    string(r.title, "Research question", true);
    string(r.notes, "Research notes");
    if (!["open", "in-progress", "done"].includes(r.status))
      fail("Invalid research status.");
  }
  for (const r of d.memories || []) {
    if (!["people", "events", "documents"].includes(r.subjectKind))
      fail("Invalid memory subject.");
    ref(r.subjectKind, r.subjectId, "Memory subject");
    string(r.author, "Contributor", true);
    string(r.text, "Memory", true);
    string(r.createdAt, "Contribution date", true);
    if (!Number.isFinite(Date.parse(r.createdAt)))
      fail("Invalid contribution date.");
    if (!["memory", "correction", "question"].includes(r.kind))
      fail("Invalid memory kind.");
    if (
      r.replyTo &&
      !(d.memories || []).some(
        (m) =>
          m.id === r.replyTo &&
          m.subjectId === r.subjectId &&
          m.subjectKind === r.subjectKind,
      )
    )
      fail("Missing parent memory.");
  }
  const memories = new Map((d.memories || []).map((m) => [m.id, m])),
    visited = new Set();
  for (const memory of memories.values()) {
    const active = new Set();
    let current = memory;
    while (current && !visited.has(current.id)) {
      if (active.has(current.id)) fail("Contribution replies contain a cycle.");
      active.add(current.id);
      current = memories.get(current.replyTo);
    }
    active.forEach((id) => visited.add(id));
  }
  for (const r of d.books || []) {
    string(r.title, "Book title", true);
    string(r.narrative, "Book narrative");
    string(r.createdAt, "Book date", true);
    if (!Array.isArray(r.people)) fail("Invalid book people.");
    r.people.forEach((id) => ref("people", id, "Book person"));
  }
  for (const r of d.reminders || []) {
    ref("people", r.personId, "Reminder person", true);
    string(r.title, "Reminder title", true);
    if (
      !Number.isInteger(r.month) ||
      !Number.isInteger(r.day) ||
      r.month < 1 ||
      r.month > 12 ||
      r.day < 1 ||
      r.day > new Date(Date.UTC(2000, r.month, 0)).getUTCDate()
    )
      fail("Invalid reminder date.");
  }
}
export function cleanExtensions(d, kind, id) {
  const next = { ...d };
  const photos = new Set(
    d.documents.flatMap((doc) =>
      (doc.files || [])
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => f.id),
    ),
  );
  next.people = d.people.map((p) => ({
    ...p,
    ...(p.parentTypes
      ? {
          parentTypes: Object.fromEntries(
            Object.entries(p.parentTypes).filter(([id]) =>
              p.parents.includes(id),
            ),
          ),
        }
      : {}),
    ...(p.photoFileId && !photos.has(p.photoFileId) ? { photoFileId: "" } : {}),
  }));
  next.interviews = (d.interviews || [])
    .filter((r) => !(kind === "people" && r.personId === id))
    .map((r) =>
      kind === "documents" && r.documentId === id
        ? { ...r, documentId: "" }
        : r,
    );
  next.claims = (d.claims || [])
    .filter((r) => !(kind === "people" && r.personId === id))
    .map((r) =>
      kind === "documents" && r.documentId === id
        ? { ...r, documentId: "" }
        : r,
    );
  next.researchTasks = (d.researchTasks || []).map((r) =>
    kind === "people" && r.personId === id ? { ...r, personId: "" } : r,
  );
  next.reminders = (d.reminders || []).map((r) =>
    kind === "people" && r.personId === id ? { ...r, personId: "" } : r,
  );
  next.books = (d.books || []).map((b) =>
    kind === "people" ? { ...b, people: b.people.filter((x) => x !== id) } : b,
  );
  const removed = new Set(
    (d.memories || [])
      .filter(
        (r) =>
          (r.subjectKind === kind && r.subjectId === id) ||
          (kind === "memories" && r.id === id),
      )
      .map((r) => r.id),
  );
  next.memories = (next.memories || [])
    .filter((r) => !removed.has(r.id))
    .map((r) => (removed.has(r.replyTo) ? { ...r, replyTo: "" } : r));
  return next;
}
