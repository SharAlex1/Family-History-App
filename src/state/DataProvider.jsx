import React, { useState, useEffect, useMemo } from "react";
import { DataCtx } from "./DataContext.jsx";
import { MIN_YEAR } from "../config/theme.js";
import { uniq } from "../utils/ids.js";
import { makeSeed } from "../data/seed.js";
import { loadSaved, persist, normalize } from "../lib/storage.js";

export function DataProvider({ children }) {
  const [data, setData] = useState(() => { const s = loadSaved(); return s ? normalize(s) : makeSeed(); });
  useEffect(() => { persist(data); }, [data]);
  // safe lookups (tolerate dangling references after edits)
  const byId = useMemo(() => ({
    people: Object.fromEntries(data.people.map((p) => [p.id, p])),
    loc: Object.fromEntries(data.locations.map((l) => [l.id, l])),
    doc: Object.fromEntries(data.documents.map((d) => [d.id, d])),
    branch: Object.fromEntries(data.branches.map((b) => [b.id, b])),
  }), [data]);
  const getP = (id) => byId.people[id] || { id, first: "Unknown", last: "", gender: "", branches: [], birth: MIN_YEAR, death: null, born: "", parents: [], spouses: [], children: [], residences: [], bio: "" };
  const getL = (id) => byId.loc[id] || { id, name: "Unknown", region: "—", x: 500, y: 280 };
  const getD = (id) => byId.doc[id] || { id, title: "Unknown", type: "record", year: MIN_YEAR, people: [], events: [] };

  /* ----- CRUD actions ----- */
  const upsertArr = (arr, item) => { const i = arr.findIndex((x) => x.id === item.id); return i >= 0 ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item]; };

  const actions = useMemo(() => ({
    save: (key, item) => setData((d) => ({ ...d, [key]: upsertArr(d[key], item) })),
    savePerson: ({ person, linkedEventIds, linkedDocIds }) => setData((d) => {
      const people = upsertArr(d.people, person);
      const events = d.events.map((e) => {
        const should = linkedEventIds.includes(e.id), has = (e.people || []).includes(person.id);
        if (should && !has) return { ...e, people: [...(e.people || []), person.id] };
        if (!should && has) return { ...e, people: e.people.filter((x) => x !== person.id) };
        return e;
      });
      const documents = d.documents.map((doc) => {
        const should = linkedDocIds.includes(doc.id), has = (doc.people || []).includes(person.id);
        if (should && !has) return { ...doc, people: [...(doc.people || []), person.id] };
        if (!should && has) return { ...doc, people: doc.people.filter((x) => x !== person.id) };
        return doc;
      });
      return { ...d, people, events, documents };
    }),
    remove: (kind, id) => setData((d) => {
      if (kind === "people") {
        return {
          ...d,
          people: d.people.filter((p) => p.id !== id).map((p) => ({ ...p, parents: (p.parents || []).filter((x) => x !== id), spouses: (p.spouses || []).filter((x) => x !== id), children: (p.children || []).filter((x) => x !== id) })),
          events: d.events.map((e) => ({ ...e, people: (e.people || []).filter((x) => x !== id) })),
          documents: d.documents.map((doc) => ({ ...doc, people: (doc.people || []).filter((x) => x !== id) })),
          migrations: d.migrations.filter((m) => !(m.mode === "person" && m.personId === id)),
        };
      }
      if (kind === "locations") {
        return {
          ...d,
          locations: d.locations.filter((l) => l.id !== id),
          people: d.people.map((p) => ({ ...p, residences: (p.residences || []).filter((r) => r.at !== id), born: p.born === id ? "" : p.born })),
          migrations: d.migrations.filter((m) => m.from !== id && m.to !== id),
        };
      }
      if (kind === "events") return { ...d, events: d.events.filter((e) => e.id !== id), documents: d.documents.map((doc) => ({ ...doc, events: (doc.events || []).filter((x) => x !== id) })) };
      if (kind === "documents") return { ...d, documents: d.documents.filter((x) => x.id !== id), events: d.events.map((e) => ({ ...e, docs: (e.docs || []).filter((x) => x !== id) })) };
      if (kind === "branches") return { ...d, branches: d.branches.filter((b) => b.id !== id), people: d.people.map((p) => ({ ...p, branches: (p.branches || []).filter((b) => b !== id) })), migrations: d.migrations.map((m) => (m.branch === id ? { ...m, branch: "" } : m)) };
      if (kind === "migrations") return { ...d, migrations: d.migrations.filter((m) => m.id !== id) };
      return d;
    }),
    countRefs: (kind, id) => {
      if (kind === "people") return data.events.filter((e) => (e.people || []).includes(id)).length + data.documents.filter((x) => (x.people || []).includes(id)).length + data.people.filter((p) => [...(p.parents || []), ...(p.spouses || []), ...(p.children || [])].includes(id)).length;
      if (kind === "locations") return data.people.filter((p) => (p.residences || []).some((r) => r.at === id) || p.born === id).length + data.events.filter((e) => e.at === id).length + data.migrations.filter((m) => m.from === id || m.to === id).length;
      if (kind === "events") return data.documents.filter((x) => (x.events || []).includes(id)).length;
      if (kind === "branches") return data.people.filter((p) => (p.branches || []).includes(id)).length;
      return 0;
    },
    // Delete a branch and decide what happens to its members.
    // mode "remove": drop the branch from each member. mode "move": replace it with targetId.
    deleteBranch: (id, mode, targetId) => setData((d) => {
      const people = d.people.map((p) => {
        if (!(p.branches || []).includes(id)) return p;
        if (mode === "move" && targetId) return { ...p, branches: uniq((p.branches || []).map((b) => (b === id ? targetId : b))) };
        return { ...p, branches: (p.branches || []).filter((b) => b !== id) };
      });
      const migrations = d.migrations.map((m) => (m.branch === id ? { ...m, branch: mode === "move" && targetId ? targetId : "" } : m));
      return { ...d, branches: d.branches.filter((b) => b.id !== id), people, migrations };
    }),
    addRelationship: (aId, type, bId) => setData((d) => {
      const map = Object.fromEntries(d.people.map((p) => [p.id, { ...p, parents: [...(p.parents || [])], spouses: [...(p.spouses || [])], children: [...(p.children || [])] }]));
      const a = map[aId], b = map[bId]; if (!a || !b) return d;
      const add = (arr, v) => (arr.includes(v) ? arr : [...arr, v]);
      if (type === "parent") { a.children = add(a.children, bId); b.parents = add(b.parents, aId); }
      else if (type === "child") { a.parents = add(a.parents, bId); b.children = add(b.children, aId); }
      else if (type === "spouse") { a.spouses = add(a.spouses, bId); b.spouses = add(b.spouses, aId); }
      else if (type === "sibling") { const par = uniq([...a.parents, ...b.parents]); a.parents = par; b.parents = par; par.forEach((pp) => { if (map[pp]) map[pp].children = uniq([...map[pp].children, aId, bId]); }); }
      return { ...d, people: d.people.map((p) => map[p.id]) };
    }),
    removeRelationship: (aId, kind, bId) => setData((d) => {
      const map = Object.fromEntries(d.people.map((p) => [p.id, { ...p, parents: [...(p.parents || [])], spouses: [...(p.spouses || [])], children: [...(p.children || [])] }]));
      const a = map[aId], b = map[bId]; if (!a || !b) return d;
      const rm = (arr, v) => arr.filter((x) => x !== v);
      if (kind === "parent") { a.parents = rm(a.parents, bId); b.children = rm(b.children, aId); }
      else if (kind === "child") { a.children = rm(a.children, bId); b.parents = rm(b.parents, aId); }
      else if (kind === "spouse") { a.spouses = rm(a.spouses, bId); b.spouses = rm(b.spouses, aId); }
      return { ...d, people: d.people.map((p) => map[p.id]) };
    }),
    resetToSeed: () => setData(makeSeed()),
    importData: (raw) => setData(normalize(raw)),
    exportData: () => {
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "family-atlas-data.json"; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) { alert("Export isn't available in this preview. Run the downloaded file locally to export."); }
    },
  }), [data]);

  const ctx = { data, byId, getP, getL, getD, actions };
  return <DataCtx.Provider value={ctx}>{children}</DataCtx.Provider>;
}
