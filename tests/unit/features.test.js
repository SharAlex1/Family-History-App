import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseFamilyDate, exactAnniversary } from "../../src/lib/dates.js";
import { discoveries } from "../../src/lib/discoveries.js";
import {
  parseGedcom,
  duplicateCandidates,
  mergeImported,
  mergeExisting,
} from "../../src/lib/gedcom.js";
import { findRelationship, relativeIds } from "../../src/lib/relationships.js";
import { biography, bookHtml } from "../../src/lib/stories.js";
import { parseArchive } from "../../src/lib/storage.js";
import {
  validateArchive,
  reconcile,
  saveEntity,
} from "../../src/lib/archive.js";
import { cleanExtensions } from "../../src/lib/extensions.js";
import { makeSeed } from "../../src/data/seed.js";
import {
  prepareFile,
  readMediaBundle,
  storeFiles,
  hashBytes,
} from "../../src/lib/media.js";
import { zipSync, strToU8 } from "fflate";
import { statusAt, ageAt, residenceAt } from "../../src/utils/people.js";
const seed = () => parseArchive(makeSeed());
const ged = fs.readFileSync(
  new URL("../fixtures/family.ged", import.meta.url),
  "utf8",
);
const empty = () =>
  reconcile({
    people: [],
    locations: [],
    documents: [],
    events: [],
    migrations: [],
    branches: [],
  });
const mem = (id, replyTo = "") => ({
  id,
  replyTo,
  subjectKind: "people",
  subjectId: "yosef",
  author: "Alex",
  text: "Remembered account",
  kind: "memory",
  createdAt: "2026-10-17T12:00:00Z",
});

describe("historical dates and discovery accuracy", () => {
  it.each([
    ["12 MAY 1900", 1900, 5, 12, "exact"],
    ["ABT 1900", 1900, null, null, "about"],
    ["BEF 1940", 1940, null, null, "before"],
    ["2000-02-29", 2000, 2, 29, "exact"],
    ["BET 1890 AND 1900", 1890, null, null, "range"],
    ["FROM 80 TO 90", 80, null, null, "range"],
  ])("preserves precision for %s", (text, year, month, day, qualifier) => {
    expect(parseFamilyDate(text)).toEqual({
      text,
      year,
      month,
      day,
      qualifier,
    });
  });
  it.each([
    "1900-02-29",
    "2025-13-01",
    "2025-04-31",
    "BET nonsense",
    "BET 1900 AND 1800",
    "unknown",
  ])("rejects invalid date %s", (text) =>
    expect(() => parseFamilyDate(text)).toThrow(),
  );
  it("keeps unknown dates and life status unknown rather than inventing birthdays", () => {
    const d = seed(),
      p = d.people[0];
    p.birth = null;
    p.death = null;
    p.deceased = true;
    p.residences = [];
    expect(validateArchive(d)).toBe(d);
    expect(statusAt(p, 1950)).toBe("unknown");
    expect(ageAt(p, 1950)).toBeNull();
    expect(residenceAt(p, -20)).toBeNull();
    expect(biography(d, p.id)).toContain("birth date is not recorded");
    expect(biography(d, p.id)).toContain(
      "Death is recorded; its date is unknown",
    );
    expect(exactAnniversary("ABT 1900-05-12")).toBeNull();
    expect(exactAnniversary("1900")).toBeNull();
  });
  it("finds exact anniversaries, skips approximate dates, and handles the year boundary", () => {
    const d = seed();
    d.people[0].birthDate = "1888-12-31";
    d.people[0].birth = 1888;
    d.people[1].birthDate = "ABT 1890-12-31";
    d.people[1].birth = 1890;
    d.reminders = [
      { id: "r", title: "Reunion", personId: "", month: 1, day: 1 },
    ];
    const result = discoveries(d, new Date(2026, 11, 31));
    expect(result.today.some((o) => o.id === "yosef-birth")).toBe(true);
    expect(result.today.some((o) => o.id === `${d.people[1].id}-birth`)).toBe(
      false,
    );
    expect(result.upcoming.find((o) => o.id === "r").days).toBe(1);
  });
});

describe("GEDCOM review and merge", () => {
  it("imports dates, unknown facts, adoption, unmapped places, routes, events and citations", () => {
    const { data } = parseGedcom(ged, "Examples.ged");
    expect(data.people).toHaveLength(4);
    expect(validateArchive(data)).toBe(data);
    const ada = data.people.find((p) => p.first === "Ada"),
      casey = data.people.find((p) => p.first === "Casey"),
      dana = data.people.find((p) => p.first === "Dana");
    expect(ada.birthDate).toBe("12 MAY 1900");
    expect(casey.parents).toHaveLength(2);
    expect(Object.values(casey.parentTypes)).toEqual(["adoptive", "adoptive"]);
    expect(dana.birth).toBeNull();
    expect(dana.deceased).toBe(true);
    expect(data.locations.every((l) => l.unmapped && l.lat === null)).toBe(
      true,
    );
    expect(data.migrations).toHaveLength(1);
    expect(data.claims[0]).toMatchObject({
      page: "12",
      quote: "Date recorded in register",
      status: "unverified",
    });
    expect(data.events.some((e) => e.type === "marriage")).toBe(true);
  });
  it("rejects malformed syntax and unsupported encodings without touching the destination", () => {
    expect(() => parseGedcom("invalid")).toThrow();
    expect(() => parseGedcom(ged.replace("CHAR UTF-8", "CHAR ANSEL"))).toThrow(
      /UTF-8/,
    );
    expect(() => parseGedcom(ged.replace("1 NAME Ada", "3 NAME Ada"))).toThrow(
      /nesting/,
    );
  });
  it("matches names across diacritics and a small year discrepancy", () => {
    expect(
      duplicateCandidates([{ first: "José", last: "García", birth: 1900 }], {
        first: "Jose",
        last: "Garcia",
        birth: 1901,
      }),
    ).toHaveLength(1);
    expect(
      duplicateCandidates([{ first: "Jose", last: "Garcia", birth: 1900 }], {
        first: "Jose",
        last: "Garcia",
        birth: 1950,
      }),
    ).toHaveLength(0);
  });
  it("merges incoming duplicates, preserves alternatives, and redirects their children", () => {
    const incoming = parseGedcom(ged).data,
      base = mergeImported(empty(), incoming),
      ada = base.people.find((p) => p.first === "Ada"),
      other = parseGedcom(ged).data,
      newAda = other.people.find((p) => p.first === "Ada");
    newAda.bio = "A differing account";
    const choices = Object.fromEntries(
      other.people.map((p) => [
        p.id,
        base.people.find((x) => x.first === p.first).id,
      ]),
    );
    const result = mergeImported(base, other, choices);
    expect(result.people).toHaveLength(4);
    expect(result.people.find((p) => p.id === ada.id).bio).toBe(
      "First generation",
    );
    expect(result.claims.some((c) => c.value === "A differing account")).toBe(
      true,
    );
    expect(result.people.find((p) => p.first === "Casey").parents).toContain(
      ada.id,
    );
    expect(validateArchive(result)).toBe(result);
  });
  it("rejects mapping two incoming people to the same record", () => {
    const incoming = parseGedcom(ged).data;
    expect(() =>
      mergeImported(
        seed(),
        incoming,
        Object.fromEntries(incoming.people.map((p) => [p.id, "yosef"])),
      ),
    ).toThrow(/different existing/);
  });
  it("merges local duplicates across all feature references and retains conflicting facts", () => {
    const d = seed(),
      original = d.people[0],
      dupe = {
        ...structuredClone(original),
        id: "duplicate",
        parents: [],
        children: [],
        spouses: [],
        siblings: [],
        bio: "Other account",
      };
    d.people.push(dupe);
    d.memories = [{ ...mem("memory"), subjectId: "duplicate" }];
    d.reminders = [
      { id: "r", personId: "duplicate", title: "Day", month: 1, day: 1 },
    ];
    d.books = [
      {
        id: "b",
        title: "Book",
        people: ["duplicate"],
        narrative: "Story",
        createdAt: "2026-10-17",
      },
    ];
    const result = mergeExisting(d, original.id, "duplicate");
    expect(result.people).toHaveLength(d.people.length - 1);
    expect(result.memories[0].subjectId).toBe(original.id);
    expect(result.books[0].people).toEqual([original.id]);
    expect(result.reminders[0].personId).toBe(original.id);
    expect(result.claims.some((c) => c.value === "Other account")).toBe(true);
    expect(validateArchive(result)).toBe(result);
  });
  it("rejects merging two relatives recorded as different people", () =>
    expect(() => mergeExisting(seed(), "yosef", "miriam")).toThrow(
      /distinct relatives/,
    ));
});

describe("family connections", () => {
  const p = (id, parents = [], gender = "") => ({
    id,
    parents,
    children: [],
    spouses: [],
    siblings: [],
    gender,
  });
  const people = [
    p("g"),
    p("a", ["g"]),
    p("b", ["g"]),
    p("x", ["a"]),
    p("y", ["b"]),
    p("z", ["y"]),
  ];
  // Build the reciprocal edges used by both graph traversal and UI.
  people.forEach((child) =>
    child.parents.forEach((id) =>
      people.find((p) => p.id === id).children.push(child.id),
    ),
  );
  it("finds ancestors, cousins and removed cousins using recorded links", () => {
    expect(findRelationship(people, "x", "g").label).toBe("grandparent");
    expect(findRelationship(people, "x", "y").label).toBe("first cousin");
    expect(findRelationship(people, "x", "z").label).toBe(
      "first cousin once removed",
    );
    expect(findRelationship(people, "x", "y").path.map((p) => p.id)).toEqual([
      "x",
      "a",
      "g",
      "b",
      "y",
    ]);
    expect(findRelationship(people, "a", "a").label).toBe("Same person");
  });
  it("limits graph exploration by generations and direction", () => {
    expect([...relativeIds(people, "g", "descendants", 1)].sort()).toEqual([
      "a",
      "b",
      "g",
    ]);
    expect([...relativeIds(people, "x", "ancestors", 3)].sort()).toEqual([
      "a",
      "g",
      "x",
    ]);
  });
});

describe("extended archive integrity and portable books", () => {
  it("upgrades old archives without dropping core records", () => {
    const d = makeSeed(),
      parsed = parseArchive({ ...d, schemaVersion: 1 });
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.people).toHaveLength(13);
    expect(parsed.memories).toEqual([]);
  });
  it("rejects missing subjects, invalid reminder dates and reply cycles", () => {
    for (const mutate of [
      (d) => (d.memories = [{ ...mem("a"), subjectId: "absent" }]),
      (d) =>
        (d.reminders = [
          { id: "r", title: "Day", personId: "", month: 2, day: 30 },
        ]),
      (d) => (d.memories = [mem("a", "b"), mem("b", "a")]),
    ]) {
      const d = seed();
      mutate(d);
      expect(() => validateArchive(d)).toThrow();
    }
  });
  it("removes a parent type when deleting its person and clears deleted-subject contributions", () => {
    const d = seed();
    d.people.find((p) => p.id === "miriam").parentTypes = { yosef: "adoptive" };
    d.memories = [mem("a"), mem("b", "a")];
    const next = {
      ...d,
      people: d.people
        .filter((p) => p.id !== "yosef")
        .map((p) => ({
          ...p,
          parents: p.parents.filter((id) => id !== "yosef"),
          children: p.children.filter((id) => id !== "yosef"),
          spouses: p.spouses.filter((id) => id !== "yosef"),
        })),
      events: d.events.map((e) => ({
        ...e,
        people: e.people.filter((id) => id !== "yosef"),
      })),
      documents: d.documents.map((e) => ({
        ...e,
        people: e.people.filter((id) => id !== "yosef"),
      })),
      migrations: d.migrations.filter((m) => m.personId !== "yosef"),
    };
    const cleaned = cleanExtensions(next, "people", "yosef");
    expect(cleaned.memories).toEqual([]);
    expect(cleaned.people.find((p) => p.id === "miriam").parentTypes).toEqual(
      {},
    );
    expect(validateArchive(cleaned)).toBe(cleaned);
  });
  it("keeps replies when removing their parent contribution, with no dangling reference", () => {
    const d = seed();
    d.memories = [mem("a"), mem("b", "a")];
    expect(cleanExtensions(d, "memories", "a").memories).toEqual([
      { ...mem("b"), replyTo: "" },
    ]);
  });
  it("exports book content with escaped text and no fabricated unknown birth date", async () => {
    const d = seed();
    d.people[0].birth = null;
    const html = await bookHtml(
      d,
      ["yosef"],
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("Sources and evidence");
  });
});

describe("media validation and ZIP integrity", () => {
  it("allows empty uploads when no media storage is needed", async () =>
    expect(await storeFiles([])).toEqual([]));
  it("stores a content-addressed file descriptor and rejects active or oversized files", async () => {
    const file = new File(["record"], "record.txt", { type: "text/plain" }),
      prepared = await prepareFile(file);
    expect(prepared.metadata.id).toBe(
      `file_${await hashBytes(new TextEncoder().encode("record"))}`,
    );
    expect(prepared.record.blob.size).toBe(6);
    await expect(
      prepareFile(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" })),
    ).rejects.toThrow(/SVG/);
    await expect(
      prepareFile({ type: "audio/mpeg", size: 101 * 1024 * 1024 }),
    ).rejects.toThrow(/100 MB/);
  });
  it("reads a complete ZIP and rejects tampered or missing file bytes", async () => {
    const d = seed(),
      bytes = new TextEncoder().encode("archival text"),
      sha256 = await hashBytes(bytes),
      file = {
        id: `file_${sha256}`,
        name: "note.txt",
        size: bytes.length,
        type: "text/plain",
        sha256,
      };
    d.documents[0].files = [file];
    const zip = (files) =>
      new File(
        [zipSync({ "archive.json": strToU8(JSON.stringify(d)), ...files })],
        "archive.zip",
      );
    expect(
      (await readMediaBundle(zip({ [`media/${file.id}`]: bytes }))).records,
    ).toHaveLength(1);
    await expect(readMediaBundle(zip({}))).rejects.toThrow(
      /Missing or damaged/,
    );
    await expect(
      readMediaBundle(
        zip({ [`media/${file.id}`]: new TextEncoder().encode("tampered") }),
      ),
    ).rejects.toThrow(/damaged/);
  });
  it("rejects attachment metadata that can alias unrelated files", async () => {
    const d = seed(),
      p = await prepareFile(new File(["x"], "x.txt", { type: "text/plain" }));
    d.documents[0].files = [{ ...p.metadata, id: "wrong" }];
    expect(() => validateArchive(d)).toThrow(/metadata/);
  });
  it("clears a portrait when the archive attachment is detached", async () => {
    const d = seed(),
      p = await prepareFile(new File(["x"], "x.png", { type: "image/png" }));
    d.documents[0].files = [p.metadata];
    d.people[0].photoFileId = p.metadata.id;
    expect(validateArchive(d)).toBe(d);
    const next = saveEntity(d, "documents", { ...d.documents[0], files: [] });
    expect(next.people[0].photoFileId).toBe("");
    expect(validateArchive(next)).toBe(next);
  });
});

it.each(["keep", "incoming"])(
  "preserves a full conflicting date when the preferred record has only a year (%s)",
  (policy) => {
    const d = parseGedcom(ged).data,
      ada = d.people.find((p) => p.first === "Ada");
    const yearOnly = {
      ...structuredClone(ada),
      id: "year-only",
      birth: 1899,
      birthDate: "",
      parents: [],
      children: [],
      spouses: [],
      siblings: [],
    };
    d.people.push(yearOnly);
    const result =
      policy === "keep"
        ? mergeExisting(d, yearOnly.id, ada.id, policy)
        : mergeExisting(d, ada.id, yearOnly.id, policy);
    expect(
      result.people.find(
        (p) => p.id === (policy === "keep" ? yearOnly.id : ada.id),
      ).birth,
    ).toBe(1899);
    expect(
      result.claims.some(
        (c) =>
          c.field === "Merged alternative: birthDate" &&
          c.value === "12 MAY 1900",
      ),
    ).toBe(true);
    expect(validateArchive(result)).toBe(result);
  },
);
