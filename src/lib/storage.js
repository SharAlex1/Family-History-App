import { makeSeed } from "../data/seed.js";
import { validateArchive, reconcile } from "./archive.js";

export const LS_KEY = "familyAtlas.v2";
export const BACKUP_KEY = "familyAtlas.backup";
export function coercePerson(p) {
  const branches = Array.isArray(p.branches)
    ? p.branches
    : p.branch
      ? [p.branch]
      : [];
  const { branch: _branch, ...rest } = p;
  return { ...rest, branches };
}
// Kept as a legacy adapter; all real imports and saved archives also pass validation.
export function normalize(d) {
  const seed = makeSeed();
  return {
    ...d,
    people: Array.isArray(d.people) ? d.people.map(coercePerson) : seed.people,
    locations: Array.isArray(d.locations) ? d.locations : seed.locations,
    events: Array.isArray(d.events) ? d.events : seed.events,
    documents: Array.isArray(d.documents) ? d.documents : seed.documents,
    migrations: Array.isArray(d.migrations) ? d.migrations : [],
    branches: Array.isArray(d.branches) ? d.branches : seed.branches,
  };
}
export function parseArchive(raw) {
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (
    !d ||
    typeof d !== "object" ||
    !["people", "locations", "events", "documents", "branches"].every((k) =>
      Array.isArray(d[k]),
    )
  )
    throw new Error("Choose a complete Family Atlas JSON archive.");
  if (
    d._revision != null &&
    (!Number.isSafeInteger(d._revision) || d._revision < 0)
  )
    throw new Error("Invalid archive revision.");
  const normalized = normalize(d);
  validateArchive(normalized);
  return validateArchive(reconcile(normalized));
}
export function readArchive() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(LS_KEY);
    return {
      data: raw ? parseArchive(raw) : reconcile(makeSeed()),
      raw,
      error: null,
    };
  } catch (error) {
    return {
      data: reconcile(makeSeed()),
      raw,
      error: `Could not read the saved archive: ${error.message}. The original has not been overwritten. Export it for recovery, or import a valid archive.`,
    };
  }
}
export function backupArchive(raw) {
  if (raw) window.localStorage.setItem(BACKUP_KEY, raw);
}
export function readBackup() {
  const raw = window.localStorage.getItem(BACKUP_KEY);
  if (!raw) throw new Error("No previous archive backup is available.");
  return parseArchive(raw);
}
export function writeArchive(data, expectedRevision, backup = false) {
  const raw = window.localStorage.getItem(LS_KEY);
  const current = raw ? JSON.parse(raw) : null;
  if ((current?._revision || 0) !== expectedRevision)
    throw new Error(
      "Another tab changed this archive. Export your unsaved work, then load the latest archive.",
    );
  if (backup) backupArchive(raw);
  const saved = { ...data, schemaVersion: 2, _revision: expectedRevision + 1 };
  window.localStorage.setItem(LS_KEY, JSON.stringify(saved));
  return saved;
}
export function downloadArchive(data, name = "family-atlas-data.json") {
  const blob = new Blob(
    [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
