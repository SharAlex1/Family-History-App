import React from "react";
import { Users } from "lucide-react";
import { C } from "../../config/theme.js";
import { fullName, matchBranch } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { EmptyState } from "../../components/ui/Primitives.jsx";
import { PersonCard } from "../../components/people/PersonCard.jsx";

function PeopleView({ year, openPerson, branchSel, query }) {
  const { data } = useData();
  const list = data.people.filter((p) => matchBranch(p, branchSel)).filter((p) => !query || fullName(p).toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.birth - b.birth);
  if (data.people.length === 0) return <EmptyState icon={Users} title="No people yet" msg="Add family members in Manage Data." />;
  return (
    <div style={{ padding: "22px 24px 130px" }}>
      <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: "0 0 4px" }}>People</h2>
      <p style={{ color: C.faint, fontSize: 13, margin: "0 0 18px" }}>{list.length} members · ages shown for {year}.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>{list.map((p) => <PersonCard key={p.id} p={p} year={year} onClick={() => openPerson(p.id)} />)}</div>
    </div>
  );
}

/* ============================== DOCUMENTS ============================= */

export { PeopleView };
