import { tr } from "../i18n/index.js";
import React, { useState, useRef, useEffect } from "react";
import { DataCtx } from "./DataContext.jsx";
import { cleanExtensions } from "../lib/extensions.js";
import { MIN_YEAR } from "../config/theme.js";
import { makeSeed } from "../data/seed.js";
import { uniq } from "../utils/ids.js";
import {
  readArchive,
  writeArchive,
  parseArchive,
  backupArchive,
  readBackup,
  downloadArchive,
  LS_KEY,
} from "../lib/storage.js";
import {
  validateArchive,
  reconcile,
  replacePerson,
  syncResidences,
  saveEntity,
  changeRelationship,
} from "../lib/archive.js";

export function DataProvider({ children }) {
  const [initial] = useState(readArchive);
  const [data, setData] = useState(initial.data);
  const [notice, setNotice] = useState(initial.error || "");
  const [dirty, setDirty] = useState(false);
  const current = useRef(initial.data);
  const blocked = useRef(Boolean(initial.error));
  const dirtyRef = useRef(false);
  const apply = (d) => {
    current.current = d;
    setData(d);
  };
  const unsaved = (value) => {
    dirtyRef.current = value;
    setDirty(value);
  };
  const lock = (fn) =>
    navigator.locks
      ? navigator.locks.request("family-atlas-archive", fn)
      : Promise.resolve().then(fn);

  useEffect(() => {
    if (!initial.error) {
      // Preserve the old format before the first migration; skip writes when already current.
      lock(() => {
        const loaded = readArchive();
        if (loaded.error) {
          blocked.current = true;
          setNotice(loaded.error);
          return;
        }
        if (loaded.raw && JSON.stringify(loaded.data) === loaded.raw) {
          apply(loaded.data);
          return;
        }
        try {
          apply(
            writeArchive(
              loaded.data,
              loaded.data._revision || 0,
              Boolean(loaded.raw),
            ),
          );
        } catch (e) {
          setNotice(tr("Could not save the archive: {{v0}}", {v0: e.message}));
          unsaved(true);
        }
      });
    }
    function changed(event) {
      if (event.key !== LS_KEY) return;
      const latest = readArchive();
      if (latest.error) {
        setNotice(latest.error);
        return;
      }
      if (dirtyRef.current) {
        setNotice(
          tr("Another tab changed the archive while this tab has unsaved work. Export your work before loading the latest archive."),
        );
        return;
      }
      apply(latest.data);
    }
    function leaving(event) {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("storage", changed);
    window.addEventListener("beforeunload", leaving);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("beforeunload", leaving);
    };
  }, []);

  async function mutate(operation, { backup = false, replace = false } = {}) {
    return lock(() => {
      if (blocked.current && !replace) {
        setNotice(
          initial.error ||
            tr("Recover or replace the unreadable archive before editing."),
        );
        return false;
      }
      const latest = readArchive();
      if (latest.error && !replace && !dirtyRef.current) {
        setNotice(latest.error);
        return false;
      }
      if (
        dirtyRef.current &&
        (latest.data._revision || 0) !== (current.current._revision || 0)
      ) {
        setNotice(
          tr("Another tab changed the archive. Export your unsaved work, then load the latest archive."),
        );
        return false;
      }
      const base = dirtyRef.current ? current.current : latest.data;
      let next;
      try {
        next = validateArchive(operation(base));
      } catch (e) {
        setNotice(e.message);
        return false;
      }
      try {
        if (replace && latest.error) {
          backupArchive(latest.raw);
          // Recover a malformed JSON archive only after explicit replacement confirmation.
          const saved = {
            ...next,
            _revision: (current.current._revision || 0) + 1,
          };
          window.localStorage.setItem(LS_KEY, JSON.stringify(saved));
          apply(saved);
        } else apply(writeArchive(next, base._revision || 0, backup));
        blocked.current = false;
        unsaved(false);
        setNotice("");
      } catch (e) {
        if (replace) {
          setNotice(
            tr("Could not replace the archive: {{v0}} The current archive is unchanged.", {v0: e.message}),
          );
          return false;
        }
        apply({ ...next, _revision: base._revision || 0 });
        unsaved(true);
        setNotice(
          tr("Could not save the archive: {{v0}} Your changes are not saved. Export them or retry.", {v0: e.message}),
        );
      }
      return true;
    });
  }
  function checkRecord(base, key, item, expected) {
    const actual = base[key].find((x) => x.id === item.id);
    if (expected && JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        tr("This record changed in another tab. Cancel and reopen the editor to use the latest version."),
      );
  }
  const actions = {
    save: (key, item, expected) =>
      mutate((d) => {
        checkRecord(d, key, item, expected);
        return saveEntity(d, key, item);
      }),
    savePerson: ({ person, linkedEventIds, linkedDocIds, original }) =>
      mutate((d) => {
        checkRecord(d, "people", person, original);
        let next = replacePerson(d, person);
        next.events = next.events.map((e) => ({
          ...e,
          people: linkedEventIds.includes(e.id)
            ? uniq([...e.people, person.id])
            : e.people.filter((id) => id !== person.id),
        }));
        next.documents = next.documents.map((doc) => ({
          ...doc,
          people: linkedDocIds.includes(doc.id)
            ? uniq([...doc.people, person.id])
            : doc.people.filter((id) => id !== person.id),
        }));
        return syncResidences(
          next,
          person.id,
          d.people.find((p) => p.id === person.id),
        );
      }),
    remove: (kind, id) =>
      mutate((d) => {
        let next = { ...d, [kind]: d[kind].filter((x) => x.id !== id) };
        if (kind === "people") {
          next.people = next.people.map((p) => ({
            ...p,
            parents: p.parents.filter((x) => x !== id),
            children: p.children.filter((x) => x !== id),
            spouses: p.spouses.filter((x) => x !== id),
            siblings: (p.siblings || []).filter((x) => x !== id),
          }));
          next.events = d.events.map((e) => ({
            ...e,
            people: e.people.filter((x) => x !== id),
          }));
          next.documents = d.documents.map((doc) => ({
            ...doc,
            people: doc.people.filter((x) => x !== id),
          }));
          next.migrations = d.migrations.filter((m) => m.personId !== id);
        }
        if (kind === "locations") {
          next.people = d.people.map((p) => ({
            ...p,
            born: p.born === id ? "" : p.born,
            residences: p.residences.filter((r) => r.at !== id),
          }));
          next.events = d.events.map((e) => ({
            ...e,
            at: e.at === id ? "" : e.at,
          }));
          next.migrations = d.migrations.filter(
            (m) => m.from !== id && m.to !== id,
          );
          for (const p of next.people)
            next = syncResidences(
              next,
              p.id,
              d.people.find((x) => x.id === p.id),
            );
        }
        if (kind === "events")
          next.documents = d.documents.map((doc) => ({
            ...doc,
            events: doc.events.filter((x) => x !== id),
          }));
        if (kind === "documents")
          next.events = d.events.map((e) => ({
            ...e,
            docs: e.docs.filter((x) => x !== id),
          }));
        if (kind === "migrations") {
          const m = d.migrations.find((m) => m.id === id);
          if (m?.source === "residence") {
            const p = d.people.find((p) => p.id === m.personId);
            next.people = d.people.map((x) =>
              x.id === p.id
                ? {
                    ...x,
                    residences: x.residences.filter(
                      (r) => !(r.at === m.to && r.from === m.startYear),
                    ),
                  }
                : x,
            );
            next = syncResidences(next, p.id, p);
          }
        }
        return cleanExtensions(next,kind,id);
      }),
    countRefs: (kind, id) =>
      kind === "branches"
        ? data.people.filter((p) => p.branches.includes(id)).length
        : kind === "locations"
          ? data.people.filter(
              (p) => p.born === id || p.residences.some((r) => r.at === id),
            ).length +
            data.events.filter((e) => e.at === id).length +
            data.migrations.filter((m) => m.from === id || m.to === id).length
          : kind === "people"
            ? data.people.filter((p) =>
                [
                  ...p.parents,
                  ...p.children,
                  ...p.spouses,
                  ...(p.siblings || []),
                ].includes(id),
              ).length +
              data.events.filter((e) => e.people.includes(id)).length +
              data.documents.filter((doc) => doc.people.includes(id)).length
            : kind === "events"
              ? data.documents.filter((doc) => doc.events.includes(id)).length
              : kind === "documents"
                ? data.events.filter((e) => e.docs.includes(id)).length
                : 0,
    deleteBranch: (id, mode, targetId) =>
      mutate((d) => {
        if (
          mode === "move" &&
          !d.branches.some((b) => b.id === targetId && b.id !== id)
        )
          throw new Error(tr("Choose an existing destination branch."));
        return {
          ...d,
          branches: d.branches.filter((b) => b.id !== id),
          people: d.people.map((p) => ({
            ...p,
            branches: uniq(
              p.branches.flatMap((b) =>
                b !== id ? [b] : mode === "move" ? [targetId] : [],
              ),
            ),
          })),
          migrations: d.migrations.flatMap((m) =>
            m.branch !== id
              ? [m]
              : m.mode === "branch" && mode !== "move"
                ? []
                : [{ ...m, branch: mode === "move" ? targetId : "" }],
          ),
        };
      }),
    addRelationship: (a, type, b, parentType = 'biological') =>
      mutate((d) => { const next=changeRelationship(d,a,type,b);if(type==='parent'||type==='child'){const child=type==='parent'?b:a,parent=type==='parent'?a:b;next.people=next.people.map(p=>p.id===child?{...p,parentTypes:{...p.parentTypes,[parent]:parentType}}:p);}return next;}),
    removeRelationship: (a, type, b) =>
      mutate((d) =>
        changeRelationship(
          d,
          a,
          {
            parent: "child",
            child: "parent",
            spouse: "spouse",
            sibling: "sibling",
          }[type],
          b,
          true,
        ),
      ),
    resetToSeed: () =>
      mutate(() => reconcile(makeSeed()), { backup: true, replace: true }),
    importData: (raw) => {
      let parsed;
      try {
        parsed = parseArchive(raw);
      } catch (e) {
        setNotice(e.message);
        return Promise.resolve(false);
      }
      return mutate(() => parsed, { backup: true, replace: true });
    },
    mergeData: operation => mutate(operation,{backup:true}),
    reportError: message => setNotice(message),
    restoreBackup: async () => {
      try {
        return await actions.importData(readBackup());
      } catch (e) {
        setNotice(e.message);
        return false;
      }
    },
    exportData: () => {
      try {
        downloadArchive(current.current);
      } catch (e) {
        setNotice(tr("Could not export: {{v0}}", {v0: e.message}));
      }
    },
    exportOriginal: () => {
      try {
        downloadArchive(
          initial.raw || current.current,
          "family-atlas-recovery.json",
        );
      } catch (e) {
        setNotice(tr("Could not export: {{v0}}", {v0: e.message}));
      }
    },
    retrySave: () => mutate((d) => d),
    loadLatest: () => {
      const latest = readArchive();
      if (latest.error) {
        setNotice(latest.error);
        return;
      }
      apply(latest.data);
      unsaved(false);
      blocked.current = false;
      setNotice("");
    },
    dismissNotice: () => setNotice(""),
  };
  const byId = {
    people: Object.fromEntries(data.people.map((p) => [p.id, p])),
    loc: Object.fromEntries(data.locations.map((l) => [l.id, l])),
    doc: Object.fromEntries(data.documents.map((doc) => [doc.id, doc])),
    branch: Object.fromEntries(data.branches.map((b) => [b.id, b])),
  };
  const getP = (id) =>
    byId.people[id] || {
      id,
      first: "Unknown",
      last: "",
      gender: "",
      branches: [],
      birth: MIN_YEAR,
      death: null,
      born: "",
      parents: [],
      spouses: [],
      children: [],
      siblings: [],
      residences: [],
      bio: "",
    };
  const getL = (id) =>
    byId.loc[id] || { id, name: "Unknown", region: "", x: 500, y: 280 };
  const getD = (id) =>
    byId.doc[id] || {
      id,
      title: "Unknown",
      type: "record",
      year: MIN_YEAR,
      people: [],
      events: [],
    };
  return (
    <DataCtx.Provider
      value={{ data, byId, getP, getL, getD, actions, notice, dirty }}
    >
      {children}
    </DataCtx.Provider>
  );
}
