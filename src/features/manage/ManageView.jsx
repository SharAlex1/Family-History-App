import React, { useState, useRef } from "react";
import { GitBranch, Clock, MapPin, Users, FileText, Search, ChevronRight, Plus, Pencil, Trash2, Download, Upload, RotateCcw, Link2, Route } from "lucide-react";
import { C } from "../../config/theme.js";
import { TYPE, DOC_ICON } from "../../config/eventTypes.js";
import { fullName } from "../../utils/people.js";
import { parseArchive } from "../../lib/storage.js";
import { COLLECTIONS } from "../../lib/archive.js";
import { useData } from "../../state/DataContext.jsx";
import { Avatar, Btn, EmptyState } from "../../components/ui/Primitives.jsx";
import { Modal, ConfirmDialog, BranchDeleteDialog } from "../../components/ui/Dialogs.jsx";
import { PersonForm } from "./forms/PersonForm.jsx";
import { LocationForm } from "./forms/LocationForm.jsx";
import { EventForm } from "./forms/EventForm.jsx";
import { MigrationForm } from "./forms/MigrationForm.jsx";
import { DocumentForm } from "./forms/DocumentForm.jsx";
import { BranchForm } from "./forms/BranchForm.jsx";
import { RelationshipsTab } from "./RelationshipsTab.jsx";

const MANAGE_TABS = [
  { id: "people", label: "People", Icon: Users },
  { id: "relationships", label: "Relationships", Icon: Link2 },
  { id: "locations", label: "Locations", Icon: MapPin },
  { id: "events", label: "Events", Icon: Clock },
  { id: "migrations", label: "Migrations", Icon: Route },
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "branches", label: "Branches", Icon: GitBranch },
];


function ManageView({ openPerson }) {
  const { data, actions, getL, getP } = useData();
  const [tab, setTab] = useState("people");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // {kind, item|null}
  const [confirm, setConfirm] = useState(null); // {kind, id, name, refs}
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState("");
  const [branchDel, setBranchDel] = useState(null); // {id, name, count}
  const fileRef = useRef(null);

  const close = () => setEditing(null);

  function onImport(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { setPendingImport(parseArchive(r.result)); setImportError(""); } catch (err) { setImportError(`Could not read that file: ${err.message}`); } };
    r.onerror = () => setImportError("Could not read that file. Try exporting it again.");
    r.readAsText(file); e.target.value = "";
  }

  return (
    <div style={{ padding: "22px 24px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: 0 }}>Manage Family Data</h2>
          <p style={{ color: C.faint, fontSize: 13, margin: "4px 0 0" }}>Every change here updates the tree, timeline, map, and profiles instantly.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn kind="soft" small icon={Download} onClick={actions.exportData}>Export JSON</Btn>
          <Btn kind="soft" small icon={Upload} onClick={() => fileRef.current?.click()}>Import JSON</Btn>
          <Btn kind="soft" small icon={RotateCcw} onClick={() => setConfirm({kind:"restore"})}>Restore previous archive</Btn>
          <Btn kind="danger" small icon={RotateCcw} onClick={() => setConfirm({ kind: "reset" })}>Reset to sample</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: "none" }} />
        </div>
      </div>

      {importError && <p role="alert" style={{color:C.danger}}>{importError}</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, marginTop: 16, marginBottom: 18 }}>
        {MANAGE_TABS.map(({ id, label, Icon }) => {
          const on = tab === id; const count = id === "relationships" ? null : (data[id] || []).length;
          return (
            <button key={id} onClick={() => { setTab(id); setQ(""); }} className="fa-click" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, padding: "10px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${on ? C.amber : "transparent"}`, color: on ? C.text : C.sub, marginBottom: -1 }}>
              <Icon size={15} />{label}{count != null && <span style={{ fontSize: 11, color: C.faint }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {tab === "relationships"
        ? <RelationshipsTab />
        : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 360 }}>
                <Search size={15} color={C.faint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} style={{ width: "100%", background: C.panel2, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, borderRadius: 10, padding: "9px 12px 9px 34px", outline: "none" }} />
              </div>
              <Btn kind="primary" icon={Plus} onClick={() => setEditing({ kind: tab, item: null })}>Add {singular(tab)}</Btn>
            </div>
            <EntityList kind={tab} q={q} getL={getL} getP={getP} onEdit={(item) => setEditing({ kind: tab, item })} onDelete={(row) => { if (tab === "branches") setBranchDel({ id: row.id, name: row.name, count: actions.countRefs("branches", row.id) }); else setConfirm({ kind: tab, id: row.id, name: rowName(tab, row, getP, getL), refs: actions.countRefs(tab, row.id) }); }} onOpenPerson={openPerson} />
          </>
        )}

      {pendingImport && <Modal title="Replace the current archive?" onClose={() => setPendingImport(null)}>
        <p>This import will replace your current archive. The previous archive will be backed up in this browser first.</p>
        <ul>{COLLECTIONS.map(key => <li key={key}>{key}: {pendingImport[key].length}</li>)}</ul>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><Btn onClick={() => setPendingImport(null)}>Cancel</Btn><Btn kind="primary" onClick={async () => { if (await actions.importData(pendingImport)) setPendingImport(null); }}>Replace archive</Btn></div>
      </Modal>}
      {confirm?.kind === 'restore' && <ConfirmDialog title="Restore the previous archive?" message="Your current archive will be backed up before the previous archive is restored. Export a copy first if you want to keep additional history." confirmLabel="Restore archive" onCancel={() => setConfirm(null)} onConfirm={async () => { if (await actions.restoreBackup()) setConfirm(null); }} />}
      {editing && (
        <Modal wide={editing.kind === "people"} title={`${editing.item ? "Edit" : "Add"} ${singular(editing.kind)}`} subtitle={editing.kind === "people" ? "Fields marked * are required." : null} onClose={close}>
          {editing.kind === "people" && <PersonForm value={editing.item} onSave={async (payload) => { if (await actions.savePerson(payload)) close(); }} onCancel={close} />}
          {editing.kind === "locations" && <LocationForm value={editing.item} onSave={async (v) => { if (await actions.save("locations", v, editing.item)) close(); }} onCancel={close} />}
          {editing.kind === "events" && <EventForm value={editing.item} onSave={async (v) => { if (await actions.save("events", v, editing.item)) close(); }} onCancel={close} />}
          {editing.kind === "migrations" && <MigrationForm value={editing.item} onSave={async (v) => { if (await actions.save("migrations", v, editing.item)) close(); }} onCancel={close} />}
          {editing.kind === "documents" && <DocumentForm value={editing.item} onSave={async (v) => { if (await actions.save("documents", v, editing.item)) close(); }} onCancel={close} />}
          {editing.kind === "branches" && <BranchForm value={editing.item} onSave={async (v) => { if (await actions.save("branches", v, editing.item)) close(); }} onCancel={close} />}
        </Modal>
      )}

      {confirm && confirm.kind === "reset" && (
        <ConfirmDialog title="Reset to sample data?" confirmLabel="Reset everything" message="This replaces all your current data with the original Kaminski–Roth sample. This cannot be undone." onCancel={() => setConfirm(null)} onConfirm={async () => { if (await actions.resetToSeed()) setConfirm(null); }} />
      )}
      {confirm && confirm.kind !== "reset" && confirm.kind !== "restore" && (
        <ConfirmDialog title={`Delete "${confirm.name}"?`} message={refMessage(confirm)} onCancel={() => setConfirm(null)} onConfirm={async () => { if (await actions.remove(confirm.kind, confirm.id)) setConfirm(null); }} />
      )}
      {branchDel && (
        <BranchDeleteDialog info={branchDel} onCancel={() => setBranchDel(null)} onConfirm={async (mode, targetId) => { if (await actions.deleteBranch(branchDel.id, mode, targetId)) setBranchDel(null); }} />
      )}
    </div>
  );
}


function refMessage(c) {
  const r = c.refs || 0;
  const base = "This permanently removes the record from your archive.";
  if (r > 0) return `${base} It's currently referenced in ${r} other place${r === 1 ? "" : "s"}; those links will be cleaned up automatically.`;
  return base;
}

function singular(kind) { return ({ people: "person", locations: "location", events: "event", migrations: "migration", documents: "document", branches: "branch" })[kind] || kind; }

function rowName(kind, row, getP, getL) {
  if (kind === "people") return fullName(row);
  if (kind === "events" || kind === "documents" || kind === "locations") return row.title || row.name;
  if (kind === "branches") return row.name;
  if (kind === "migrations") return `${getL(row.from).name} → ${getL(row.to).name}`;
  return row.id;
}


function EntityList({ kind, q, getL, getP, onEdit, onDelete, onOpenPerson }) {
  const { data } = useData();
  let rows = data[kind] || [];
  const ql = q.toLowerCase();
  rows = rows.filter((r) => {
    if (!q) return true;
    if (kind === "people") return fullName(r).toLowerCase().includes(ql);
    if (kind === "locations") return (r.name + " " + r.region).toLowerCase().includes(ql);
    if (kind === "events") return (r.title + " " + r.year).toLowerCase().includes(ql);
    if (kind === "documents") return (r.title + " " + r.year).toLowerCase().includes(ql);
    if (kind === "branches") return r.name.toLowerCase().includes(ql);
    if (kind === "migrations") return (getL(r.from).name + " " + getL(r.to).name).toLowerCase().includes(ql);
    return true;
  });
  if ((data[kind] || []).length === 0) return <EmptyState inline icon={MANAGE_TABS.find((t) => t.id === kind).Icon} title={`No ${kind} yet`} msg={`Use “Add ${singular(kind)}” above to create your first record.`} />;
  if (rows.length === 0) return <div style={{ color: C.faint, fontSize: 13, padding: 24, textAlign: "center" }}>No {kind} match “{q}”.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => <EntityRow key={r.id} kind={kind} row={r} getL={getL} getP={getP} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onOpenPerson={onOpenPerson} />)}
    </div>
  );
}


function EntityRow({ kind, row, getL, getP, onEdit, onDelete, onOpenPerson }) {
  const {data} = useData();
  let lead, title, meta;
  if (kind === "people") {
    lead = <Avatar p={row} size={36} status="alive" />;
    title = fullName(row);
    meta = `${row.birth ?? "Unknown"}${row.death != null ? ` – ${row.death}` : row.deceased ? " – unknown" : " – present"} · ${(row.residences || []).length} residence${(row.residences || []).length === 1 ? "" : "s"}`;
  } else if (kind === "locations") {
    lead = <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.amber}1a`, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={17} /></div>;
    title = row.name; meta = `${row.region || "—"} · map ${row.x},${row.y}`;
  } else if (kind === "events") {
    const m = TYPE[row.type] || TYPE.milestone; lead = <div style={{ width: 36, height: 36, borderRadius: 9, background: `${m.color}1a`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}><m.Icon size={17} /></div>;
    title = row.title; meta = `${row.year} · ${m.label} · ${getL(row.at).name}`;
  } else if (kind === "migrations") {
    lead = <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.amber}1a`, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}><Route size={17} /></div>;
    title = `${getL(row.from).name} → ${getL(row.to).name}`;
    meta = `${row.startYear}${row.endYear ? `–${row.endYear}` : ""} · ${row.mode === "person" ? fullName(getP(row.personId)) : "branch"}`;
  } else if (kind === "documents") {
    const Dn = DOC_ICON[row.type] || FileText; lead = <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.rose}1a`, color: C.rose, display: "flex", alignItems: "center", justifyContent: "center" }}><Dn size={17} /></div>;
    title = row.title; meta = `${row.type} · ${row.year} · ${(row.people || []).length} linked`;
  } else if (kind === "branches") {
    lead = <div style={{ width: 36, height: 36, borderRadius: 9, background: `${row.color}22`, color: row.color, display: "flex", alignItems: "center", justifyContent: "center" }}><GitBranch size={17} /></div>;
    title = row.name; meta = `${data.people.filter((p) => (p.branches || []).includes(row.id)).length} members`;
  }
  return (
    <div className="fa-card fa-entity-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, background: C.panelSolid, border: `1px solid ${C.border}` }}>
      {lead}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{meta}</div>
      </div>
      {kind === "people" && <Btn kind="ghost" small icon={ChevronRight} onClick={() => onOpenPerson(row.id)}>Profile</Btn>}
      <Btn kind="soft" small icon={Pencil} onClick={onEdit}>Edit</Btn>
      <button onClick={onDelete} className="fa-click" title="Delete" style={{ background: `${C.danger}14`, border: `1px solid ${C.danger}44`, color: C.danger, borderRadius: 9, padding: 8 }}><Trash2 size={15} /></button>
    </div>
  );
}

/* --------------------------- RELATIONSHIPS TAB --------------------------- */

export { MANAGE_TABS, ManageView, refMessage, singular, rowName, EntityList, EntityRow };
