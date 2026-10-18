import {tr} from "../i18n/index.js";
import { EXTRA_COLLECTIONS, validateExtensions, cleanExtensions } from "./extensions.js";
import { TYPE, DOC_TYPES } from "../config/eventTypes.js";
import { uid, uniq } from "../utils/ids.js";

export const COLLECTIONS = [
  "people",
  "locations",
  "events",
  "documents",
  "migrations",
  "branches",
];
export const isYear = (value) =>
  value !== "" &&
  value !== null &&
  Number.isInteger(Number(value)) &&
  Math.abs(Number(value)) <= 9999;
export const yearError = "Enter a whole year between -9999 and 9999";
const fail = (message) => {
  throw new Error(message);
};
const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const strings = (value) =>
  Array.isArray(value) && value.every((x) => typeof x === "string");
const text = (value, label, required = false) => {
  if (typeof value !== "string" || (required && !value.trim()))
    fail(tr("{{v0}} must be {{v1}}text.", {v0: tr(label), v1: required ? "nonempty " : ""}));
};
const year = (value, label) => {
  if (typeof value !== "number" || !isYear(value))
    fail(tr("{{v0}}: {{v1}}.", {v0: tr(label), v1: tr(yearError)}));
};

export function validateArchive(d) {
  if (!record(d))
    fail(tr("Choose a Family Atlas archive, not an unrelated JSON file."));
  if (d.schemaVersion != null && ![1, 2].includes(d.schemaVersion))
    fail(tr("This archive version is not supported."));
  for (const key of COLLECTIONS) {
    if (!Array.isArray(d[key]))
      fail(tr("Archive is missing the {{v0}} collection.", {v0: tr(key)}));
    const seen = new Set();
    for (const row of d[key]) {
      if (!record(row)) fail(tr("Invalid record in {{v0}}.", {v0: tr(key)}));
      text(row.id, `${key} ID`, true);
      if (seen.has(row.id)) fail(tr("Duplicate {{v0}} ID: {{v1}}.", {v0: tr(key), v1: row.id}));
      seen.add(row.id);
    }
  }
  const ids = Object.fromEntries(
    COLLECTIONS.map((key) => [key, new Set(d[key].map((x) => x.id))]),
  );
  const ref = (value, key, label, optional = false) => {
    if (optional && (value === "" || value == null)) return;
    if (!ids[key].has(value))
      fail(tr("{{v0}} refers to a missing {{v1}} record.", {v0: tr(label), v1: tr(key)}));
  };
  const refs = (value, key, label) => {
    if (!strings(value)) fail(tr("{{v0}} must be a list of IDs.", {v0: tr(label)}));
    value.forEach((x) => ref(x, key, label));
  };
  for (const p of d.people) {
    text(p.first, "First name", true);
    text(p.last, "Last name", true);
    if (p.birth != null) year(p.birth, "Birth year");
    if (p.death != null) {
      year(p.death, "Death year");
      if (p.birth != null && p.death < p.birth) fail(tr("Death precedes birth."));
    }
    for (const key of ["gender", "bio", "avatar"])
      if (p[key] != null) text(p[key], key);
    for (const key of ["parents", "children", "spouses", "siblings"]) {
      if (key === "siblings" && p[key] == null) continue;
      refs(p[key], "people", key);
      if (p[key].includes(p.id))
        fail(tr("A person cannot be related to themselves."));
    }
    refs(p.branches, "branches", "Person branches");
    ref(p.born, "locations", "Birthplace", true);
    if (!Array.isArray(p.residences)) fail(tr("Residences must be a list."));
    for (const r of p.residences) {
      if (!record(r)) fail(tr("Invalid residence record."));
      ref(r.at, "locations", "Residence");
      year(r.from, "Residence year");
      if ((p.birth != null && r.from < p.birth) || (p.death != null && r.from > p.death))
        fail(tr("Residence year must be within the person’s lifetime."));
    }
  }
  for (const l of d.locations) {
    text(l.name, "Location name", true);
    text(l.region ?? "", "Region");
    text(l.desc ?? "", "Location description");
    if (
      !Number.isFinite(l.x) ||
      !Number.isFinite(l.y) ||
      l.x < 0 ||
      l.x > 1000 ||
      l.y < 0 ||
      l.y > 560
    )
      fail(tr("Invalid map position."));
    if ((l.lat == null) !== (l.lng == null))
      fail(tr("Supply both latitude and longitude, or leave both blank."));
    if (
      l.lat != null &&
      (!Number.isFinite(l.lat) ||
        Math.abs(l.lat) > 90 ||
        !Number.isFinite(l.lng) ||
        Math.abs(l.lng) > 180)
    )
      fail(tr("Latitude or longitude is outside geographic bounds."));
  }
  for (const e of d.events) {
    if (!Object.hasOwn(TYPE, e.type)) fail(tr("Unknown event type."));
    text(e.title, "Event title", true);
    text(e.type, "Event type", true);
    year(e.year, "Event year");
    text(e.desc ?? "", "Event description");
    refs(e.people, "people", "Event people");
    refs(e.docs, "documents", "Event documents");
    ref(e.at, "locations", "Event location", true);
    if (typeof e.historical !== "boolean")
      fail(tr("Historical context must be true or false."));
  }
  for (const doc of d.documents) {
    if (!DOC_TYPES.includes(doc.type)) fail(tr("Unknown document type."));
    text(doc.title, "Document title", true);
    text(doc.type, "Document type", true);
    year(doc.year, "Document year");
    text(doc.desc ?? "", "Document description");
    refs(doc.people, "people", "Document people");
    refs(doc.events, "events", "Document events");
  }
  for (const b of d.branches) {
    text(b.name, "Branch name", true);
    if (!/^#[0-9a-f]{6}$/i.test(b.color))
      fail(tr("Branch color must be a six-digit hex color."));
  }
  for (const m of d.migrations) {
    if (!["person", "branch"].includes(m.mode)) fail(tr("Invalid migration mode."));
    ref(m.from, "locations", "Migration origin");
    ref(m.to, "locations", "Migration destination");
    if (m.from === m.to) fail(tr("Migration origin and destination must differ."));
    year(m.startYear, "Migration start year");
    if (m.endYear != null) {
      year(m.endYear, "Migration end year");
      if (m.endYear < m.startYear) fail(tr("Migration ends before it starts."));
    }
    if (m.mode === "person") {
      ref(m.personId, "people", "Migration person");
      const p = d.people.find((p) => p.id === m.personId);
      if (
        (p.birth != null && m.startYear < p.birth) ||
        (p.death != null && m.startYear > p.death) ||
        (m.endYear != null && p.death != null && m.endYear > p.death)
      )
        fail(tr("A personal migration must be within the person’s lifetime."));
    }
    // An unassigned branch is retained when a branch is deleted.
    if (m.branch) ref(m.branch, "branches", "Migration branch");
    if (m.mode === "branch" && !m.branch)
      fail(tr("Choose a branch for a branch-wide migration."));
    text(m.description ?? "", "Migration description");
  }
  validateExtensions(d);
  validateRelationships(d.people);
  return d;
}

export function validateRelationships(people) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const parents = new Map(people.map((p) => [p.id, new Set(p.parents || [])]));
  people.forEach((p) =>
    (p.children || []).forEach((id) => parents.get(id)?.add(p.id)),
  );
  const active = new Set(),
    done = new Set();
  function visit(id) {
    if (active.has(id)) fail(tr("This relationship creates an ancestry cycle."));
    if (done.has(id)) return;
    active.add(id);
    for (const parentId of parents.get(id) || []) {
      if (parentId === id) fail(tr("A person cannot be their own parent."));
      const p = byId.get(parentId),
        child = byId.get(id);
      if (!p) fail(tr("Parent does not exist."));
      if (p.birth != null && child.birth != null && p.birth >= child.birth)
        fail(tr("A parent must be born before their child."));
      visit(parentId);
    }
    active.delete(id);
    done.add(id);
  }
  people.forEach((p) => visit(p.id));
}

// Reconcile legacy one-sided links by preserving the union of known assertions.
export function reconcile(d) {
  const next = structuredClone(d);
  const byId = new Map(next.people.map((p) => [p.id, p]));
  const add = (arr, id) => {
    if (!arr.includes(id)) arr.push(id);
  };
  next.people.forEach((p) => {
    p.siblings ||= [];
  });
  next.people.forEach((p) => {
    p.parents.forEach((id) => {
      if (byId.has(id)) add(byId.get(id).children, p.id);
    });
    p.children.forEach((id) => {
      if (byId.has(id)) add(byId.get(id).parents, p.id);
    });
    p.spouses.forEach((id) => {
      if (byId.has(id)) add(byId.get(id).spouses, p.id);
    });
    p.siblings.forEach((id) => {
      if (byId.has(id)) add(byId.get(id).siblings, p.id);
    });
  });
  next.events.forEach((e) =>
    e.docs.forEach((id) => {
      const doc = next.documents.find((x) => x.id === id);
      if (doc) add(doc.events, e.id);
    }),
  );
  next.documents.forEach((doc) =>
    doc.events.forEach((id) => {
      const e = next.events.find((x) => x.id === id);
      if (e) add(e.docs, doc.id);
    }),
  );
  next.migrations = next.migrations.map((m) => {
    if (m.mode !== "person" || m.source) return m;
    const p = next.people.find((p) => p.id === m.personId),
      rs = [...(p?.residences || [])].sort((a, b) => a.from - b.from);
    return rs.some(
      (r, i) =>
        i > 0 &&
        rs[i - 1].at === m.from &&
        r.at === m.to &&
        r.from === m.startYear,
    )
      ? { ...m, source: "residence" }
      : m;
  });
  for (const key of EXTRA_COLLECTIONS) next[key] ||= [];
  next.people.forEach(p => { if(p.parentTypes) p.parentTypes=Object.fromEntries(Object.entries(p.parentTypes).filter(([id])=>p.parents.includes(id))); });
  next.schemaVersion = 2;
  return next;
}

const upsert = (rows, row) =>
  rows.some((x) => x.id === row.id)
    ? rows.map((x) => (x.id === row.id ? row : x))
    : [...rows, row];
export function replacePerson(d, person) {
  const id = person.id;
  const people = upsert(d.people, {
    ...person,
    siblings: person.siblings || [],
  }).map((p) =>
    p.id === id
      ? p
      : {
          ...p,
          parents: p.parents.filter((x) => x !== id),
          children: p.children.filter((x) => x !== id),
          spouses: p.spouses.filter((x) => x !== id),
          siblings: (p.siblings || []).filter((x) => x !== id),
        },
  );
  return reconcile({ ...d, people });
}

export function syncResidences(d, personId, oldPerson) {
  const p = d.people.find((p) => p.id === personId);
  const routes = (who) => {
    const rs = [...(who?.residences || [])].sort((a, b) => a.from - b.from);
    return rs
      .slice(1)
      .flatMap((r, i) =>
        r.at === rs[i].at
          ? []
          : [{ from: rs[i].at, to: r.at, startYear: r.from }],
      );
  };
  const matches = (m, r) =>
    m.from === r.from && m.to === r.to && m.startYear === r.startYear;
  const old = routes(oldPerson);
  const existing = d.migrations.filter(
    (m) => m.mode === "person" && m.personId === personId,
  );
  const derived = routes(p).map((r) => {
    const previous = existing.find((m) => matches(m, r));
    return {
      id: previous?.id || uid("mig"), mode: "person", personId,
      branch: p.branches[0] || "", ...r, endYear: previous?.endYear ?? null,
      description: previous?.description ?? `${d.locations.find((l) => l.id === r.from)?.name || r.from} → ${d.locations.find((l) => l.id === r.to)?.name || r.to}`,
      source: "residence",
    };
  });
  return {
    ...d,
    migrations: [
      ...d.migrations.filter(
        (m) =>
          !(
            m.mode === "person" &&
            m.personId === personId &&
            (m.source === "residence" ||
              old.some((r) => matches(m, r)) ||
              derived.some((r) => matches(m, r)))
          ),
      ),
      ...derived,
    ],
  };
}

export function saveEntity(d, key, item) {
  let next = { ...d, [key]: upsert(d[key], item) };
  if (key === "events")
    next.documents = d.documents.map((doc) => ({
      ...doc,
      events: item.docs.includes(doc.id)
        ? uniq([...doc.events, item.id])
        : doc.events.filter((id) => id !== item.id),
    }));
  if (key === "documents")
    next.events = d.events.map((e) => ({
      ...e,
      docs: item.events.includes(e.id)
        ? uniq([...e.docs, item.id])
        : e.docs.filter((id) => id !== item.id),
    }));
  if (key === 'documents') next = cleanExtensions(next, '', '');
  if (key === "migrations" && item.source === "residence") {
    const previous = d.migrations.find((m) => m.id === item.id);
    const person = d.people.find((p) => p.id === previous?.personId);
    if (person && previous) {
      if (
        item.personId !== previous.personId ||
        item.mode !== "person" ||
        item.from !== previous.from
      )
        fail(
          tr("For a generated route, edit the person’s residences to change the origin or person."),
        );
      const residences = person.residences.map((r) =>
        r.at === previous.to && r.from === previous.startYear
          ? { at: item.to, from: item.startYear }
          : r,
      );
      next.people = d.people.map((p) =>
        p.id === person.id ? { ...p, residences } : p,
      );
      next = syncResidences(next, person.id, person);
    }
  }
  return next;
}

export function changeRelationship(d, aId, type, bId, remove = false) {
  if (aId === bId) fail(tr("A person cannot be related to themselves."));
  if (
    !d.people.some((p) => p.id === aId) ||
    !d.people.some((p) => p.id === bId)
  )
    fail(tr("Choose two existing people."));
  const a = structuredClone(d.people.find((p) => p.id === aId)),
    b = d.people.find((p) => p.id === bId);
  const key = {
    parent: "children",
    child: "parents",
    spouse: "spouses",
    sibling: "siblings",
  }[type];
  if (!key) fail(tr("Unknown relationship type."));
  a[key] = remove
    ? (a[key] || []).filter((id) => id !== bId)
    : uniq([...(a[key] || []), bId]);
  let next = replacePerson(d, a);
  if (type === "sibling" && !remove) {
    // Explicit siblings preserve unknown/half-parent information instead of merging parents.
    next.people = next.people.map((p) =>
      p.id === b.id
        ? { ...p, siblings: uniq([...(p.siblings || []), a.id]) }
        : p,
    );
  }
  return next;
}
