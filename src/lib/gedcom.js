import { uid, uniq } from "../utils/ids.js";
import { parseFamilyDate } from "./dates.js";
import { reconcile, validateArchive } from "./archive.js";
import { ancestorDistances } from "./relationships.js";
export function parseGedcom(text, label = "Imported family") {
  if (text.length > 10 * 1024 * 1024)
    throw new Error("GEDCOM files must be under 10 MB.");
  const roots = [],
    stack = [],
    warnings = [],
    prefix = uid("ged");
  const node = (n, tag) => n?.children.find((c) => c.tag === tag),
    nodes = (n, tag) => n?.children.filter((c) => c.tag === tag) || [];
  function value(n) {
    if (!n) return "";
    return (
      n.value +
      (n.children || [])
        .filter((c) => c.tag === "CONT" || c.tag === "CONC")
        .map((c) => (c.tag === "CONT" ? "\n" : "") + value(c))
        .join("")
    );
  }
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.length > 200000) throw new Error("GEDCOM contains too many lines.");
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const m = line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Z0-9_]+)(?:\s(.*))?$/);
    if (!m) throw new Error(`Invalid GEDCOM syntax on line ${i + 1}.`);
    const level = Number(m[1]);
    if (level > 30 || level > stack.length)
      throw new Error(`Invalid GEDCOM nesting on line ${i + 1}.`);
    const n = { xref: m[2] || "", tag: m[3], value: m[4] || "", children: [] };
    if (level === 0) roots.push(n);
    else stack[level - 1].children.push(n);
    stack[level] = n;
    stack.length = level + 1;
  });
  if (
    !roots.some((n) => n.tag === "HEAD") ||
    !roots.some((n) => n.tag === "INDI")
  )
    throw new Error(
      "Choose a GEDCOM genealogy file with a HEAD and at least one INDI record.",
    );
  const head = roots.find((n) => n.tag === "HEAD"),
    encoding = value(node(head, "CHAR"));
  if (
    encoding &&
    !["UTF-8", "UNICODE", "ASCII"].includes(encoding.toUpperCase())
  )
    throw new Error(
      `Export the GEDCOM as UTF-8; ${encoding} is not supported.`,
    );
  const date = (n) => {
    const t = value(node(n, "DATE"));
    if (!t) return { text: "", year: null };
    try {
      return parseFamilyDate(t);
    } catch {
      warnings.push(`Date kept as a note because it could not be parsed: ${t}`);
      return { text: "", year: null, note: t };
    }
  };
  const d = {
    people: [],
    locations: [],
    events: [],
    documents: [],
    migrations: [],
    branches: [
      {
        id: `${prefix}_branch`,
        name: label.replace(/\.ged(com)?$/i, "") || "Imported family",
        color: "#5FB8A8",
      },
    ],
    interviews: [],
    claims: [],
    researchTasks: [],
    memories: [],
    reminders: [],
    books: [],
  };
  const locations = new Map(),
    peopleIds = new Map(
      roots
        .filter((n) => n.tag === "INDI")
        .map((n, i) => [n.xref, `${prefix}_p${i}`]),
    ),
    sourceIds = new Map();
  function place(text) {
    if (!text.trim()) return "";
    const key = text.trim().toLowerCase();
    if (!locations.has(key)) {
      const id = uid("loc");
      d.locations.push({
        id,
        name: text.trim(),
        region: text.split(",").at(-1).trim(),
        lat: null,
        lng: null,
        x: 500,
        y: 280,
        unmapped: true,
        desc: "Imported place. Add coordinates in Manage Data before plotting it on the map.",
      });
      locations.set(key, id);
    }
    return locations.get(key);
  }
  roots
    .filter((n) => n.tag === "SOUR")
    .forEach((n) => {
      const id = uid("source");
      sourceIds.set(n.xref, id);
      d.documents.push({
        id,
        title: value(node(n, "TITL")) || "Imported source",
        type: "record",
        year: new Date().getFullYear(),
        people: [],
        events: [],
        desc: [
          value(node(n, "AUTH")),
          value(node(n, "PUBL")),
          value(node(n, "TEXT")),
          value(node(n, "NOTE")),
        ]
          .filter(Boolean)
          .join("\n"),
        files: [],
        externalId: n.xref,
      });
    });
  function cite(container, personId, field, claimValue) {
    for (const sour of nodes(container, "SOUR")) {
      let documentId = sourceIds.get(sour.value);
      if (!documentId) {
        documentId = uid("source");
        sourceIds.set(sour.value, documentId);
        d.documents.push({
          id: documentId,
          title: sour.value || "Unresolved source",
          type: "record",
          year: new Date().getFullYear(),
          people: [],
          events: [],
          desc: "Imported source reference; publication details are not provided.",
          files: [],
        });
      }
      const doc = d.documents.find((doc) => doc.id === documentId);
      doc.people = uniq([...doc.people, personId]);
      d.claims.push({
        id: uid("claim"),
        personId,
        field,
        value: claimValue || "Date not recorded",
        documentId,
        page: value(node(sour, "PAGE")),
        quote:
          value(node(node(sour, "DATA"), "TEXT")) || value(node(sour, "TEXT")),
        notes: "Imported citation, not independently verified.",
        status: "unverified",
      });
    }
  }
  for (const n of roots.filter((n) => n.tag === "INDI")) {
    const id = peopleIds.get(n.xref),
      name = node(n, "NAME"),
      raw = value(name),
      parts = raw.split("/"),
      first = value(node(name, "GIVN")) || parts[0]?.trim() || "Unknown",
      last = value(node(name, "SURN")) || parts[1]?.trim() || "Unknown";
    const birth = node(n, "BIRT"),
      death = node(n, "DEAT"),
      bd = date(birth),
      dd = date(death);
    const p = {
      id,
      first,
      last,
      gender: { M: "m", F: "f", X: "x" }[value(node(n, "SEX"))] || "",
      birth: bd.year,
      death: dd.year,
      birthDate: bd.text,
      deathDate: dd.text,
      deceased: Boolean(death),
      born: place(value(node(birth, "PLAC"))),
      branches: [d.branches[0].id],
      parents: [],
      children: [],
      spouses: [],
      siblings: [],
      parentTypes: {},
      residences: [],
      avatar: "",
      aliases: nodes(n, "NAME").slice(1).map(value),
      bio: [
        ...nodes(n, "NOTE").map(value),
        bd.note ? `Birth date as supplied: ${bd.note}` : "",
        dd.note ? `Death date as supplied: ${dd.note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      externalId: n.xref,
    };
    for (const r of nodes(n, "RESI")) {
      const rd = date(r),
        at = place(value(node(r, "PLAC")));
      if (at && rd.year != null) p.residences.push({ at, from: rd.year });
      else if (at) {
        p.bio += `\nResidence with unknown arrival date: ${value(node(r, "PLAC"))}.`;
        warnings.push(
          `${first} ${last}: undated residence retained in biography.`,
        );
      }
    }
    if (
      p.born &&
      p.birth != null &&
      !p.residences.some((r) => r.at === p.born && r.from === p.birth)
    )
      p.residences.unshift({ at: p.born, from: p.birth });
    d.people.push(p);
    cite(birth, id, "Birth date", bd.text);
    cite(death, id, "Death date", dd.text);
    cite(n, id, "Biographical source", raw);
    for (const [container, type, title] of [
      [birth, "birth", `${first} ${last} born`],
      [death, "death", `${first} ${last} dies`],
      ...nodes(n, "OCCU").map((x) => [x, "career", value(x) || "Occupation"]),
      ...nodes(n, "EDUC").map((x) => [x, "education", value(x) || "Education"]),
    ]) {
      const dt = date(container);
      if (dt.year != null)
        d.events.push({
          id: uid("event"),
          title,
          type,
          year: dt.year,
          date: dt.text,
          at: place(value(node(container, "PLAC"))),
          people: [id],
          docs: [],
          desc: value(node(container, "NOTE")),
          historical: false,
        });
    }
    for (const obj of nodes(n, "OBJE")) {
      const file = value(node(obj, "FILE"));
      if (file) {
        d.documents.push({
          id: uid("doc"),
          title: value(node(obj, "TITL")) || file.split(/[\\/]/).at(-1),
          type: "photo",
          year: p.birth ?? new Date().getFullYear(),
          people: [id],
          events: [],
          desc: `GEDCOM media reference: ${file}. Attach the original file in the archive; this importer does not read external paths or fetch URLs.`,
          files: [],
        });
        warnings.push(
          "A linked media reference was imported as metadata; reattach its file.",
        );
      }
    }
  }
  for (const fam of roots.filter((n) => n.tag === "FAM")) {
    const parents = [value(node(fam, "HUSB")), value(node(fam, "WIFE"))]
      .map((x) => peopleIds.get(x))
      .filter(Boolean);
    for (const id of parents) {
      const p = d.people.find((p) => p.id === id);
      p.spouses = uniq([...p.spouses, ...parents.filter((x) => x !== id)]);
    }
    for (const child of nodes(fam, "CHIL")) {
      const id = peopleIds.get(child.value);
      if (!id) {
        warnings.push(`Family references missing child ${child.value}.`);
        continue;
      }
      const p = d.people.find((p) => p.id === id),
        record = roots.find((n) => n.xref === child.value),
        link = nodes(record, "FAMC").find((n) => n.value === fam.xref),
        pedi = value(node(link, "PEDI")).toLowerCase();
      p.parents = uniq([...p.parents, ...parents]);
      for (const par of parents)
        p.parentTypes[par] =
          pedi === "adopted" || pedi === "foster"
            ? "adoptive"
            : pedi === "step"
              ? "step"
              : "biological";
    }
    for (const marriage of nodes(fam, "MARR")) {
      const dt = date(marriage);
      if (dt.year != null)
        d.events.push({
          id: uid("event"),
          type: "marriage",
          year: dt.year,
          date: dt.text,
          people: parents,
          at: place(value(node(marriage, "PLAC"))),
          title:
            parents
              .map((id) => d.people.find((p) => p.id === id).first)
              .join(" & ") + " marry",
          desc: value(node(marriage, "NOTE")),
          docs: [],
          historical: false,
        });
    }
  }
  for (const p of d.people) {
    p.residences.sort((a, b) => a.from - b.from);
    for (let i = 1; i < p.residences.length; i++) {
      const a = p.residences[i - 1],
        b = p.residences[i];
      if (a.at !== b.at)
        d.migrations.push({
          id: uid("mig"),
          mode: "person",
          source: "residence",
          personId: p.id,
          branch: p.branches[0],
          from: a.at,
          to: b.at,
          startYear: b.from,
          endYear: null,
          description: "Imported residence change",
        });
    }
  }
  const archive = reconcile(d);
  validateArchive(archive);
  return { data: archive, warnings: uniq(warnings) };
}
const norm = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export function duplicateCandidates(existing, incoming) {
  return existing.filter(
    (p) =>
      norm(p.first) === norm(incoming.first) &&
      norm(p.last) === norm(incoming.last) &&
      (p.birth == null ||
        incoming.birth == null ||
        Math.abs(p.birth - incoming.birth) <= 2),
  );
}
const fields = [
  "first",
  "last",
  "gender",
  "birth",
  "death",
  "born",
  "bio",
  "birthDate",
  "deathDate",
  "deceased",
  "avatar",
  "photoFileId",
];
const missing = (x) => x == null || x === "";
export function combinePeople(primary, secondary, policy = "keep") {
  const p = { ...secondary, ...primary };
  for (const key of fields) {
    const preferred = policy === "incoming" ? secondary[key] : primary[key],
      other = policy === "incoming" ? primary[key] : secondary[key];
    p[key] = missing(preferred) ? other : preferred;
  }
  for (const key of ["parents", "children", "spouses", "siblings", "branches"])
    p[key] = uniq([...(primary[key] || []), ...(secondary[key] || [])]);
  p.parentTypes = { ...secondary.parentTypes, ...primary.parentTypes };
  p.aliases = uniq([
    ...(primary.aliases || []),
    ...(secondary.aliases || []),
    `${secondary.first} ${secondary.last}`,
  ]);
  p.residences = [
    ...new Map(
      [...primary.residences, ...secondary.residences].map((r) => [
        `${r.at}:${r.from}`,
        r,
      ]),
    ).values(),
  ].sort((a, b) => a.from - b.from);
  for (const key of ["birth", "death"])
    if (p[`${key}Date`] && parseFamilyDate(p[`${key}Date`]).year !== p[key])
      p[`${key}Date`] = "";
  return p;
}
export function remapPeople(data, mapping) {
  const id = (x) => mapping[x] || x;
  return {
    ...data,
    people: data.people.map((p) => ({
      ...p,
      id: id(p.id),
      parents: uniq(p.parents.map(id)),
      children: uniq(p.children.map(id)),
      spouses: uniq(p.spouses.map(id)),
      siblings: uniq((p.siblings || []).map(id)),
      parentTypes: Object.fromEntries(
        Object.entries(p.parentTypes || {}).map(([k, v]) => [id(k), v]),
      ),
    })),
    events: data.events.map((e) => ({ ...e, people: uniq(e.people.map(id)) })),
    documents: data.documents.map((d) => ({
      ...d,
      people: uniq(d.people.map(id)),
    })),
    migrations: data.migrations.map((m) => ({
      ...m,
      personId: m.personId ? id(m.personId) : m.personId,
    })),
    interviews: (data.interviews || []).map((r) => ({
      ...r,
      personId: id(r.personId),
    })),
    claims: (data.claims || []).map((r) => ({
      ...r,
      personId: id(r.personId),
    })),
    researchTasks: (data.researchTasks || []).map((r) => ({
      ...r,
      personId: id(r.personId),
    })),
    reminders: (data.reminders || []).map((r) => ({
      ...r,
      personId: id(r.personId),
    })),
    memories: (data.memories || []).map((r) => ({
      ...r,
      subjectId: r.subjectKind === "people" ? id(r.subjectId) : r.subjectId,
    })),
    books: (data.books || []).map((r) => ({
      ...r,
      people: uniq(r.people.map(id)),
    })),
  };
}
export function mergeImported(base, incoming, choices = {}, policy = "keep") {
  const mapping = Object.fromEntries(
    incoming.people.map((p) => [p.id, choices[p.id] || p.id]),
  );
  if (new Set(Object.values(mapping)).size !== incoming.people.length)
    throw new Error(
      "Map each incoming person to a different existing record, or create a separate person.",
    );
  const locationMap = Object.fromEntries(
    incoming.locations.map((l) => [
      l.id,
      base.locations.find(
        (x) =>
          norm(x.name) === norm(l.name) && norm(x.region) === norm(l.region),
      )?.id || l.id,
    ]),
  );
  let mapped = remapPeople(incoming, mapping);
  mapped.locations = mapped.locations.filter((l) => locationMap[l.id] === l.id);
  mapped.people = mapped.people.map((p) => ({
    ...p,
    born: locationMap[p.born] || p.born,
    residences: p.residences.map((r) => ({
      ...r,
      at: locationMap[r.at] || r.at,
    })),
  }));
  mapped.events = mapped.events.map((e) => ({
    ...e,
    at: locationMap[e.at] || e.at,
  }));
  mapped.migrations = mapped.migrations.map((m) => ({
    ...m,
    from: locationMap[m.from] || m.from,
    to: locationMap[m.to] || m.to,
  }));
  const result = structuredClone(base);
  for (const key of [
    "locations",
    "events",
    "documents",
    "migrations",
    "branches",
    "interviews",
    "claims",
    "researchTasks",
    "memories",
    "reminders",
    "books",
  ])
    result[key] = [...(result[key] || []), ...(mapped[key] || [])];
  for (const p of mapped.people) {
    const index = result.people.findIndex((x) => x.id === p.id);
    if (index < 0) result.people.push(p);
    else {
      preserveAlternatives(result, result.people[index], p, p.id, policy);
      result.people[index] = combinePeople(result.people[index], p, policy);
    }
  }
  return validateArchive(reconcile(result));
}
export function mergeExisting(base, primaryId, secondaryId, policy = "keep") {
  if (primaryId === secondaryId)
    throw new Error("Choose two different records.");
  const primary = base.people.find((p) => p.id === primaryId),
    secondary = base.people.find((p) => p.id === secondaryId);
  if (!primary || !secondary) throw new Error("Choose two existing people.");
  if (
    ancestorDistances(base.people, primaryId).has(secondaryId) ||
    ancestorDistances(base.people, secondaryId).has(primaryId) ||
    primary.spouses.includes(secondaryId) ||
    (primary.siblings || []).includes(secondaryId)
  )
    throw new Error(
      "These records are already connected as distinct relatives. Resolve that relationship before merging them.",
    );
  const mapped = remapPeople(base, { [secondaryId]: primaryId });
  const combined = combinePeople(primary, secondary, policy);
  const result = {
    ...mapped,
    people: mapped.people
      .filter((p) => p.id !== primaryId)
      .concat({ ...combined, id: primaryId }),
  };
  preserveAlternatives(result, primary, secondary, primaryId, policy);
  return validateArchive(reconcile(result));
}

function preserveAlternatives(result, primary, secondary, personId, policy) {
  result.claims ||= [];
  const preferred = policy === "keep" ? primary : secondary;
  const alternate = policy === "keep" ? secondary : primary;
  // A full date cannot be copied onto a different preferred year. Keep its
  // precision in evidence when the preferred record only supplied a year.
  for (const key of ["birth", "death"]) {
    const dateKey = `${key}Date`;
    if (
      !preferred[dateKey] &&
      alternate[dateKey] &&
      !missing(preferred[key]) &&
      parseFamilyDate(alternate[dateKey]).year !== preferred[key]
    ) {
      result.claims.push({
        id: uid("claim"),
        personId,
        field: `Merged alternative: ${dateKey}`,
        value: alternate[dateKey],
        documentId: "",
        page: "",
        quote: "",
        notes:
          "Full date retained because it disagrees with the preferred year.",
        status: "unverified",
      });
    }
  }
  for (const key of [
    "first",
    "last",
    "gender",
    "birth",
    "death",
    "birthDate",
    "deathDate",
    "born",
    "bio",
  ])
    if (
      !missing(primary[key]) &&
      !missing(secondary[key]) &&
      primary[key] !== secondary[key]
    )
      result.claims.push({
        id: uid("claim"),
        personId,
        field: `Merged alternative: ${key}`,
        value: String(policy === "keep" ? secondary[key] : primary[key]),
        documentId: "",
        page: "",
        quote: "",
        notes: `Preserved while merging ${secondary.first} ${secondary.last}.`,
        status: "unverified",
      });
}
