import { describe, it, expect, vi, afterEach } from "vitest";
import { makeSeed } from "../../src/data/seed.js";
import {
  validateArchive,
  reconcile,
  replacePerson,
  syncResidences,
  saveEntity,
  changeRelationship,
} from "../../src/lib/archive.js";
import {
  parseArchive,
  writeArchive,
  readArchive,
  LS_KEY,
  BACKUP_KEY,
} from "../../src/lib/storage.js";
import { computeGenerations } from "../../src/features/tree/FamilyTreeView.jsx";
import { timeBounds } from "../../src/utils/time.js";

const archive = () => reconcile(makeSeed());
const person = (d, id) => d.people.find((p) => p.id === id);
afterEach(() => vi.unstubAllGlobals());
describe("archive invariants", () => {
  it("validates the seed and repairs legacy event/document links without losing either assertion", () => {
    const d = parseArchive(makeSeed());
    expect(validateArchive(d)).toBe(d);
    expect(d.documents.find((x) => x.id === "d8").events).toContain("e4");
  });
  it("rejects wrong shapes, duplicate IDs, invalid nested records, unknown versions, and dangling references", () => {
    expect(() => parseArchive({ hello: "world" })).toThrow();
    for (const mutate of [
      (d) => d.people.push({ ...d.people[0] }),
      (d) => d.people[0].residences.push(null),
      (d) => (d.schemaVersion = 99),
      (d) => (d.events[0].at = "absent"),
    ]) {
      const d = makeSeed();
      mutate(d);
      expect(() => parseArchive(d)).toThrow();
    }
  });
  it("updates and removes reciprocal relationships through the person editor", () => {
    const d = archive();
    const a = { ...person(d, "hannah"), spouses: ["miriam"] };
    const next = replacePerson(d, a);
    expect(person(next, "miriam").spouses).toContain("hannah");
    expect(
      person(
        replacePerson(next, { ...person(next, "hannah"), spouses: [] }),
        "miriam",
      ).spouses,
    ).not.toContain("hannah");
  });
  it("rejects self-links and ancestor cycles even when bypassing UI guards", () => {
    const d = archive();
    expect(() => changeRelationship(d, "rivka", "parent", "rivka")).toThrow();
    expect(() =>
      validateArchive(changeRelationship(d, "noah", "parent", "yosef")),
    ).toThrow();
  });
  it("records siblings with unknown parents without inventing parentage", () => {
    const d = archive(),
      next = changeRelationship(d, "yosef", "sibling", "daniel");
    expect(person(next, "daniel").siblings).toContain("yosef");
    expect(person(next, "yosef").parents).toEqual([]);
    expect(person(next, "daniel").parents).toEqual([]);
  });
  it("updates event/document links in both directions and handles unlinking", () => {
    const d = archive();
    const e = { ...d.events.find((x) => x.id === "e1"), docs: ["d8"] };
    const next = saveEntity(d, "events", e);
    expect(next.documents.find((x) => x.id === "d8").events).toContain("e1");
    const doc = { ...next.documents.find((x) => x.id === "d8"), events: [] };
    expect(
      saveEntity(next, "documents", doc).events.find((x) => x.id === "e1").docs,
    ).not.toContain("d8");
  });
  it("regenerates residence routes while preserving additional historical routes", () => {
    const d = archive(),
      old = person(d, "hannah");
    d.migrations.push({
      id: "extra",
      mode: "person",
      personId: "hannah",
      branch: "kaminski",
      from: "la",
      to: "sf",
      startYear: 1990,
      endYear: null,
      description: "Independent record",
    });
    const next = syncResidences(
      replacePerson(d, {
        ...old,
        residences: [...old.residences, { at: "sf", from: 2000 }],
      }),
      "hannah",
      old,
    );
    expect(next.migrations.some((m) => m.id === "extra")).toBe(true);
    expect(
      next.migrations.some(
        (m) =>
          m.personId === "hannah" &&
          m.to === "sf" &&
          m.startYear === 2000 &&
          m.source === "residence",
      ),
    ).toBe(true);
  });
  it("rejects invalid coordinates, fractional years, impossible migrations and pre-birth residences", () => {
    for (const mutate of [
      (d) => (d.locations[0].lat = 999),
      (d) => (d.events[0].year = 2000.5),
      (d) => (d.migrations[0].endYear = 1800),
      (d) => (d.people[0].residences[0].from = 1800),
    ]) {
      const d = archive();
      mutate(d);
      expect(() => validateArchive(d)).toThrow();
    }
  });
  it("keeps children below parents after spouse alignment", () => {
    const rows = computeGenerations([
      { id: "a", parents: [], children: ["b"], spouses: [] },
      { id: "b", parents: ["a"], children: ["c"], spouses: [] },
      { id: "c", parents: ["b"], children: [], spouses: ["x"] },
      { id: "x", parents: [], children: ["y"], spouses: ["c"] },
      { id: "y", parents: ["x"], children: [], spouses: [] },
    ]);
    expect(rows.findIndex((r) => r.some((p) => p.id === "y"))).toBeGreaterThan(
      rows.findIndex((r) => r.some((p) => p.id === "x")),
    );
  });
  it("includes older and future records in time bounds", () => {
    const d = archive();
    d.people[0].birth = 1750;
    d.events[0].year = 2100;
    expect(timeBounds(d)).toEqual({ min: 1750, max: 2100 });
  });
});
it('preserves descriptions and end years when editing a residence-derived route', () => {
  const d=archive(),route=d.migrations.find(m=>m.personId==='yosef');
  const updated=saveEntity(d,'migrations',{...route,description:'Verified passenger record',endYear:route.startYear+1});
  const saved=updated.migrations.find(m=>m.id===route.id);
  expect(saved.description).toBe('Verified passenger record');expect(saved.endYear).toBe(route.startYear+1);
  expect(validateArchive(updated)).toBe(updated);
});

describe("recoverable persistence", () => {
  function storage(raw) {
    const values = new Map(raw ? [[LS_KEY, raw]] : []);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k) => values.get(k) ?? null,
        setItem: (k, v) => values.set(k, v),
      },
    });
    return values;
  }
  it("refuses a stale write and retains the newer revision", () => {
    const d = { ...archive(), _revision: 2 },
      values = storage(JSON.stringify(d));
    expect(() => writeArchive(d, 1)).toThrow(/Another tab/);
    expect(JSON.parse(values.get(LS_KEY))._revision).toBe(2);
  });
  it("backs up the previous archive before replacement and advances its revision", () => {
    const d = { ...archive(), _revision: 3 },
      raw = JSON.stringify(d),
      values = storage(raw);
    expect(writeArchive(d, 3, true)._revision).toBe(4);
    expect(values.get(BACKUP_KEY)).toBe(raw);
  });
  it("leaves a corrupt archive untouched and reports recovery information", () => {
    const values = storage("{broken");
    const read = readArchive();
    expect(read.error).toMatch(/not been overwritten/);
    expect(values.get(LS_KEY)).toBe("{broken");
  });
  it("propagates a storage failure rather than falsely reporting a durable save", () => {
    storage();
    window.localStorage.setItem = () => {
      throw new Error("Quota exceeded");
    };
    expect(() => writeArchive(archive(), 0)).toThrow(/Quota/);
  });
});
