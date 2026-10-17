import React, { useState, useEffect } from "react";
import { timeBounds } from "./utils/time.js";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import { useData } from "./state/DataContext.jsx";
import { DataProvider } from "./state/DataProvider.jsx";
import { Modal } from "./components/ui/Dialogs.jsx";
import { DashboardView } from "./features/dashboard/DashboardView.jsx";
import { FamilyTreeView } from "./features/tree/FamilyTreeView.jsx";
import { TimelineView } from "./features/timeline/TimelineView.jsx";
import { MapView } from "./features/map/MapView.jsx";
import { PeopleView } from "./features/people/PeopleView.jsx";
import { DocumentsView } from "./features/documents/DocumentsView.jsx";
import { ProfilePanel } from "./components/people/ProfilePanel.jsx";
import { PersonForm } from "./features/manage/forms/PersonForm.jsx";
import { ManageView } from "./features/manage/ManageView.jsx";
import { Sidebar, TopBar } from "./components/layout/Navigation.jsx";
import { TimeSlider } from "./components/layout/TimeSlider.jsx";
import { CSS } from "./styles/appStyles.js";

function AppShell() {
  const { data, getP, actions, notice, dirty } = useData();
  const bounds = timeBounds(data);
  const validBranches = branchSel => branchSel.filter(id => data.branches.some(b => b.id === id));
  const [view, setView] = useState("dashboard");
  const [year, setYear] = useState(1950);
  const [selectedId, setSelectedId] = useState(null);
  const [panelId, setPanelId] = useState(null);
  const [editPersonId, setEditPersonId] = useState(null);
  const [branchSel, setBranchSel] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [focusId, setFocusId] = useState(null);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setYear((y) => { if (y >= bounds.max) { setPlaying(false); return bounds.max; } return y + 1; }), 110);
    return () => clearInterval(t);
  }, [playing, bounds.max]);

  const openPerson = (id) => { setSelectedId(id); setPanelId(id); };
  const showSlider = ["tree", "timeline", "map", "people"].includes(view);
  useEffect(() => {
    setBranchSel(previous => { const next=validBranches(previous); return next.length===previous.length?previous:next; });
    setYear(y=>Math.max(bounds.min,Math.min(bounds.max,y)));
    for (const [id,set] of [[selectedId,setSelectedId],[panelId,setPanelId],[editPersonId,setEditPersonId],[focusId,setFocusId]]) if(id&&!data.people.some(p=>p.id===id))set(null);
  }, [data, bounds.min, bounds.max, selectedId, panelId, editPersonId, focusId]);

  return (
    <>
      <div id="fa-root">
        <style>{CSS}</style>
        <Sidebar view={view} setView={setView} />
        <div className="fa-main">
          {notice && <div role="alert" className="fa-notice"><span>{notice}</span><div><button onClick={actions.exportData}>Export current work</button><button onClick={actions.exportOriginal}>Export original</button>{dirty && <button onClick={actions.retrySave}>Retry save</button>}<button onClick={() => { if (!dirty || window.confirm('Discard unsaved changes and load the latest saved archive?')) actions.loadLatest(); }}>Load latest archive</button>{!dirty && <button onClick={actions.dismissNotice}>Dismiss</button>}</div></div>}
          <TopBar branchSel={branchSel} setBranchSel={setBranchSel} query={query} setQuery={setQuery} openPerson={openPerson} />
          <div className="fa-content">
            {view === "dashboard" && <DashboardView year={year} setView={setView} />}
            {view === "tree" && <FamilyTreeView year={year} selectedId={selectedId} openPerson={openPerson} branchSel={branchSel} />}
            {view === "timeline" && <TimelineView year={year} openPerson={openPerson} typeFilter={typeFilter} setTypeFilter={setTypeFilter} branchSel={branchSel} focusId={focusId} clearFocus={() => setFocusId(null)} />}
            {view === "map" && <MapView year={year} selectedId={selectedId} openPerson={openPerson} branchSel={branchSel} />}
            {view === "people" && <PeopleView clearFilters={() => {setQuery("");setBranchSel([]);}} year={year} openPerson={openPerson} branchSel={branchSel} query={query} />}
            {view === "documents" && <DocumentsView openPerson={openPerson} />}
            {view === "manage" && <ManageView openPerson={openPerson} />}
          </div>
          {showSlider && <TimeSlider year={year} setYear={setYear} playing={playing} setPlaying={setPlaying} />}
        </div>
        {panelId && (
          <ProfilePanel id={panelId} year={year} onClose={() => setPanelId(null)} openPerson={openPerson} setView={setView} focusPerson={() => { setFocusId(panelId); setTypeFilter("all"); }} onEdit={(pid) => { setPanelId(null); setView("manage"); setEditPersonId(pid); }} />
        )}
        {editPersonId && (
          <Modal wide title="Edit person" subtitle="Fields marked * are required." onClose={() => setEditPersonId(null)}>
            <PersonForm value={getP(editPersonId)} onSave={async (payload) => { if (await actions.savePerson(payload)) setEditPersonId(null); }} onCancel={() => setEditPersonId(null)} />
          </Modal>
        )}
      </div>
    </>
  );
}

/* ================================= CSS ================================= */

export default function App() {
  return <ErrorBoundary><DataProvider><AppShell /></DataProvider></ErrorBoundary>;
}
