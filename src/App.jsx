import React, { useState, useEffect } from "react";
import { MAX_YEAR } from "./config/theme.js";
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
    const t = setInterval(() => setYear((y) => { if (y >= MAX_YEAR) { setPlaying(false); return MAX_YEAR; } return y + 1; }), 110);
    return () => clearInterval(t);
  }, [playing]);

  const openPerson = (id) => { setSelectedId(id); setPanelId(id); };
  const showSlider = ["tree", "timeline", "map", "people"].includes(view);
  const { getP, actions } = useData();

  return (
    <>
      <div id="fa-root">
        <style>{CSS}</style>
        <Sidebar view={view} setView={setView} />
        <div className="fa-main">
          <TopBar branchSel={branchSel} setBranchSel={setBranchSel} query={query} setQuery={setQuery} openPerson={openPerson} />
          <div className="fa-content">
            {view === "dashboard" && <DashboardView year={year} setView={setView} />}
            {view === "tree" && <FamilyTreeView year={year} selectedId={selectedId} openPerson={openPerson} branchSel={branchSel} />}
            {view === "timeline" && <TimelineView year={year} openPerson={openPerson} typeFilter={typeFilter} setTypeFilter={setTypeFilter} branchSel={branchSel} focusId={focusId} clearFocus={() => setFocusId(null)} />}
            {view === "map" && <MapView year={year} selectedId={selectedId} openPerson={openPerson} branchSel={branchSel} />}
            {view === "people" && <PeopleView year={year} openPerson={openPerson} branchSel={branchSel} query={query} />}
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
            <PersonForm value={getP(editPersonId)} onSave={(payload) => { actions.savePerson(payload); setEditPersonId(null); }} onCancel={() => setEditPersonId(null)} />
          </Modal>
        )}
      </div>
    </>
  );
}

/* ================================= CSS ================================= */

export default function App() {
  return <DataProvider><AppShell /></DataProvider>;
}
